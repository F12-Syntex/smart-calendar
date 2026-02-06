"use client";

import { useEffect, useState, useCallback } from "react";

import { TaskList, type TaskData } from "@/components/planner/task-list";

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const DayView = () => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  const dayOfWeek = today.getDay();
  const currentHour = today.getHours();

  const [tasks, setTasks] = useState<TaskData[]>([]);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(
      `/api/tasks?scope=day&year=${year}&month=${month}&day=${day}`,
    );
    const data = await res.json();
    setTasks(data);
  }, [year, month, day]);

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
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
            <span className="text-2xl font-bold text-primary leading-none">
              {day}
            </span>
            <span className="text-[10px] font-semibold text-primary/70 uppercase">
              {DAY_NAMES[dayOfWeek].slice(0, 3)}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              {DAY_NAMES[dayOfWeek]}, {MONTH_NAMES[month]} {day}
            </h2>
            <p className="text-xs text-default-400 font-medium">{year}</p>
          </div>
          <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider ml-auto">
            Today
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Tasks section */}
        {tasks.length > 0 && (
          <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
            <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
              Today&apos;s Tasks
            </h3>
            <TaskList
              emptyMessage="No tasks for today"
              tasks={tasks}
              onToggle={onToggle}
            />
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {Array.from({ length: 24 }, (_, i) => {
            const hour = i;
            const label =
              hour === 0
                ? "12 AM"
                : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                    ? "12 PM"
                    : `${hour - 12} PM`;
            const isCurrent = hour === currentHour;

            return (
              <div key={hour} className="flex min-h-[64px] group relative">
                <div
                  className={`w-16 sm:w-20 shrink-0 py-2.5 pr-3 text-right text-[11px] font-semibold ${
                    isCurrent ? "text-primary" : "text-default-300"
                  }`}
                >
                  {label}
                </div>
                <div className="flex-1 border-l border-t border-default-200/30 group-hover:bg-primary/[0.03] transition-colors" />
                {isCurrent && (
                  <div className="absolute left-16 sm:left-20 right-0 top-0 flex items-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-[5px] shadow-lg shadow-primary/30" />
                    <div className="flex-1 h-[2px] bg-primary/60" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
