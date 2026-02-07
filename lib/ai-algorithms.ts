/**
 * AI Algorithms — Prompt templates, task distribution formulas, and configurable constants.
 *
 * This file is the "knobs" file. Modify prompts, adjust task counts, change
 * distribution weights, or tweak timing constants here without touching the
 * core AI planner logic.
 */

// ─── Configurable Constants ─────────────────────────────────────────────────

/** Timeline display range */
export const TIMELINE_START_HOUR = 7;
export const TIMELINE_END_HOUR = 22;

/** Task block duration in hours (for distributing tasks across timeline) */
export const TASK_BLOCK_HOURS = 2;

/** Starting hour for first task of the day */
export const FIRST_TASK_HOUR = 8;

// ─── Task Count Formulas ─────────────────────────────────────────────────────

export interface GoalWithWeight {
  title: string;
  description: string;
  multiplier: number;    // 1-5
  frequency: string | null; // e.g. "5/day", "3/week"
  category: string;      // "habit", "milestone", "growth"
}

/**
 * Calculate target monthly task count based on remaining days and goal weights.
 * Base: 4-8 tasks. Multiplier shifts the range up.
 */
export function monthlyTaskCount(remainingDays: number, avgMultiplier: number): { min: number; max: number } {
  const base = remainingDays <= 7 ? { min: 2, max: 4 } : { min: 4, max: 8 };
  const boost = Math.max(0, (avgMultiplier - 1) * 0.5);
  return {
    min: Math.round(base.min + boost),
    max: Math.round(base.max + boost * 2),
  };
}

/**
 * Calculate target weekly task count based on remaining days.
 * Roughly 1-2 tasks per day, adjusted by multiplier.
 */
export function weeklyTaskCount(remainingDays: number, avgMultiplier: number): { min: number; max: number } {
  const base = Math.max(2, remainingDays);
  const boost = Math.max(0, (avgMultiplier - 1) * 0.3);
  return {
    min: Math.round(base * (1 + boost)),
    max: Math.round(base * 2 * (1 + boost)),
  };
}

/**
 * Calculate target daily task count.
 * Base: 3-6. Weekend: 2-4. Adjusted by multiplier.
 */
export function dailyTaskCount(isWeekend: boolean, avgMultiplier: number): { min: number; max: number } {
  const base = isWeekend ? { min: 2, max: 4 } : { min: 3, max: 6 };
  const boost = Math.max(0, (avgMultiplier - 1) * 0.3);
  return {
    min: Math.round(base.min + boost),
    max: Math.round(base.max + boost * 2),
  };
}

// ─── Goal Formatting ─────────────────────────────────────────────────────────

/**
 * Format goals with their weights for AI prompts.
 * Goals sorted by multiplier (highest first).
 */
export function formatGoalsForPrompt(goals: GoalWithWeight[]): string {
  const sorted = [...goals].sort((a, b) => b.multiplier - a.multiplier);
  return sorted
    .map((g, i) => {
      let line = `${i + 1}. ${g.title}: ${g.description}`;
      line += ` [priority: ${g.multiplier}/5]`;
      if (g.frequency) line += ` [target: ${g.frequency}]`;
      if (g.category !== "growth") line += ` [type: ${g.category}]`;
      return line;
    })
    .join("\n");
}

/**
 * Calculate average multiplier across goals.
 */
export function averageMultiplier(goals: GoalWithWeight[]): number {
  if (goals.length === 0) return 1;
  return goals.reduce((sum, g) => sum + g.multiplier, 0) / goals.length;
}

// ─── Prompt Templates ────────────────────────────────────────────────────────

export function yearlyPlanSystemPrompt(
  remainingMonths: string,
  pastMonthsNote: string,
  currentMonthName: string,
  currentMonth: number,
): string {
  return `You are a strategic life planner. Create a HIGH-LEVEL plan for the REMAINING months of the year only.

Rules:
- ONLY plan for these remaining months: ${remainingMonths}
- ${pastMonthsNote}
- Each month should have a brief focus area (1-2 sentences max)
- Think about natural progression and dependencies
- The current month (${currentMonthName}) should start immediately actionable
- Later months build on earlier progress
- Be realistic about time
- Goals with higher priority weights should get proportionally more attention
- Habit-type goals should appear consistently across months
- Milestone-type goals should have clear target months

Respond in JSON: {"months": [{"month": <0-indexed>, "focus": "..."}]}
Only include months from ${currentMonth} to 11.`;
}

export function monthlyTasksSystemPrompt(
  remainingDays: number,
  taskRange: { min: number; max: number },
): string {
  return `You are a task planner. Generate high-level monthly tasks based on the focus area and goals.

Rules:
- There are ${remainingDays} days remaining in this month
- Generate ${taskRange.min}-${taskRange.max} high-level tasks scaled to the remaining time
- If only a few days remain, keep it to ${taskRange.min} achievable tasks
- Tasks should be concrete but not overly detailed
- Allocate MORE tasks to goals with higher priority weights
- For goals with frequency targets (e.g. "5x/day"), include tasks that establish the habit
- Mix tasks from different goals if the focus area covers multiple
- Tasks should build on each other logically

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`;
}

export function weeklyTasksSystemPrompt(
  daysStr: string,
  numDays: number,
  weekNumber: number,
  totalWeeks: number,
  taskRange: { min: number; max: number },
  workingDays: number[],
): string {
  const workingDayNames = workingDays.map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ");
  return `You are a weekly task planner. Break monthly tasks into work for the remaining days of this week.

Rules:
- This week only has these days remaining: ${daysStr} (${numDays} days)
- Working days are: ${workingDayNames}. Only assign significant tasks on working days.
- Non-working days should only have light personal/habit tasks if any.
- Generate ${taskRange.min}-${taskRange.max} tasks total
- Slightly overestimate — add ~20% buffer for unexpected delays
- If previous week had incomplete tasks, carry those forward first
- This is week ${weekNumber} of ${totalWeeks} in the month
- Tasks should be specific enough to act on
- Allocate more tasks to higher-priority goals

Respond in JSON: {"tasks": [{"title": "...", "description": "..."}]}`;
}

export function dailyTasksSystemPrompt(
  dayName: string,
  dayOfMonth: number,
  remainingDaysInWeek: number,
  isWeekend: boolean,
  isWorkingDay: boolean,
  taskRange: { min: number; max: number },
): string {
  const dayType = !isWorkingDay
    ? "This is a REST DAY — only include light personal tasks or habit check-ins, no heavy work"
    : isWeekend
      ? "It's the weekend — lighter load, focus on personal goals or catch-up"
      : "Weekday — full productivity mode";

  return `You are a detailed daily task planner. Create a DETAILED task list for today.

Rules:
- Today is ${dayName}, the ${dayOfMonth}th
- There are ${remainingDaysInWeek} days left in the week (including today)
- ${dayType}
- Generate ${taskRange.min}-${taskRange.max} DETAILED tasks — each with a clear, actionable description
- Descriptions should explain exactly what to do, not just repeat the title
- Overestimate slightly — plan for ~110% of realistic capacity
- If previous day had incomplete tasks, redistribute them
- Order tasks by priority (most important first)
- Each task should be completable in 1-3 hours
- For goals with frequency targets, include those as discrete tasks (e.g. "Practice piano - session 3 of 5")

Respond in JSON: {"tasks": [{"title": "...", "description": "Detailed steps and what success looks like"}]}`;
}
