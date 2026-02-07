/**
 * AI Planner Algorithm — Dedicated file for all AI planning logic.
 *
 * This file is intentionally isolated so it can be improved independently.
 * All prompt engineering, plan generation, and adjustment logic lives here.
 *
 * Flow: Yearly Goals → Monthly Plans (remaining months only) →
 *       Weekly Tasks (remaining weeks) → Daily Tasks (remaining days) →
 *       Detailed plan for today
 *
 * Key principle: never plan for the past. If it's Wednesday, the week plan
 * covers Wed–Sun. If it's February, the year plan covers Feb–Dec.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GoalInput {
  id: string;
  title: string;
  description: string;
}

export interface MonthSummary {
  month: number; // 0-11
  focus: string; // high-level focus for this month
}

export interface YearlyPlan {
  months: MonthSummary[];
}

export interface TaskItem {
  title: string;
  description?: string;
}

export interface CompletionContext {
  completed: { title: string }[];
  incomplete: { title: string }[];
  completionRate: number;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

// ─── Core AI Call (server-side, calls OpenRouter directly) ───────────────────

const DEFAULT_MODEL = "google/gemini-2.0-flash-001";

async function callAI(messages: ChatMessage[], jsonMode = true): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Smart Planner",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      ...(jsonMode && { response_format: { type: "json_object" } }),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`AI call failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function parseJSON<T>(raw: string): T {
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Yearly Plan Generation (remaining months only) ─────────────────────────

export async function generateYearlyPlan(
  goals: GoalInput[],
  year: number,
  currentMonth: number,
): Promise<YearlyPlan> {
  const goalList = goals
    .map((g, i) => `${i + 1}. ${g.title}: ${g.description}`)
    .join("\n");

  const remainingMonths = MONTH_NAMES.slice(currentMonth)
    .map((name, i) => `${name} (month ${currentMonth + i})`)
    .join(", ");

  const pastMonths = currentMonth > 0
    ? `Months already passed: ${MONTH_NAMES.slice(0, currentMonth).join(", ")}. Do NOT include these.`
    : "This is the start of the year.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a strategic life planner. Create a HIGH-LEVEL plan for the REMAINING months of the year only.

Rules:
- ONLY plan for these remaining months: ${remainingMonths}
- ${pastMonths}
- Each month should have a brief focus area (1-2 sentences max)
- Think about natural progression and dependencies
- The current month (${MONTH_NAMES[currentMonth]}) should start immediately actionable
- Later months build on earlier progress
- Be realistic about time

Respond in JSON: {"months": [{"month": <0-indexed>, "focus": "..."}]}
Only include months from ${currentMonth} to 11.`,
    },
    {
      role: "user",
      content: `Year: ${year}, Current month: ${MONTH_NAMES[currentMonth]}\n\nGoals:\n${goalList}\n\nCreate a high-level monthly focus plan for the remaining months.`,
    },
  ];

  const raw = await callAI(messages);
  return parseJSON<YearlyPlan>(raw);
}

// ─── Monthly Task Generation ────────────────────────────────────────────────

export async function generateMonthlyTasks(
  goals: GoalInput[],
  monthFocus: string,
  month: number,
  year: number,
  remainingDaysInMonth: number,
): Promise<TaskItem[]> {
  const goalList = goals
    .map((g, i) => `${i + 1}. ${g.title}: ${g.description}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a task planner. Generate high-level monthly tasks based on the focus area and goals.

Rules:
- There are ${remainingDaysInMonth} days remaining in this month
- Generate 4-8 high-level tasks scaled to the remaining time
- If only a few days remain, keep it to 2-4 achievable tasks
- Tasks should be concrete but not overly detailed
- Mix tasks from different goals if the focus area covers multiple
- Tasks should build on each other logically

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`,
    },
    {
      role: "user",
      content: `Month: ${MONTH_NAMES[month]} ${year} (${remainingDaysInMonth} days remaining)
Focus: ${monthFocus}

Goals:\n${goalList}

Generate tasks for the remaining time this month.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Weekly Task Generation (remaining days of week only) ───────────────────

export async function generateWeeklyTasks(
  monthTasks: { title: string; completed: boolean }[],
  weekNumber: number,
  totalWeeksInMonth: number,
  remainingDaysThisWeek: string[], // e.g. ["Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
  previousWeekCompletion: CompletionContext | null,
): Promise<TaskItem[]> {
  const taskList = monthTasks
    .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
    .join("\n");

  const daysStr = remainingDaysThisWeek.join(", ");
  const numDays = remainingDaysThisWeek.length;

  let adjustmentNote = "";
  if (previousWeekCompletion) {
    const { completionRate, incomplete } = previousWeekCompletion;
    if (incomplete.length > 0) {
      adjustmentNote = `\nLast week's completion rate: ${Math.round(completionRate * 100)}%.
Incomplete from last week: ${incomplete.map((t) => t.title).join(", ")}.
Carry over important incomplete tasks and adjust the load.`;
    }
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a weekly task planner. Break monthly tasks into work for the remaining days of this week.

Rules:
- This week only has these days remaining: ${daysStr} (${numDays} days)
- Generate tasks proportional to the remaining days (roughly 1-2 tasks per day)
- Slightly overestimate — add ~20% buffer for unexpected delays
- If previous week had incomplete tasks, carry those forward first
- This is week ${weekNumber} of ${totalWeeksInMonth} in the month
- Tasks should be specific enough to act on

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`,
    },
    {
      role: "user",
      content: `Week ${weekNumber} of ${totalWeeksInMonth}
Remaining days: ${daysStr}

Monthly tasks:\n${taskList}${adjustmentNote}

Generate tasks for the remaining days of this week.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Daily Task Generation (detailed for today) ─────────────────────────────

export async function generateDailyTasks(
  weekTasks: { title: string; completed: boolean }[],
  dayOfWeek: number,
  dayOfMonth: number,
  remainingDaysInWeek: number,
  previousDayCompletion: CompletionContext | null,
): Promise<TaskItem[]> {
  const taskList = weekTasks
    .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
    .join("\n");

  let adjustmentNote = "";
  if (previousDayCompletion) {
    const { completionRate, incomplete } = previousDayCompletion;
    if (incomplete.length > 0) {
      adjustmentNote = `\nYesterday's completion rate: ${Math.round(completionRate * 100)}%.
Incomplete from yesterday: ${incomplete.map((t) => t.title).join(", ")}.
Redistribute incomplete work into today. If rate was low, reduce load to be realistic.`;
    } else {
      adjustmentNote = `\nYesterday: 100% completion! Keep the momentum — can add a stretch task.`;
    }
  }

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a detailed daily task planner. Create a DETAILED task list for today.

Rules:
- Today is ${DAY_NAMES[dayOfWeek]}, the ${dayOfMonth}th
- There are ${remainingDaysInWeek} days left in the week (including today)
- Generate 3-6 DETAILED tasks — each with a clear, actionable description
- Descriptions should explain exactly what to do, not just repeat the title
- Overestimate slightly — plan for ~110% of realistic capacity
- ${isWeekend ? "It's the weekend — lighter load, focus on personal goals or catch-up" : "Weekday — full productivity mode"}
- If previous day had incomplete tasks, redistribute them
- Order tasks by priority (most important first)
- Each task should be completable in 1-3 hours

Respond in JSON: {"tasks": [{"title": "...", "description": "Detailed steps and what success looks like"}]}`,
    },
    {
      role: "user",
      content: `Day: ${DAY_NAMES[dayOfWeek]}, the ${dayOfMonth}th (${remainingDaysInWeek} days left this week)

Weekly tasks:\n${taskList}${adjustmentNote}

Generate today's detailed task list.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Utility Functions ──────────────────────────────────────────────────────

export function getCurrentWeekOfMonth(): number {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((today.getDate() + firstDayOfWeek) / 7);
}

export function getTotalWeeksInMonth(year: number, month: number): number {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((lastDay.getDate() + firstDayOfWeek) / 7);
}

export function getRemainingDaysOfWeek(dayOfWeek: number): string[] {
  // Returns day names from today through end of week (Saturday)
  // dayOfWeek: 0=Sunday, 6=Saturday
  const days: string[] = [];
  for (let i = dayOfWeek; i <= 6; i++) {
    days.push(DAY_NAMES[i]);
  }
  return days;
}

export function getRemainingDaysCountInWeek(dayOfWeek: number): number {
  return 7 - dayOfWeek; // including today
}
