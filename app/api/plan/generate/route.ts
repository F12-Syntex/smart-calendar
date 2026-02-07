import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  generateYearlyPlan,
  generateMonthlyTasks,
  generateWeeklyTasks,
  generateDailyTasks,
  getCurrentWeekOfMonth,
  getTotalWeeksInMonth,
  getRemainingDaysOfWeek,
  getRemainingDaysCountInWeek,
} from "@/lib/ai-planner";
import type { GoalInput, CompletionContext } from "@/lib/ai-planner";

async function getWorkingDays(): Promise<number[]> {
  let settings = await prisma.settings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.settings.create({
      data: { id: "default", workingDays: "1,2,3,4,5" },
    });
  }
  return settings.workingDays.split(",").map(Number);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { scope } = body; // "full" | "week" | "day"

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const weekOfMonth = getCurrentWeekOfMonth();
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const remainingDaysInMonth = daysInMonth - dayOfMonth + 1;

  const goals = await prisma.goal.findMany({
    where: { year },
    include: { monthlyPlans: true },
  });

  if (goals.length === 0) {
    return NextResponse.json(
      { error: "No goals set for this year" },
      { status: 400 },
    );
  }

  const goalInputs: GoalInput[] = goals.map((g) => ({
    id: g.id,
    title: g.title,
    description: g.description,
    multiplier: g.multiplier,
    frequency: g.frequency,
    category: g.category,
  }));

  const workingDays = await getWorkingDays();

  try {
    if (scope === "full") {
      // ── Step 1: Yearly plan (remaining months only) ──
      const yearlyPlan = await generateYearlyPlan(goalInputs, year, month);

      for (const monthSummary of yearlyPlan.months) {
        await prisma.monthlyPlan.deleteMany({
          where: {
            year,
            month: monthSummary.month,
            goalId: { in: goals.map((g) => g.id) },
          },
        });

        await prisma.monthlyPlan.create({
          data: {
            goalId: goals[0].id,
            month: monthSummary.month,
            year,
            summary: monthSummary.focus,
          },
        });
      }

      // ── Step 2: Current month's tasks ──
      const currentMonthFocus =
        yearlyPlan.months.find((m) => m.month === month)?.focus ||
        "Focus on your goals";

      await prisma.task.deleteMany({
        where: { scope: "month", scopeYear: year, scopeMonth: month },
      });

      const monthTasks = await generateMonthlyTasks(
        goalInputs,
        currentMonthFocus,
        month,
        year,
        remainingDaysInMonth,
      );

      for (let i = 0; i < monthTasks.length; i++) {
        await prisma.task.create({
          data: {
            title: monthTasks[i].title,
            description: monthTasks[i].description || null,
            scope: "month",
            scopeYear: year,
            scopeMonth: month,
            sortOrder: i,
          },
        });
      }

      // ── Step 3: Current week's tasks ──
      await generateAndSaveWeekTasks(year, month, weekOfMonth, dayOfWeek, goalInputs, workingDays);

      // ── Step 4: Today's detailed tasks ──
      await generateAndSaveDayTasks(year, month, weekOfMonth, dayOfMonth, dayOfWeek, goalInputs, workingDays);
    } else if (scope === "week") {
      await generateAndSaveWeekTasks(year, month, weekOfMonth, dayOfWeek, goalInputs, workingDays);
      await generateAndSaveDayTasks(year, month, weekOfMonth, dayOfMonth, dayOfWeek, goalInputs, workingDays);
    } else if (scope === "day") {
      await generateAndSaveDayTasks(year, month, weekOfMonth, dayOfMonth, dayOfWeek, goalInputs, workingDays);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plan generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Plan generation failed" },
      { status: 500 },
    );
  }
}

async function generateAndSaveWeekTasks(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfWeek: number,
  goalInputs: GoalInput[],
  workingDays: number[],
) {
  const monthTasks = await prisma.task.findMany({
    where: { scope: "month", scopeYear: year, scopeMonth: month },
  });

  let prevWeekCompletion: CompletionContext | null = null;
  if (weekOfMonth > 1) {
    const prevWeekTasks = await prisma.task.findMany({
      where: {
        scope: "week",
        scopeYear: year,
        scopeMonth: month,
        scopeWeek: weekOfMonth - 1,
      },
    });
    if (prevWeekTasks.length > 0) {
      const completed = prevWeekTasks.filter((t) => t.completed);
      prevWeekCompletion = {
        completed: completed.map((t) => ({ title: t.title })),
        incomplete: prevWeekTasks.filter((t) => !t.completed).map((t) => ({ title: t.title })),
        completionRate: completed.length / prevWeekTasks.length,
      };
    }
  }

  await prisma.task.deleteMany({
    where: { scope: "week", scopeYear: year, scopeMonth: month, scopeWeek: weekOfMonth },
  });

  const totalWeeks = getTotalWeeksInMonth(year, month);
  const remainingDays = getRemainingDaysOfWeek(dayOfWeek);

  const weekTasks = await generateWeeklyTasks(
    monthTasks.map((t) => ({ title: t.title, completed: t.completed })),
    weekOfMonth,
    totalWeeks,
    remainingDays,
    prevWeekCompletion,
    goalInputs,
    workingDays,
  );

  for (let i = 0; i < weekTasks.length; i++) {
    await prisma.task.create({
      data: {
        title: weekTasks[i].title,
        description: weekTasks[i].description || null,
        scope: "week",
        scopeYear: year,
        scopeMonth: month,
        scopeWeek: weekOfMonth,
        sortOrder: i,
      },
    });
  }
}

async function generateAndSaveDayTasks(
  year: number,
  month: number,
  weekOfMonth: number,
  dayOfMonth: number,
  dayOfWeek: number,
  goalInputs: GoalInput[],
  workingDays: number[],
) {
  const weekTasks = await prisma.task.findMany({
    where: { scope: "week", scopeYear: year, scopeMonth: month, scopeWeek: weekOfMonth },
  });

  let prevDayCompletion: CompletionContext | null = null;
  const yesterday = new Date(year, month, dayOfMonth - 1);
  const yesterdayTasks = await prisma.task.findMany({
    where: {
      scope: "day",
      scopeYear: yesterday.getFullYear(),
      scopeMonth: yesterday.getMonth(),
      scopeDay: yesterday.getDate(),
    },
  });

  if (yesterdayTasks.length > 0) {
    const completed = yesterdayTasks.filter((t) => t.completed);
    prevDayCompletion = {
      completed: completed.map((t) => ({ title: t.title })),
      incomplete: yesterdayTasks.filter((t) => !t.completed).map((t) => ({ title: t.title })),
      completionRate: completed.length / yesterdayTasks.length,
    };
  }

  await prisma.task.deleteMany({
    where: { scope: "day", scopeYear: year, scopeMonth: month, scopeDay: dayOfMonth },
  });

  const remainingDaysInWeek = getRemainingDaysCountInWeek(dayOfWeek);

  const dayTasks = await generateDailyTasks(
    weekTasks.map((t) => ({ title: t.title, completed: t.completed })),
    dayOfWeek,
    dayOfMonth,
    remainingDaysInWeek,
    prevDayCompletion,
    goalInputs,
    workingDays,
  );

  for (let i = 0; i < dayTasks.length; i++) {
    await prisma.task.create({
      data: {
        title: dayTasks[i].title,
        description: dayTasks[i].description || null,
        scope: "day",
        scopeYear: year,
        scopeMonth: month,
        scopeDay: dayOfMonth,
        sortOrder: i,
      },
    });
  }
}
