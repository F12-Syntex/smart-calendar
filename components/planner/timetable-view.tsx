"use client";

import { useEffect, useState, useCallback } from "react";
import { Checkbox } from "@heroui/checkbox";
import { Progress } from "@heroui/progress";

interface TaskData {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  scopeDay?: number | null;
}

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

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

export const TimetableView = () => {
  const today = new Date();
  const todayDate = today.getDate();
  const currentHour = today.getHours();
  const currentMonth = today.getMonth();
  const weekDays = getCurrentWeekDays();
  const weekOfMonth = getWeekOfMonth();
  const year = today.getFullYear();
  const month = today.getMonth();

  const [dayTasks, setDayTasks] = useState<DayTaskMap>({});
  const [weekTasks, setWeekTasks] = useState<TaskData[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);

  const fetchTasks = useCallback(async () => {
    const dayFetches = weekDays.map((d) =>
      fetch(`/api/tasks?scope=day&year=${d.getFullYear()}&month=${d.getMonth()}&day=${d.getDate()}`),
    );
    const weekFetch = fetch(
      `/api/tasks?scope=week&year=${year}&month=${month}&week=${weekOfMonth}`,
    );
    const settingsFetch = fetch("/api/settings");

    const [weekRes, settingsRes, ...dayResults] = await Promise.all([
      weekFetch,
      settingsFetch,
      ...dayFetches,
    ]);
    setWeekTasks(await weekRes.json());

    const settingsData = await settingsRes.json();
    setWorkingDays(settingsData.workingDays.split(",").map(Number));

    const dayMap: DayTaskMap = {};
    for (let i = 0; i < dayResults.length; i++) {
      const data = await dayResults[i].json();
      dayMap[weekDays[i].getDate()] = data;
    }
    setDayTasks(dayMap);
  }, [year, month, weekOfMonth]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const onToggle = async (id: string, completed: boolean) => {
    setDayTasks((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(next)) {
        next[Number(key)] = next[Number(key)].map((t) =>
          t.id === id ? { ...t, completed } : t,
        );
      }
      return next;
    });
    setWeekTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t)),
    );
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, completed }),
    });
  };

  // Build time slot assignments: distribute each day's tasks starting at 8 AM in 2hr blocks
  const getTaskAtSlot = (dayDate: Date, hour: number): TaskData | null => {
    const tasks = dayTasks[dayDate.getDate()] || [];
    const taskIndex = Math.floor((hour - 8) / 2);
    if (taskIndex >= 0 && taskIndex < tasks.length) {
      return tasks[taskIndex];
    }
    return null;
  };

  const TIMELINE_START = 7;
  const TIMELINE_END = 22;

  // Week-level stats
  const allDayTasks = Object.values(dayTasks).flat();
  const totalTasks = allDayTasks.length + weekTasks.length;
  const completedTasks = allDayTasks.filter((t) => t.completed).length + weekTasks.filter((t) => t.completed).length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-default-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">
              Weekly Timetable
            </h2>
            <p className="text-[11px] text-default-400 font-medium">
              {MONTH_SHORT[weekDays[0].getMonth()]}{" "}
              {weekDays[0].getDate()} &ndash; {MONTH_SHORT[weekDays[6].getMonth()]}{" "}
              {weekDays[6].getDate()}, {year}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-lg font-bold text-primary tabular-nums">
                {overallProgress}%
              </span>
              <p className="text-[10px] text-default-400">{completedTasks}/{totalTasks} done</p>
            </div>
          </div>
        </div>
        {totalTasks > 0 && (
          <Progress
            classNames={{
              track: "h-1 bg-default-200/30 mt-2",
              indicator: "bg-primary",
            }}
            value={overallProgress}
          />
        )}
      </div>

      {/* Week tasks banner */}
      {weekTasks.length > 0 && (
        <div className="px-4 sm:px-6 lg:px-8 py-2 border-b border-default-200/30 bg-default-50/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-default-400 uppercase tracking-wider shrink-0">
              Week
            </span>
            {weekTasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-md ${
                  t.completed
                    ? "text-default-300 line-through bg-default-100/20"
                    : "text-foreground/70 bg-primary/[0.04] border border-primary/10"
                }`}
              >
                <Checkbox
                  classNames={{ wrapper: "!w-3 !h-3" }}
                  isSelected={t.completed}
                  size="sm"
                  onValueChange={(checked) => onToggle(t.id, checked)}
                />
                <span className="break-words">{t.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[700px]">
          {/* Day headers - sticky */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-default-200/30">
            <div className="flex">
              <div className="w-14 sm:w-16 shrink-0" />
              {weekDays.map((dayDate, i) => {
                const dateNum = dayDate.getDate();
                const isToday = dateNum === todayDate && dayDate.getMonth() === currentMonth;
                const isPast = dayDate < today && !isToday;
                const dailyTasks = dayTasks[dateNum] || [];
                const dailyCompleted = dailyTasks.filter((t) => t.completed).length;
                const isRestDay = !workingDays.includes(dayDate.getDay());

                return (
                  <div
                    key={i}
                    className={`flex-1 py-2 text-center border-l border-default-200/20 ${
                      isToday ? "bg-primary/[0.04]" : isRestDay ? "bg-default-100/30" : ""
                    }`}
                  >
                    <span
                      className={`text-[9px] font-medium uppercase block ${
                        isToday ? "text-primary" : isPast ? "text-default-300" : isRestDay ? "text-default-300" : "text-default-400"
                      }`}
                    >
                      {DAY_NAMES_SHORT[dayDate.getDay()]}
                    </span>
                    <span
                      className={`text-sm font-bold block ${
                        isToday
                          ? "text-primary"
                          : isPast
                            ? "text-default-300"
                            : isRestDay
                              ? "text-default-300"
                              : "text-foreground"
                      }`}
                    >
                      {dateNum}
                    </span>
                    {isRestDay ? (
                      <span className="text-[8px] text-default-300 font-medium">Rest</span>
                    ) : dailyTasks.length > 0 ? (
                      <span className="text-[8px] text-default-400 tabular-nums">
                        {dailyCompleted}/{dailyTasks.length}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Time rows */}
          {Array.from({ length: TIMELINE_END - TIMELINE_START + 1 }, (_, i) => {
            const hour = TIMELINE_START + i;
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
              <div key={hour} className="flex relative">
                {/* Time label */}
                <div
                  className={`w-14 sm:w-16 shrink-0 py-2 pr-2 text-right text-[10px] font-semibold ${
                    isCurrent ? "text-primary" : "text-default-300"
                  }`}
                >
                  {label}
                </div>

                {/* Day columns */}
                {weekDays.map((dayDate, dayIdx) => {
                  const isToday =
                    dayDate.getDate() === todayDate && dayDate.getMonth() === currentMonth;
                  const isPast = dayDate < today && !isToday;
                  const isRestDay = !workingDays.includes(dayDate.getDay());
                  const task = getTaskAtSlot(dayDate, hour);

                  return (
                    <div
                      key={dayIdx}
                      className={`flex-1 border-l border-t border-default-200/15 min-h-[48px] p-0.5 transition-colors ${
                        isToday ? "bg-primary/[0.02]" : isRestDay ? "bg-default-100/20" : ""
                      } ${isPast && !isRestDay ? "opacity-50" : ""}`}
                    >
                      {task && (
                        <div
                          className={`h-full px-1.5 py-1 rounded-md text-[9px] sm:text-[10px] leading-tight transition-all ${
                            task.completed
                              ? "bg-default-100/30 text-default-400 line-through"
                              : "bg-primary/[0.08] border border-primary/15 text-foreground/80"
                          }`}
                        >
                          <div className="flex items-start gap-1">
                            <Checkbox
                              classNames={{ wrapper: "!w-3 !h-3 mt-0.5 shrink-0" }}
                              isSelected={task.completed}
                              size="sm"
                              onValueChange={(checked) => onToggle(task.id, checked)}
                            />
                            <span className="break-words min-w-0">{task.title}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Current time indicator */}
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
    </div>
  );
};
