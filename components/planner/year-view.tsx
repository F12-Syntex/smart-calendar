"use client";

import { useEffect, useState, useCallback } from "react";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface GoalData {
  id: string;
  title: string;
  description: string;
  monthlyPlans: { month: number; year: number; summary: string }[];
}

export const YearView = () => {
  const today = new Date();
  const year = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31);
  const totalDays =
    (endOfYear.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const dayOfYear =
    (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24) + 1;
  const progressPercent = Math.round((dayOfYear / totalDays) * 100);
  const remainingDays = Math.round(totalDays - dayOfYear);

  const [goals, setGoals] = useState<GoalData[]>([]);

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Build month summaries from goals
  const monthSummaries: Record<number, string> = {};
  for (const goal of goals) {
    for (const plan of goal.monthlyPlans || []) {
      if (plan.year === year) {
        monthSummaries[plan.month] = plan.summary;
      }
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <h2 className="text-lg font-bold tracking-tight">{year}</h2>
        <p className="text-xs text-default-400 font-medium">Year overview</p>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-6">
        {/* Year progress */}
        <div className="rounded-2xl border border-default-200/30 bg-default-50/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold">Year Progress</h3>
            <span className="text-2xl font-bold text-primary">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-3 bg-default-200/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-3 text-xs text-default-400">
            <span>
              Day {Math.round(dayOfYear)} of {Math.round(totalDays)}
            </span>
            <span>{remainingDays} days remaining</span>
          </div>
        </div>

        {/* Goals */}
        {goals.length > 0 && (
          <div className="rounded-2xl border border-default-200/30 bg-default-50/50 p-5">
            <h3 className="text-sm font-bold mb-3">
              {year} Goals
            </h3>
            <div className="space-y-3">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl border border-default-200/20 p-3"
                >
                  <p className="text-sm font-semibold">{goal.title}</p>
                  <p className="text-[11px] text-default-400 mt-0.5">
                    {goal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Monthly breakdown with AI summaries */}
        <div className="rounded-2xl border border-default-200/30 bg-default-50/50 p-5">
          <h3 className="text-sm font-bold mb-4">Monthly Plan</h3>
          <div className="space-y-2.5">
            {MONTH_NAMES.map((name, i) => {
              const isCurrentMo = i === currentMonth;
              const isPast = i < currentMonth;
              const daysInMonth = new Date(year, i + 1, 0).getDate();
              let monthProgress = 0;
              if (isPast) monthProgress = 100;
              else if (isCurrentMo)
                monthProgress = Math.round((currentDay / daysInMonth) * 100);

              return (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] font-semibold w-8 ${
                        isCurrentMo ? "text-primary" : "text-default-400"
                      }`}
                    >
                      {name.slice(0, 3)}
                    </span>
                    <div className="flex-1 h-2 bg-default-200/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCurrentMo
                            ? "bg-primary"
                            : isPast
                              ? "bg-default-300"
                              : "bg-transparent"
                        }`}
                        style={{ width: `${monthProgress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-default-400 w-8 text-right">
                      {monthProgress > 0 ? `${monthProgress}%` : "—"}
                    </span>
                  </div>
                  {monthSummaries[i] && (
                    <p className="text-[11px] text-default-400 ml-11 mt-0.5">
                      {monthSummaries[i]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
