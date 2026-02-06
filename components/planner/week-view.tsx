"use client";

import { useEffect, useState, useCallback } from "react";

import { TaskList, type TaskData } from "@/components/planner/task-list";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

function getCurrentWeekDays(): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek); // Sunday

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

export const WeekView = () => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const weekDays = getCurrentWeekDays();
  const weekOfMonth = getWeekOfMonth();
  const year = today.getFullYear();
  const month = today.getMonth();

  const [tasks, setTasks] = useState<TaskData[]>([]);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(
      `/api/tasks?scope=week&year=${year}&month=${month}&week=${weekOfMonth}`,
    );
    const data = await res.json();
    setTasks(data);
  }, [year, month, weekOfMonth]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

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

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <h2 className="text-lg font-bold tracking-tight">
          Week {weekOfMonth} — {MONTH_NAMES[month]}
        </h2>
        <p className="text-xs text-default-400 font-medium">
          {MONTH_NAMES[weekDays[0].getMonth()].slice(0, 3)}{" "}
          {weekDays[0].getDate()} — {MONTH_NAMES[weekDays[6].getMonth()].slice(0, 3)}{" "}
          {weekDays[6].getDate()}, {year}
        </p>
      </div>

      {/* Week day headers */}
      <div className="px-4 sm:px-6 py-3 border-b border-default-200/30">
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day, i) => {
            const dayStr = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
            const isToday = dayStr === todayStr;

            return (
              <div
                key={i}
                className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                  isToday
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                <span className="text-[10px] font-medium uppercase">
                  {DAY_NAMES[day.getDay()].slice(0, 3)}
                </span>
                <span className="text-sm font-bold">{day.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <div className="flex-1 px-4 sm:px-6 py-4">
        <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
          This Week&apos;s Tasks
        </h3>
        <TaskList
          emptyMessage="No tasks for this week"
          tasks={tasks}
          onToggle={onToggle}
        />
      </div>
    </div>
  );
};
