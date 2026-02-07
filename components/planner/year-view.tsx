"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Spinner } from "@heroui/spinner";
import { Progress } from "@heroui/progress";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface GoalData {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  category: string;
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
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncStep, setSyncStep] = useState("");

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const syncPlan = async () => {
    setSyncing(true);
    setSyncError("");
    setSyncStep("Generating yearly plan...");
    try {
      const res = await fetch("/api/plan/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: "full" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSyncError(data.error || "Sync failed");
      } else {
        fetchGoals();
      }
    } catch {
      setSyncError("Network error");
    } finally {
      setSyncing(false);
      setSyncStep("");
    }
  };

  // Build month summaries
  const monthSummaries: Record<number, string> = {};
  for (const goal of goals) {
    for (const plan of goal.monthlyPlans || []) {
      if (plan.year === year) {
        monthSummaries[plan.month] = plan.summary;
      }
    }
  }

  const hasPlan = Object.keys(monthSummaries).length > 0;

  const categoryColor = (cat: string) =>
    cat === "habit" ? "bg-warning" : cat === "milestone" ? "bg-secondary" : "bg-primary";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-default-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">{year}</h2>
            <p className="text-[11px] text-default-400 font-medium">Year overview</p>
          </div>
          <div className="flex items-center gap-3">
            {goals.length > 0 && (
              <Button
                className="rounded-lg font-semibold text-[11px] h-7"
                color="primary"
                isDisabled={syncing}
                isLoading={syncing}
                size="sm"
                variant="flat"
                onPress={syncPlan}
              >
                {syncing ? "Syncing" : hasPlan ? "Re-sync" : "Sync Plan"}
              </Button>
            )}
            <div className="text-right">
              <span className="text-xl font-bold text-primary tabular-nums">
                {progressPercent}%
              </span>
              <p className="text-[10px] text-default-400">{remainingDays}d left</p>
            </div>
          </div>
        </div>
        <Progress
          classNames={{
            track: "h-1.5 bg-default-200/30 mt-2",
            indicator: "bg-primary",
          }}
          value={progressPercent}
        />
      </div>

      {syncError && (
        <div className="px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-[11px] text-danger">{syncError}</p>
        </div>
      )}
      {syncing && (
        <div className="px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/[0.04] border border-primary/15">
            <Spinner color="primary" size="sm" />
            <span className="text-[11px] text-default-500">
              {syncStep || "Generating plan..."}
            </span>
          </div>
        </div>
      )}

      {/* Main - 2 col on desktop */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col lg:flex-row">
          {/* Left: Monthly plan grid */}
          <div className="flex-1 p-4 sm:p-5 lg:p-6">
            <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
              Monthly Plan
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {MONTH_SHORT.map((name, i) => {
                const isCurrentMo = i === currentMonth;
                const isPast = i < currentMonth;
                const daysInMonth = new Date(year, i + 1, 0).getDate();
                let monthProgress = 0;
                if (isPast) monthProgress = 100;
                else if (isCurrentMo)
                  monthProgress = Math.round((currentDay / daysInMonth) * 100);

                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-3 transition-colors ${
                      isCurrentMo
                        ? "border-primary/30 bg-primary/[0.04]"
                        : isPast
                          ? "border-default-200/15 bg-default-50/20 opacity-50"
                          : "border-default-200/20 bg-default-50/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`text-[11px] font-bold ${
                          isCurrentMo
                            ? "text-primary"
                            : isPast
                              ? "text-default-300"
                              : "text-foreground"
                        }`}
                      >
                        {name}
                      </span>
                      {monthProgress > 0 && (
                        <span className="text-[9px] text-default-400 tabular-nums">
                          {monthProgress}%
                        </span>
                      )}
                    </div>
                    <div className="h-1 bg-default-200/30 rounded-full overflow-hidden mb-1.5">
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
                    {monthSummaries[i] && (
                      <p
                        className={`text-[9px] leading-snug ${
                          isPast ? "text-default-300" : "text-default-400"
                        }`}
                      >
                        {monthSummaries[i].length > 60
                          ? monthSummaries[i].slice(0, 60) + "..."
                          : monthSummaries[i]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Goals summary (read-only — manage in Goals tab) */}
          <div className="lg:w-80 xl:w-96 shrink-0 p-4 sm:p-5 lg:p-5 space-y-4 border-t lg:border-t-0 lg:border-l border-default-200/30">
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">{year} Goals</h3>
                <span className="text-[10px] text-default-400">
                  {goals.length} goal{goals.length !== 1 ? "s" : ""}
                </span>
              </div>

              {goals.length === 0 && (
                <p className="text-[11px] text-default-400 text-center py-4">
                  No goals yet — add them in the Goals tab
                </p>
              )}

              {goals.length > 0 && (
                <div className="space-y-2">
                  {goals.map((goal) => (
                    <div
                      key={goal.id}
                      className="rounded-xl border border-default-200/20 p-3"
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className={`w-2 h-2 rounded-full ${categoryColor(goal.category)} shrink-0`} />
                        <p className="text-sm font-semibold leading-snug">{goal.title}</p>
                      </div>
                      <p className="text-[11px] text-default-400 ml-4">
                        {goal.description}
                      </p>
                      <div className="flex items-center gap-2 ml-4 mt-1">
                        <span className="text-[9px] text-primary font-bold tabular-nums">
                          {goal.multiplier}/5
                        </span>
                        <span className="text-[9px] text-default-300">priority</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
