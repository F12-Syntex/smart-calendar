import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import {
  generateYearlyPlan,
  generateMonthlyTasks,
  generateWeeklyTasks,
  generateDailyTasks,
  getCurrentWeekOfMonth,
  getTotalWeeksInMonth,
} from "@/lib/ai-planner";
import type { GoalInput, CompletionContext } from "@/lib/ai-planner";

// Generate the full cascade: year → month → week → day
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { scope } = body; // "full" | "week" | "day"

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const weekOfMonth = getCurrentWeekOfMonth();
  const dayOfMonth = today.getDate();
  const dayOfWeek = today.getDay();

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
  }));

  try {
    if (scope === "full") {
      // ── Step 1: Generate yearly plan (monthly summaries) ──
      const yearlyPlan = await generateYearlyPlan(goalInputs, year);

      // Save monthly plans
      for (const monthSummary of yearlyPlan.months) {
        // Delete existing plan for this month
        await prisma.monthlyPlan.deleteMany({
          where: {
            year,
            month: monthSummary.month,
            goalId: { in: goals.map((g) => g.id) },
          },
        });

        // Create new monthly plan for the first goal (linked)
        await prisma.monthlyPlan.create({
          data: {
            goalId: goals[0].id,
            month: monthSummary.month,
            year,
            summary: monthSummary.focus,
          },
        });
      }

      // ── Step 2: Generate current month's tasks ──
      const currentMonthFocus =
        yearlyPlan.months.find((m) => m.month === month)?.focus ||
        "Focus on your goals";

      // Clear existing month tasks
      await prisma.task.deleteMany({
        where: { scope: "month", scopeYear: year, scopeMonth: month },
      });

      const monthTasks = await generateMonthlyTasks(
        goalInputs,
        currentMonthFocus,
        month,
        year,
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

      // ── Step 3: Generate current week's tasks ──
      await generateAndSaveWeekTasks(year, month, weekOfMonth);

      // ── Step 4: Generate today's tasks ──
      await generateAndSaveDayTasks(year, month, weekOfMonth, dayOfMonth, dayOfWeek);
    } else if (scope === "week") {
      await generateAndSaveWeekTasks(year, month, weekOfMonth);
      await generateAndSaveDayTasks(year, month, weekOfMonth, dayOfMonth, dayOfWeek);
    } else if (scope === "day") {
      await generateAndSaveDayTasks(year, month, weekOfMonth, dayOfMonth, dayOfWeek);
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
) {
  const monthTasks = await prisma.task.findMany({
    where: { scope: "month", scopeYear: year, scopeMonth: month },
  });

  // Get previous week's completion context
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
        incomplete: prevWeekTasks
          .filter((t) => !t.completed)
          .map((t) => ({ title: t.title })),
        completionRate: completed.length / prevWeekTasks.length,
      };
    }
  }

  // Clear existing week tasks
  await prisma.task.deleteMany({
    where: { scope: "week", scopeYear: year, scopeMonth: month, scopeWeek: weekOfMonth },
  });

  const totalWeeks = getTotalWeeksInMonth(year, month);
  const weekTasks = await generateWeeklyTasks(
    monthTasks.map((t) => ({ title: t.title, completed: t.completed })),
    weekOfMonth,
    totalWeeks,
    prevWeekCompletion,
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
) {
  const weekTasks = await prisma.task.findMany({
    where: { scope: "week", scopeYear: year, scopeMonth: month, scopeWeek: weekOfMonth },
  });

  // Get yesterday's completion context
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
      incomplete: yesterdayTasks
        .filter((t) => !t.completed)
        .map((t) => ({ title: t.title })),
      completionRate: completed.length / yesterdayTasks.length,
    };
  }

  // Clear existing day tasks
  await prisma.task.deleteMany({
    where: { scope: "day", scopeYear: year, scopeMonth: month, scopeDay: dayOfMonth },
  });

  const dayTasks = await generateDailyTasks(
    weekTasks.map((t) => ({ title: t.title, completed: t.completed })),
    dayOfWeek,
    dayOfMonth,
    prevDayCompletion,
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
