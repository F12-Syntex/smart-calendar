"use client";

import { useEffect, useState, useCallback } from "react";
import { Checkbox } from "@heroui/checkbox";
import { Progress } from "@heroui/progress";

import { TaskList, type TaskData } from "@/components/planner/task-list";

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getWeekOfMonth(): number {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayOfWeek = firstDay.getDay();
  return Math.ceil((today.getDate() + firstDayOfWeek) / 7);
}

export const DayView = () => {
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth();
  const year = today.getFullYear();
  const dayOfWeek = today.getDay();
  const currentHour = today.getHours();
  const weekOfMonth = getWeekOfMonth();

  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [weekTasks, setWeekTasks] = useState<TaskData[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    const [dayRes, weekRes] = await Promise.all([
      fetch(`/api/tasks?scope=day&year=${year}&month=${month}&day=${day}`),
      fetch(`/api/tasks?scope=week&year=${year}&month=${month}&week=${weekOfMonth}`),
    ]);
    setTasks(await dayRes.json());
    setWeekTasks(await weekRes.json());
  }, [year, month, day, weekOfMonth]);

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
        scope: "day",
        scopeYear: year,
        scopeMonth: month,
        scopeDay: day,
      }),
    });
    const newTask = await res.json();
    setTasks((prev) => [...prev, newTask]);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const dayProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const weekCompleted = weekTasks.filter((t) => t.completed).length;
  const weekTotal = weekTasks.length;
  const weekProgress = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

  // Distribute tasks across timeline starting at 8 AM, ~2hr blocks
  const taskTimeSlots: Record<number, TaskData> = {};
  tasks.forEach((task, i) => {
    const hour = 8 + i * 2;
    if (hour <= 22) taskTimeSlots[hour] = task;
  });

  const TIMELINE_START = 6;
  const TIMELINE_END = 23;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 border-b border-default-200/30">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <span className="text-xl font-bold text-primary leading-none">
              {day}
            </span>
            <span className="text-[9px] font-semibold text-primary/70 uppercase">
              {DAY_NAMES[dayOfWeek].slice(0, 3)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold tracking-tight">
              {DAY_NAMES[dayOfWeek]}, {MONTH_NAMES[month]} {day}
            </h2>
            <p className="text-[11px] text-default-400 font-medium">{year}</p>
          </div>
          <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2.5 py-1 rounded-lg uppercase tracking-wider">
            Today
          </span>
        </div>
      </div>

      {/* Main content - 2 col on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left: Timeline with expandable task cards */}
          <div className="flex-1 lg:border-r border-default-200/30 overflow-y-auto">
            <div className="relative">
              {Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => {
                const hour = TIMELINE_START + i;
                const label =
                  hour === 0 ? "12 AM" : hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`;
                const isCurrent = hour === currentHour;
                const task = taskTimeSlots[hour];
                const isExpanded = task && expandedId === task.id;

                return (
                  <div key={hour} className="flex min-h-[56px] group relative">
                    <div
                      className={`w-14 sm:w-16 shrink-0 py-2 pr-2 text-right text-[10px] font-semibold ${
                        isCurrent ? "text-primary" : "text-default-300"
                      }`}
                    >
                      {label}
                    </div>
                    <div className="flex-1 border-l border-t border-default-200/20 group-hover:bg-primary/[0.02] transition-colors px-2 py-1">
                      {task && (
                        <div
                          className={`px-2.5 py-2 rounded-lg transition-all cursor-pointer ${
                            task.completed
                              ? "bg-default-100/30 opacity-50"
                              : "bg-primary/[0.06] border border-primary/15"
                          } ${isExpanded ? "shadow-sm" : ""}`}
                          onClick={() => setExpandedId(isExpanded ? null : task.id)}
                        >
                          <div className="flex items-start gap-2">
                            <Checkbox
                              classNames={{ wrapper: "mt-0.5" }}
                              isSelected={task.completed}
                              size="sm"
                              onValueChange={(checked) => {
                                onToggle(task.id, checked);
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className={`text-xs font-medium leading-snug ${task.completed ? "line-through text-default-400" : ""}`}>
                                {task.title}
                              </p>
                              {task.description && !isExpanded && (
                                <p className="text-[10px] text-default-400 mt-0.5 truncate">
                                  {task.description}
                                </p>
                              )}
                            </div>
                            {task.description && (
                              <span className="text-[10px] text-default-300 shrink-0 mt-0.5">
                                {isExpanded ? "\u2212" : "+"}
                              </span>
                            )}
                          </div>

                          {/* Expanded detail */}
                          {isExpanded && task.description && (
                            <div className="mt-2 ml-7 pt-2 border-t border-default-200/20">
                              <p className="text-[11px] text-default-500 leading-relaxed whitespace-pre-wrap">
                                {task.description}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="absolute left-14 sm:left-16 right-0 top-0 flex items-center z-10 pointer-events-none">
                        <div className="w-2 h-2 rounded-full bg-primary -ml-1 shadow-lg shadow-primary/30" />
                        <div className="flex-1 h-[1.5px] bg-primary/50" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Stats + Week Glance + Task list with edit/delete/add */}
          <div className="lg:w-80 xl:w-96 shrink-0 p-4 sm:p-5 lg:p-5 space-y-4 border-t lg:border-t-0 border-default-200/30 overflow-y-auto">
            {/* Stats card */}
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                  Today&apos;s Progress
                </h3>
                <span className="text-lg font-bold text-primary tabular-nums">
                  {dayProgress}%
                </span>
              </div>
              <Progress
                classNames={{
                  track: "h-2 bg-default-200/30",
                  indicator: "bg-primary",
                }}
                value={dayProgress}
              />
              <div className="flex justify-between mt-2 text-[10px] text-default-400">
                <span>{completedCount} completed</span>
                <span>{totalCount - completedCount} remaining</span>
              </div>
            </div>

            {/* Task list with edit/delete/add */}
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
                Today&apos;s Tasks
              </h3>
              <TaskList
                compact
                emptyMessage="No tasks for today"
                tasks={tasks}
                onAdd={onAdd}
                onDelete={onDelete}
                onEdit={onEdit}
                onToggle={onToggle}
              />
            </div>

            {/* Week glance */}
            {weekTasks.length > 0 && (
              <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
                    This Week
                  </h3>
                  <span className="text-[10px] text-default-400 font-semibold tabular-nums">
                    {weekCompleted}/{weekTotal} ({weekProgress}%)
                  </span>
                </div>
                <Progress
                  classNames={{
                    track: "h-1.5 bg-default-200/30",
                    indicator: "bg-primary/60",
                  }}
                  value={weekProgress}
                />
                <div className="mt-3 space-y-1">
                  {weekTasks.map((t) => (
                    <p
                      key={t.id}
                      className={`text-[11px] leading-relaxed ${
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
