"use client";

import { useEffect, useState, useCallback } from "react";
import { Progress } from "@heroui/progress";

import { TaskList, type TaskData } from "@/components/planner/task-list";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getCurrentWeekDays(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);

  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    days.push(d);
  }
  return days;
}

function getWeekOfMonth(): number {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((today.getDate() + firstDayOfWeek) / 7);
}

interface DayTaskMap {
  [dayOfMonth: number]: TaskData[];
}

export const WeekView = () => {
  const today = new Date();
  const todayDate = today.getDate();
  const weekDays = getCurrentWeekDays();
  const weekOfMonth = getWeekOfMonth();
  const year = today.getFullYear();
  const month = today.getMonth();

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [dayTasks, setDayTasks] = useState<DayTaskMap>({});
  const [monthTasks, setMonthTasks] = useState<TaskData[]>([]);

  const fetchTasks = useCallback(async () => {
    const fetches = [
      fetch(`/api/tasks?scope=week&year=${year}&month=${month}&week=${weekOfMonth}`),
      fetch(`/api/tasks?scope=month&year=${year}&month=${month}`),
    ];

    const dayFetches = weekDays.map((d) =>
      fetch(`/api/tasks?scope=day&year=${d.getFullYear()}&month=${d.getMonth()}&day=${d.getDate()}`),
    );

    const [weekRes, monthRes, ...dayResults] = await Promise.all([
      ...fetches,
      ...dayFetches,
    ]);

    setTasks(await weekRes.json());
    setMonthTasks(await monthRes.json());

    const dayMap: DayTaskMap = {};
    for (let i = 0; i < dayResults.length; i++) {
      const data = await dayResults[i].json();
      if (data.length > 0) {
        dayMap[weekDays[i].getDate()] = data;
      }
    }
    setDayTasks(dayMap);
  }, [year, month, weekOfMonth]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onToggle = async (id: string, completed: boolean) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    );
    setDayTasks((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = next[Number(key)].map((t) =>
          t.id === id ? { ...t, completed } : t,
        );
      }
      return next;
    });
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
        scope: "week",
        scopeYear: year,
        scopeMonth: month,
        scopeWeek: weekOfMonth,
      }),
    });
    const newTask = await res.json();
    setTasks((prev) => [...prev, newTask]);
  };

  const monthCompleted = monthTasks.filter((t) => t.completed).length;
  const monthTotal = monthTasks.length;
  const monthProgress = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-default-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Week {weekOfMonth} &mdash; {MONTH_NAMES[month]}
            </h2>
            <p className="text-[11px] text-default-400 font-medium">
              {MONTH_NAMES[weekDays[0].getMonth()].slice(0, 3)}{" "}
              {weekDays[0].getDate()} &ndash; {MONTH_NAMES[weekDays[6].getMonth()].slice(0, 3)}{" "}
              {weekDays[6].getDate()}, {year}
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* 7-column day grid */}
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {weekDays.map((dayDate, i) => {
              const dateNum = dayDate.getDate();
              const isToday = dateNum === todayDate && dayDate.getMonth() === month;
              const isPast = dayDate < today && !isToday;
              const dailyTasks = dayTasks[dateNum] || [];
              const dailyCompleted = dailyTasks.filter((t) => t.completed).length;

              return (
                <div
                  key={i}
                  className={`flex flex-col rounded-xl border transition-colors min-h-[120px] sm:min-h-[160px] ${
                    isToday
                      ? "border-primary/30 bg-primary/[0.04]"
                      : isPast
                        ? "border-default-200/15 bg-default-50/20 opacity-60"
                        : "border-default-200/20 bg-default-50/30"
                  }`}
                >
                  {/* Day header */}
                  <div className={`flex flex-col items-center py-2 border-b border-default-200/20 ${
                    isToday ? "border-primary/20" : ""
                  }`}>
                    <span className={`text-[9px] font-medium uppercase ${
                      isToday ? "text-primary" : "text-default-400"
                    }`}>
                      {DAY_NAMES_SHORT[dayDate.getDay()]}
                    </span>
                    <span className={`text-sm font-bold ${
                      isToday
                        ? "text-primary"
                        : isPast
                          ? "text-default-300"
                          : "text-foreground"
                    }`}>
                      {dateNum}
                    </span>
                  </div>

                  {/* Day tasks */}
                  <div className="flex-1 p-1.5 space-y-0.5 overflow-hidden">
                    {dailyTasks.slice(0, 4).map((t) => (
                      <div
                        key={t.id}
                        className={`text-[9px] sm:text-[10px] px-1.5 py-1 rounded-md leading-tight break-words ${
                          t.completed
                            ? "text-default-300 line-through bg-default-100/20"
                            : "text-foreground/80 bg-primary/[0.06]"
                        }`}
                      >
                        {t.title}
                      </div>
                    ))}
                    {dailyTasks.length > 4 && (
                      <p className="text-[8px] text-default-400 text-center">
                        +{dailyTasks.length - 4} more
                      </p>
                    )}
                    {dailyTasks.length === 0 && !isPast && (
                      <p className="text-[8px] text-default-300 text-center mt-2">
                        No tasks
                      </p>
                    )}
                  </div>

                  {/* Progress dot */}
                  {dailyTasks.length > 0 && (
                    <div className="px-2 pb-1.5">
                      <div className="flex items-center gap-1">
                        <div className="flex-1 h-0.5 bg-default-200/30 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/60 rounded-full"
                            style={{
                              width: `${dailyTasks.length > 0 ? Math.round((dailyCompleted / dailyTasks.length) * 100) : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-[7px] text-default-400 tabular-nums">
                          {dailyCompleted}/{dailyTasks.length}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Week tasks with edit/delete/add */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-default-200/30">
          <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
            Week Tasks
          </h3>
          <TaskList
            emptyMessage="No tasks for this week — sync your plan in Goals"
            tasks={tasks}
            onAdd={onAdd}
            onDelete={onDelete}
            onEdit={onEdit}
            onToggle={onToggle}
          />
        </div>

        {/* Month glance */}
        {monthTasks.length > 0 && (
          <div className="px-4 sm:px-6 lg:px-8 py-4 border-t border-default-200/30">
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                  This Month
                </h3>
                <span className="text-[10px] text-default-400 font-semibold tabular-nums">
                  {monthCompleted}/{monthTotal} ({monthProgress}%)
                </span>
              </div>
              <Progress
                classNames={{
                  track: "h-1.5 bg-default-200/30",
                  indicator: "bg-primary/60",
                }}
                value={monthProgress}
              />
              <div className="mt-3 space-y-0.5">
                {monthTasks.map((t) => (
                  <p
                    key={t.id}
                    className={`text-[11px] ${
                      t.completed
                        ? "text-default-300 line-through"
                        : "text-default-500"
                    }`}
                  >
                    {t.completed ? "\u2713" : "\u25CB"} {t.title}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
