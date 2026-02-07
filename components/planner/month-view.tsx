"use client";

import { useEffect, useState, useCallback } from "react";
import { Progress } from "@heroui/progress";
import { Input } from "@heroui/input";

import { TaskList, type TaskData } from "@/components/planner/task-list";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function getCalendarDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  return days;
}

export const MonthView = () => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  const todayDate = today.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthProgress = Math.round((todayDate / daysInMonth) * 100);
  const calendarDays = getCalendarDays(year, month);

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [plan, setPlan] = useState<MonthlyPlanData | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [daysWithTasks, setDaysWithTasks] = useState<Set<number>>(new Set());
  const [editingFocus, setEditingFocus] = useState(false);
  const [focusText, setFocusText] = useState("");

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
        setFocusText(mp.summary);
        break;
      }
    }

    // Check which days have tasks
    const dayTaskRes = await fetch(`/api/tasks?scope=day&year=${year}&month=${month}`);
    const dayTasksData = await dayTaskRes.json();
    const days = new Set<number>();
    for (const t of dayTasksData) {
      if (t.scopeDay) days.add(t.scopeDay);
    }
    setDaysWithTasks(days);
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

  const onEdit = async (id: string, title: string, description?: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, title, description: description ?? t.description } : t)),
    );
    const body: Record<string, unknown> = { id, title };
    if (description !== undefined) body.description = description;
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  };

  const onDelete = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks?id=${id}`, { method: "DELETE" });
  };

  const onAdd = async (title: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        scope: "month",
        scopeYear: year,
        scopeMonth: month,
      }),
    });
    const newTask = await res.json();
    setTasks((prev) => [...prev, newTask]);
  };

  const saveFocus = async () => {
    if (!plan || focusText.trim() === plan.summary) {
      setEditingFocus(false);
      return;
    }
    await fetch("/api/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: plan.id, summary: focusText.trim() }),
    });
    setPlan({ ...plan, summary: focusText.trim() });
    setEditingFocus(false);
  };

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const totalYearDays = (yearEnd.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const dayOfYear = (today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const yearProgress = Math.round((dayOfYear / totalYearDays) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-default-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              {MONTH_NAMES[month]} {year}
            </h2>
            <p className="text-[11px] text-default-400 font-medium">
              Day {todayDate} of {daysInMonth}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-primary tabular-nums">
              {monthProgress}%
            </span>
            <p className="text-[10px] text-default-400">complete</p>
          </div>
        </div>
        <Progress
          classNames={{
            track: "h-1.5 bg-default-200/30 mt-2",
            indicator: "bg-primary",
          }}
          value={monthProgress}
        />
      </div>

      {/* Main content - 2 col on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Calendar Grid + Tasks */}
          <div className="flex-1">
            {/* Calendar grid */}
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-3 sm:p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-center text-[9px] font-semibold text-default-400 uppercase py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map((dayNum, i) => {
                    if (dayNum === null) {
                      return <div key={`empty-${i}`} className="aspect-square" />;
                    }

                    const isToday = dayNum === todayDate;
                    const isPast = dayNum < todayDate;
                    const hasTasks = daysWithTasks.has(dayNum);

                    return (
                      <div
                        key={dayNum}
                        className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium relative transition-colors ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : isPast
                              ? "text-default-300"
                              : "text-foreground hover:bg-default-100/50"
                        }`}
                      >
                        {dayNum}
                        {hasTasks && !isToday && (
                          <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary/60" />
                        )}
                        {hasTasks && isToday && (
                          <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-primary-foreground/60" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Monthly focus — click to edit */}
            {plan && (
              <div className="px-4 sm:px-6 lg:px-8 pb-4">
                <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
                  <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
                    Monthly Focus
                  </h3>
                  {editingFocus ? (
                    <Input
                      autoFocus
                      classNames={{ inputWrapper: "rounded-lg bg-default-100/50" }}
                      size="sm"
                      value={focusText}
                      onBlur={saveFocus}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveFocus();
                        if (e.key === "Escape") { setFocusText(plan.summary); setEditingFocus(false); }
                      }}
                      onValueChange={setFocusText}
                    />
                  ) : (
                    <p
                      className="text-sm text-foreground/80 leading-relaxed cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => setEditingFocus(true)}
                      title="Click to edit"
                    >
                      {plan.summary}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Monthly tasks with edit/delete/add */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-default-200/30">
              <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
                Monthly Tasks
              </h3>
              <TaskList
                emptyMessage="No tasks for this month — sync your plan in Goals"
                tasks={tasks}
                onAdd={onAdd}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggle={onToggle}
              />
            </div>
          </div>

          {/* Right: Goals sidebar on desktop */}
          {goals.length > 0 && (
            <div className="lg:w-72 xl:w-80 shrink-0 p-4 sm:p-5 lg:p-5 space-y-4 border-t lg:border-t-0 lg:border-l border-default-200/30">
              <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                    {year} Goals
                  </h3>
                  <span className="text-[10px] text-default-400 font-semibold tabular-nums">
                    {yearProgress}% elapsed
                  </span>
                </div>
                <Progress
                  classNames={{
                    track: "h-1.5 bg-default-200/30",
                    indicator: "bg-primary/60",
                  }}
                  value={yearProgress}
                />
                <div className="mt-3 space-y-2">
                  {goals.map((g) => (
                    <div key={g.id} className="rounded-lg border border-default-200/20 p-2.5">
                      <p className="text-[11px] font-semibold leading-snug">{g.title}</p>
                      <p className="text-[10px] text-default-400 mt-0.5">{g.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
