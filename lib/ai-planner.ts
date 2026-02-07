/**
 * AI Planner — Core AI calling logic and generation orchestration.
 *
 * Prompt templates and formulas live in ./ai-algorithms.ts so you can tweak
 * them independently. This file handles the OpenRouter API calls, JSON parsing,
 * and the generate* functions that compose everything together.
 */

import {
  type GoalWithWeight,
  formatGoalsForPrompt,
  averageMultiplier,
  monthlyTaskCount,
  weeklyTaskCount,
  dailyTaskCount,
  yearlyPlanSystemPrompt,
  monthlyTasksSystemPrompt,
  weeklyTasksSystemPrompt,
  dailyTasksSystemPrompt,
} from "./ai-algorithms";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GoalInput {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  frequency: string | null;
  category: string;
}

export interface MonthSummary {
  month: number;
  focus: string;
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

// ─── Core AI Call ────────────────────────────────────────────────────────────

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

// ─── Helpers to convert GoalInput → GoalWithWeight ──────────────────────────

function toWeighted(goals: GoalInput[]): GoalWithWeight[] {
  return goals.map((g) => ({
    title: g.title,
    description: g.description,
    multiplier: g.multiplier,
    frequency: g.frequency,
    category: g.category,
  }));
}

// ─── Yearly Plan Generation ─────────────────────────────────────────────────

export async function generateYearlyPlan(
  goals: GoalInput[],
  year: number,
  currentMonth: number,
): Promise<YearlyPlan> {
  const weighted = toWeighted(goals);
  const goalList = formatGoalsForPrompt(weighted);

  const remainingMonths = MONTH_NAMES.slice(currentMonth)
    .map((name, i) => `${name} (month ${currentMonth + i})`)
    .join(", ");

  const pastMonthsNote = currentMonth > 0
    ? `Months already passed: ${MONTH_NAMES.slice(0, currentMonth).join(", ")}. Do NOT include these.`
    : "This is the start of the year.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: yearlyPlanSystemPrompt(remainingMonths, pastMonthsNote, MONTH_NAMES[currentMonth], currentMonth),
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
  const weighted = toWeighted(goals);
  const goalList = formatGoalsForPrompt(weighted);
  const avgMult = averageMultiplier(weighted);
  const taskRange = monthlyTaskCount(remainingDaysInMonth, avgMult);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: monthlyTasksSystemPrompt(remainingDaysInMonth, taskRange),
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

// ─── Weekly Task Generation ─────────────────────────────────────────────────

export async function generateWeeklyTasks(
  monthTasks: { title: string; completed: boolean }[],
  weekNumber: number,
  totalWeeksInMonth: number,
  remainingDaysThisWeek: string[],
  previousWeekCompletion: CompletionContext | null,
  goals: GoalInput[],
  workingDays: number[],
): Promise<TaskItem[]> {
  const weighted = toWeighted(goals);
  const avgMult = averageMultiplier(weighted);

  const taskList = monthTasks
    .map((t) => `- [${t.completed ? "x" : " "}] ${t.title}`)
    .join("\n");

  const daysStr = remainingDaysThisWeek.join(", ");
  const numDays = remainingDaysThisWeek.length;
  const taskRange = weeklyTaskCount(numDays, avgMult);

  let adjustmentNote = "";
  if (previousWeekCompletion) {
    const { completionRate, incomplete } = previousWeekCompletion;
    if (incomplete.length > 0) {
      adjustmentNote = `\nLast week's completion rate: ${Math.round(completionRate * 100)}%.
Incomplete from last week: ${incomplete.map((t) => t.title).join(", ")}.
Carry over important incomplete tasks and adjust the load.`;
    }
  }

  const goalContext = formatGoalsForPrompt(weighted);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: weeklyTasksSystemPrompt(daysStr, numDays, weekNumber, totalWeeksInMonth, taskRange, workingDays),
    },
    {
      role: "user",
      content: `Week ${weekNumber} of ${totalWeeksInMonth}
Remaining days: ${daysStr}

Goals:\n${goalContext}

Monthly tasks:\n${taskList}${adjustmentNote}

Generate tasks for the remaining days of this week.`,
    },
  ];

  const raw = await callAI(messages);
  const parsed = parseJSON<{ tasks: TaskItem[] }>(raw);
  return parsed.tasks;
}

// ─── Daily Task Generation ──────────────────────────────────────────────────

export async function generateDailyTasks(
  weekTasks: { title: string; completed: boolean }[],
  dayOfWeek: number,
  dayOfMonth: number,
  remainingDaysInWeek: number,
  previousDayCompletion: CompletionContext | null,
  goals: GoalInput[],
  workingDays: number[],
): Promise<TaskItem[]> {
  const weighted = toWeighted(goals);
  const avgMult = averageMultiplier(weighted);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isWorkingDay = workingDays.includes(dayOfWeek);
  const taskRange = isWorkingDay
    ? dailyTaskCount(isWeekend, avgMult)
    : { min: 1, max: 3 }; // rest days get minimal tasks

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

  const goalContext = formatGoalsForPrompt(weighted);

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: dailyTasksSystemPrompt(
        DAY_NAMES[dayOfWeek],
        dayOfMonth,
        remainingDaysInWeek,
        isWeekend,
        isWorkingDay,
        taskRange,
      ),
    },
    {
      role: "user",
      content: `Day: ${DAY_NAMES[dayOfWeek]}, the ${dayOfMonth}th (${remainingDaysInWeek} days left this week)

Goals:\n${goalContext}

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
  const days: string[] = [];
  for (let i = dayOfWeek; i <= 6; i++) {
    days.push(DAY_NAMES[i]);
  }
  return days;
}

export function getRemainingDaysCountInWeek(dayOfWeek: number): number {
  return 7 - dayOfWeek;
}
