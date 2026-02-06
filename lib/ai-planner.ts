/**
 * AI Planner Algorithm — Dedicated file for all AI planning logic.
 *
 * This file is intentionally isolated so it can be improved independently.
 * All prompt engineering, plan generation, and adjustment logic lives here.
 *
 * Flow: Yearly Goals → Monthly Plans → Weekly Tasks → Daily Tasks
 * Each level is a high-level summary, not a detailed breakdown.
 * Daily plans overestimate slightly and adjust based on previous completion.
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
  // Strip markdown code fences if present
  const cleaned = raw.replace(/```(?:json)?\s*/g, "").replace(/```\s*/g, "").trim();
  return JSON.parse(cleaned);
}

// ─── Goal-Setting Chat ──────────────────────────────────────────────────────

const GOAL_SYSTEM_PROMPT = `You are an AI life planner helping the user set their yearly goals for the current year.

Your job:
1. Ask smart, focused questions to understand what the user wants to achieve this year
2. Cover different life areas: career, health, learning, personal, financial, relationships
3. Don't overwhelm — ask 1-2 questions at a time
4. After gathering enough info (usually 3-4 exchanges), summarize the goals and ask for confirmation
5. When the user confirms, respond with EXACTLY this JSON format and nothing else:

{"done": true, "goals": [{"title": "Goal title", "description": "Brief description"}]}

Until goals are confirmed, respond conversationally (not JSON). Be concise and encouraging.
Keep responses under 150 words.`;

export function getGoalSystemPrompt(year: number): ChatMessage {
  return {
    role: "system",
    content: GOAL_SYSTEM_PROMPT.replace("the current year", String(year)),
  };
}

export async function chatForGoals(
  messages: ChatMessage[],
): Promise<string> {
  return callAI(messages, false);
}

export function parseGoalCompletion(
  response: string,
): { done: true; goals: { title: string; description: string }[] } | null {
  try {
    // Check if the response contains the done:true JSON
    const jsonMatch = response.match(/\{[\s\S]*"done"\s*:\s*true[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (parsed.done && Array.isArray(parsed.goals)) return parsed;
    return null;
  } catch {
    return null;
  }
}

// ─── Yearly Plan Generation ─────────────────────────────────────────────────

export async function generateYearlyPlan(
  goals: GoalInput[],
  year: number,
): Promise<YearlyPlan> {
  const goalList = goals
    .map((g, i) => `${i + 1}. ${g.title}: ${g.description}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a strategic life planner. Create a HIGH-LEVEL yearly plan that distributes goal work across 12 months.

Rules:
- Each month should have a brief focus area (1-2 sentences max)
- Think about natural progression and dependencies
- Earlier months: foundation and habits. Later months: advanced milestones
- Be realistic about time — don't cram everything into month 1
- Consider seasonal factors (new year motivation, summer energy, year-end push)

Respond in JSON: {"months": [{"month": 0, "focus": "..."}, ..., {"month": 11, "focus": "..."}]}
Month numbers are 0-indexed (0=January, 11=December).`,
    },
    {
      role: "user",
      content: `Year: ${year}\n\nGoals:\n${goalList}\n\nCreate a high-level monthly focus plan.`,
    },
  ];

  const raw = await callAI(messages);
  return parseJSON<YearlyPlan>(raw);
}

// ─── Monthly Plan Generation ────────────────────────────────────────────────

export async function generateMonthlyTasks(
  goals: GoalInput[],
  monthFocus: string,
  month: number,
  year: number,
): Promise<TaskItem[]> {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const goalList = goals
    .map((g, i) => `${i + 1}. ${g.title}: ${g.description}`)
    .join("\n");

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a task planner. Generate monthly tasks based on the focus area and goals.

Rules:
- Generate 4-8 high-level tasks for the month
- Tasks should be concrete but not overly detailed
- Each task should be achievable within a month
- Mix tasks from different goals if the focus area covers multiple
- Tasks should build on each other logically

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`,
    },
    {
      role: "user",
      content: `Month: ${monthNames[month]} ${year}
Focus: ${monthFocus}

Goals:\n${goalList}

Generate tasks for this month.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Weekly Plan Generation ─────────────────────────────────────────────────

export async function generateWeeklyTasks(
  monthTasks: { title: string; completed: boolean }[],
  weekNumber: number,
  totalWeeksInMonth: number,
  previousWeekCompletion: CompletionContext | null,
): Promise<TaskItem[]> {
  const taskList = monthTasks
    .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
    .join("\n");

  let adjustmentNote = "";
  if (previousWeekCompletion) {
    const { completionRate, incomplete } = previousWeekCompletion;
    if (incomplete.length > 0) {
      adjustmentNote = `\nLast week's completion rate: ${Math.round(completionRate * 100)}%.
Incomplete from last week: ${incomplete.map((t) => t.title).join(", ")}.
Carry over important incomplete tasks and adjust this week's load.`;
    }
  }

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a weekly task planner. Break monthly tasks into a week's worth of work.

Rules:
- Generate 5-10 tasks for the week
- Slightly overestimate — add ~20% more than seems doable (buffer for unexpected delays)
- If previous week had incomplete tasks, prioritize carrying those forward
- Distribute work considering this is week ${weekNumber} of ${totalWeeksInMonth}
- Tasks should be specific enough to act on but not micro-managed
- Earlier weeks: setup and momentum. Later weeks: completion and polish

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`,
    },
    {
      role: "user",
      content: `Week ${weekNumber} of ${totalWeeksInMonth}

Monthly tasks:\n${taskList}${adjustmentNote}

Generate this week's tasks.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Daily Plan Generation ──────────────────────────────────────────────────

export async function generateDailyTasks(
  weekTasks: { title: string; completed: boolean }[],
  dayOfWeek: number, // 0=Sunday
  dayOfMonth: number,
  previousDayCompletion: CompletionContext | null,
): Promise<TaskItem[]> {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const taskList = weekTasks
    .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
    .join("\n");

  let adjustmentNote = "";
  if (previousDayCompletion) {
    const { completionRate, incomplete } = previousDayCompletion;
    if (incomplete.length > 0) {
      adjustmentNote = `\nYesterday's completion rate: ${Math.round(completionRate * 100)}%.
Incomplete from yesterday: ${incomplete.map((t) => t.title).join(", ")}.
Redistribute incomplete work into today. If yesterday's rate was low, reduce today's load slightly to be realistic.`;
    } else {
      adjustmentNote = `\nYesterday: 100% completion! Keep the momentum — can add a stretch task.`;
    }
  }

  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are a daily task planner. Create today's task list from the weekly plan.

Rules:
- Generate 3-6 tasks for today
- Overestimate slightly — plan for ~110% of realistic capacity
- ${isWeekend ? "It's the weekend — lighter load, focus on personal goals or catch-up" : "It's a weekday — full productivity mode"}
- If previous day had incomplete tasks, redistribute them
- If previous day was 100%, consider adding a bonus stretch task
- Order tasks by priority (most important first)
- Each task should be completable in 1-3 hours

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`,
    },
    {
      role: "user",
      content: `Day: ${dayNames[dayOfWeek]}, the ${dayOfMonth}th

Weekly tasks:\n${taskList}${adjustmentNote}

Generate today's tasks.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Full Plan Generation Cascade ───────────────────────────────────────────

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
