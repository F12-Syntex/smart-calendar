"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";

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
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = async () => {
    if (!newTitle.trim()) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim() || newTitle.trim(),
        year,
      }),
    });
    setNewTitle("");
    setNewDesc("");
    fetchGoals();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addGoal();
    }
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    fetchGoals();
  };

  const syncPlan = async () => {
    setSyncing(true);
    setSyncError("");
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
    }
  };

  // Build month summaries from goals
  const monthSummaries: Record<number, string> = {};
  for (const goal of goals) {
    for (const plan of goal.monthlyPlans || []) {
      if (plan.year === year) {
        monthSummaries[plan.month] = plan.summary;
      }
    }
  }

  const hasPlan = Object.keys(monthSummaries).length > 0;

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
            <span>Day {Math.round(dayOfYear)} of {Math.round(totalDays)}</span>
            <span>{remainingDays} days remaining</span>
          </div>
        </div>

        {/* Goals + Add form */}
        <div className="rounded-2xl border border-default-200/30 bg-default-50/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold">{year} Goals</h3>
            {goals.length > 0 && (
              <Button
                className="rounded-xl font-semibold text-xs"
                color="primary"
                isDisabled={syncing}
                isLoading={syncing}
                size="sm"
                variant="flat"
                onPress={syncPlan}
              >
                {syncing ? "Syncing..." : hasPlan ? "Re-sync Plan" : "Sync Plan"}
              </Button>
            )}
          </div>

          {syncError && (
            <p className="text-xs text-danger mb-3">{syncError}</p>
          )}
          {syncing && (
            <div className="flex items-center gap-2 mb-3 p-3 rounded-xl bg-primary/[0.04] border border-primary/20">
              <Spinner color="primary" size="sm" />
              <span className="text-xs text-default-500">
                Generating year → month → week → day plan...
              </span>
            </div>
          )}

          {/* Existing goals */}
          {goals.length > 0 && (
            <div className="space-y-2 mb-4">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="rounded-xl border border-default-200/20 p-3 flex items-start justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{goal.title}</p>
                    <p className="text-[11px] text-default-400 mt-0.5">
                      {goal.description}
                    </p>
                  </div>
                  <button
                    className="text-default-300 hover:text-danger text-xs shrink-0 mt-1 cursor-pointer"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add goal form */}
          <div className="space-y-2">
            <Input
              classNames={{
                inputWrapper: "rounded-xl bg-default-100/50",
              }}
              placeholder="What do you want to achieve?"
              size="sm"
              value={newTitle}
              onKeyDown={handleKeyDown}
              onValueChange={setNewTitle}
            />
            <div className="flex gap-2">
              <Input
                classNames={{
                  inputWrapper: "rounded-xl bg-default-100/50",
                }}
                placeholder="Brief description (optional)"
                size="sm"
                value={newDesc}
                onKeyDown={handleKeyDown}
                onValueChange={setNewDesc}
              />
              <Button
                className="rounded-xl font-semibold shrink-0"
                color="primary"
                isDisabled={!newTitle.trim()}
                size="sm"
                onPress={addGoal}
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Monthly plan breakdown */}
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
                        isCurrentMo
                          ? "text-primary"
                          : isPast
                            ? "text-default-300"
                            : "text-default-400"
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
                    <p
                      className={`text-[11px] ml-11 mt-0.5 ${
                        isPast ? "text-default-300 line-through" : "text-default-400"
                      }`}
                    >
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
