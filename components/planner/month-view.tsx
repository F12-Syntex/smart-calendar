"use client";

import { useEffect, useState, useCallback } from "react";

import { TaskList, type TaskData } from "@/components/planner/task-list";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface MonthlyPlanData {
  id: string;
  summary: string;
  month: number;
  year: number;
}

interface GoalData {
  id: string;
  title: string;
  description: string;
  monthlyPlans: MonthlyPlanData[];
}

export const MonthView = () => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const monthProgress = Math.round((dayOfMonth / daysInMonth) * 100);

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [plan, setPlan] = useState<MonthlyPlanData | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);

  const fetchData = useCallback(async () => {
    const [tasksRes, goalsRes] = await Promise.all([
      fetch(`/api/tasks?scope=month&year=${year}&month=${month}`),
      fetch("/api/goals"),
    ]);
    const tasksData = await tasksRes.json();
    setTasks(tasksData);

    const goalsData = await goalsRes.json();
    setGoals(goalsData);
    for (const goal of goalsData) {
      const mp = goal.monthlyPlans?.find(
        (p: MonthlyPlanData) => p.month === month && p.year === year,
      );
      if (mp) {
        setPlan(mp);
        break;
      }
    }
  }, [year, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onToggle = async (id: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    );
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed }),
    });
  };

  // Year-level summary
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalYearDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const dayOfYear = (today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const yearProgress = Math.round((dayOfYear / totalYearDays) * 100);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-xs text-default-400 font-medium">
              Day {dayOfMonth} of {daysInMonth}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-primary">
              {monthProgress}%
            </span>
            <p className="text-[10px] text-default-400">complete</p>
          </div>
        </div>
        <div className="w-full h-2 bg-default-200/30 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${monthProgress}%` }}
          />
        </div>
      </div>

      {/* Monthly focus */}
      {plan && (
        <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
          <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
            Monthly Focus
          </h3>
          <p className="text-sm text-foreground/80">{plan.summary}</p>
        </div>
      )}

      {/* Monthly tasks */}
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
          Monthly Tasks
        </h3>
        <TaskList
          emptyMessage="No tasks for this month — sync your plan in the Year tab"
          tasks={tasks}
          onToggle={onToggle}
        />
      </div>

      {/* Year glance */}
      {goals.length > 0 && (
        <div className="px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
              {year} Goals
            </h3>
            <span className="text-[10px] text-default-400 font-semibold">
              Year {yearProgress}% elapsed
            </span>
          </div>
          <div className="w-full h-1.5 bg-default-200/30 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-primary/60 rounded-full transition-all"
              style={{ width: `${yearProgress}%` }}
            />
          </div>
          <div className="space-y-1.5">
            {goals.map((g) => (
              <div key={g.id} className="rounded-lg border border-default-200/20 p-2">
                <p className="text-[11px] font-semibold">{g.title}</p>
                <p className="text-[10px] text-default-400">{g.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
