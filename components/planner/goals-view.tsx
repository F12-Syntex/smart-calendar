"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_FULL = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const CATEGORIES = [
  { key: "growth", label: "Growth" },
  { key: "habit", label: "Habit" },
  { key: "milestone", label: "Milestone" },
];

interface GoalData {
  id: string;
  title: string;
  description: string;
  multiplier: number;
  frequency: string | null;
  category: string;
  monthlyPlans: { month: number; year: number; summary: string }[];
}

export const GoalsView = () => {
  const year = new Date().getFullYear();

  const [goals, setGoals] = useState<GoalData[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  // New goal form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newMultiplier, setNewMultiplier] = useState(3);
  const [newFrequency, setNewFrequency] = useState("");
  const [newCategory, setNewCategory] = useState("growth");

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
  }, []);

  const fetchSettings = useCallback(async () => {
    const res = await fetch("/api/settings");
    const data = await res.json();
    setWorkingDays(data.workingDays.split(",").map(Number));
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchSettings();
  }, [fetchGoals, fetchSettings]);

  const addGoal = async () => {
    if (!newTitle.trim()) return;
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTitle.trim(),
        description: newDesc.trim() || newTitle.trim(),
        year,
        multiplier: newMultiplier,
        frequency: newFrequency.trim() || null,
        category: newCategory,
      }),
    });
    setNewTitle("");
    setNewDesc("");
    setNewMultiplier(3);
    setNewFrequency("");
    setNewCategory("growth");
    fetchGoals();
  };

  const updateGoal = async (id: string, updates: Partial<GoalData>) => {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    );
  };

  const deleteGoal = async (id: string) => {
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    fetchGoals();
  };

  const toggleWorkingDay = async (day: number) => {
    const next = workingDays.includes(day)
      ? workingDays.filter((d) => d !== day)
      : [...workingDays, day].sort();
    setWorkingDays(next);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workingDays: next.join(",") }),
    });
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

  const hasPlan = goals.some((g) => g.monthlyPlans.length > 0);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-default-200/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight">{year} Goals</h2>
            <p className="text-[11px] text-default-400 font-medium">
              {goals.length} goal{goals.length !== 1 ? "s" : ""} set
            </p>
          </div>
          {goals.length > 0 && (
            <Button
              className="rounded-lg font-semibold text-[11px] h-8"
              color="primary"
              isDisabled={syncing}
              isLoading={syncing}
              size="sm"
              variant="flat"
              onPress={syncPlan}
            >
              {syncing ? "Generating..." : hasPlan ? "Re-sync Plan" : "Generate Plan"}
            </Button>
          )}
        </div>
        {syncError && <p className="text-[11px] text-danger mt-1">{syncError}</p>}
        {syncing && (
          <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-primary/[0.04] border border-primary/15">
            <Spinner color="primary" size="sm" />
            <span className="text-[11px] text-default-500">
              AI is generating year &rarr; month &rarr; week &rarr; day plan...
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 sm:p-5 lg:p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Goals list */}
          <div className="flex-1 space-y-3">
            <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider">
              Your Goals
            </h3>

            {goals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-default-100/50 flex items-center justify-center mb-3">
                  <span className="text-default-300 text-2xl">+</span>
                </div>
                <p className="text-sm text-default-400 mb-1">No goals yet</p>
                <p className="text-[11px] text-default-300">Add your first goal below to get started</p>
              </div>
            )}

            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onDelete={deleteGoal}
                onUpdate={updateGoal}
              />
            ))}

            {/* Add goal form */}
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4 mt-4">
              <h4 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
                Add Goal
              </h4>
              <div className="space-y-2.5">
                <Input
                  classNames={{ inputWrapper: "rounded-lg bg-default-100/50" }}
                  placeholder="What do you want to achieve?"
                  size="sm"
                  value={newTitle}
                  onKeyDown={(e) => { if (e.key === "Enter") addGoal(); }}
                  onValueChange={setNewTitle}
                />
                <Input
                  classNames={{ inputWrapper: "rounded-lg bg-default-100/50" }}
                  placeholder="Brief description"
                  size="sm"
                  value={newDesc}
                  onValueChange={setNewDesc}
                />
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] text-default-400 font-semibold uppercase block mb-1">
                      Priority ({newMultiplier}/5)
                    </label>
                    <input
                      className="w-full accent-[hsl(var(--heroui-primary))]"
                      max={5}
                      min={1}
                      step={0.5}
                      type="range"
                      value={newMultiplier}
                      onChange={(e) => setNewMultiplier(parseFloat(e.target.value))}
                    />
                  </div>
                  <div className="w-28">
                    <label className="text-[10px] text-default-400 font-semibold uppercase block mb-1">
                      Frequency
                    </label>
                    <Input
                      classNames={{ inputWrapper: "rounded-lg bg-default-100/50 h-8 min-h-8" }}
                      placeholder="e.g. 5/day"
                      size="sm"
                      value={newFrequency}
                      onValueChange={setNewFrequency}
                    />
                  </div>
                  <div className="w-28">
                    <Select
                      classNames={{
                        trigger: "rounded-lg bg-default-100/50 h-8 min-h-8",
                      }}
                      defaultSelectedKeys={["growth"]}
                      label=""
                      size="sm"
                      onSelectionChange={(keys) => {
                        const val = Array.from(keys)[0] as string;
                        if (val) setNewCategory(val);
                      }}
                    >
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.key}>{c.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                </div>
                <Button
                  className="rounded-lg font-semibold w-full"
                  color="primary"
                  isDisabled={!newTitle.trim()}
                  size="sm"
                  onPress={addGoal}
                >
                  Add Goal
                </Button>
              </div>
            </div>
          </div>

          {/* Right: Working Days settings */}
          <div className="lg:w-72 xl:w-80 shrink-0 space-y-4">
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
                Working Days
              </h3>
              <p className="text-[10px] text-default-400 mb-3">
                AI won&apos;t schedule tasks on non-working days. You can still add tasks manually.
              </p>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      workingDays.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-default-100/50 text-default-400 hover:bg-default-200/50"
                    }`}
                    title={DAY_FULL[i]}
                    onClick={() => toggleWorkingDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category legend */}
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-3">
                Categories
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-[11px] font-semibold">Growth</p>
                    <p className="text-[9px] text-default-400">Skills, projects, long-term development</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-warning" />
                  <div>
                    <p className="text-[11px] font-semibold">Habit</p>
                    <p className="text-[9px] text-default-400">Recurring activities with frequency targets</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-secondary" />
                  <div>
                    <p className="text-[11px] font-semibold">Milestone</p>
                    <p className="text-[9px] text-default-400">One-time achievements with target dates</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Multiplier explanation */}
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
              <h3 className="text-xs font-bold text-default-500 uppercase tracking-wider mb-2">
                How Priority Works
              </h3>
              <p className="text-[10px] text-default-400 leading-relaxed">
                Higher priority goals get proportionally more tasks generated by the AI.
                A goal at 5/5 will receive roughly 5x the focus of a goal at 1/5.
                Frequency targets (e.g. &quot;5/day&quot;) tell the AI to create that many
                daily check-ins for habit-type goals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Goal Card Component ─────────────────────────────────────────────────────

interface GoalCardProps {
  goal: GoalData;
  onUpdate: (id: string, updates: Partial<GoalData>) => void;
  onDelete: (id: string) => void;
}

const GoalCard = ({ goal, onUpdate, onDelete }: GoalCardProps) => {
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [title, setTitle] = useState(goal.title);
  const [desc, setDesc] = useState(goal.description);

  const categoryColor =
    goal.category === "habit" ? "bg-warning" : goal.category === "milestone" ? "bg-secondary" : "bg-primary";

  return (
    <div className="group rounded-2xl border border-default-200/20 bg-default-50/30 p-4 hover:border-default-200/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 mb-1">
          <div className={`w-2 h-2 rounded-full ${categoryColor} shrink-0`} />
          {editingTitle ? (
            <Input
              autoFocus
              classNames={{ inputWrapper: "rounded-lg bg-default-100/50 h-7 min-h-7" }}
              size="sm"
              value={title}
              onBlur={() => { onUpdate(goal.id, { title }); setEditingTitle(false); }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { onUpdate(goal.id, { title }); setEditingTitle(false); }
                if (e.key === "Escape") { setTitle(goal.title); setEditingTitle(false); }
              }}
              onValueChange={setTitle}
            />
          ) : (
            <p
              className="text-sm font-semibold leading-snug cursor-pointer hover:text-primary transition-colors"
              onDoubleClick={() => setEditingTitle(true)}
            >
              {goal.title}
            </p>
          )}
        </div>
        <button
          className="text-default-300 hover:text-danger text-xs shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(goal.id)}
        >
          &times;
        </button>
      </div>

      {editingDesc ? (
        <Input
          autoFocus
          classNames={{ inputWrapper: "rounded-lg bg-default-100/50 h-7 min-h-7 ml-4" }}
          size="sm"
          value={desc}
          onBlur={() => { onUpdate(goal.id, { description: desc }); setEditingDesc(false); }}
          onKeyDown={(e) => {
            if (e.key === "Enter") { onUpdate(goal.id, { description: desc }); setEditingDesc(false); }
            if (e.key === "Escape") { setDesc(goal.description); setEditingDesc(false); }
          }}
          onValueChange={setDesc}
        />
      ) : (
        <p
          className="text-[11px] text-default-400 ml-4 mb-3 cursor-pointer hover:text-default-500 transition-colors"
          onDoubleClick={() => setEditingDesc(true)}
        >
          {goal.description}
        </p>
      )}

      <div className="flex items-center gap-4 ml-4">
        {/* Multiplier slider */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-[9px] text-default-400 font-semibold uppercase">Priority</label>
            <span className="text-[9px] text-primary font-bold tabular-nums">{goal.multiplier}/5</span>
          </div>
          <input
            className="w-full accent-[hsl(var(--heroui-primary))] h-1"
            max={5}
            min={1}
            step={0.5}
            type="range"
            value={goal.multiplier}
            onChange={(e) => onUpdate(goal.id, { multiplier: parseFloat(e.target.value) })}
          />
        </div>

        {/* Frequency */}
        <div className="w-20">
          <label className="text-[9px] text-default-400 font-semibold uppercase block mb-0.5">Freq</label>
          <Input
            classNames={{ inputWrapper: "rounded-md bg-default-100/50 h-6 min-h-6" }}
            placeholder="5/day"
            size="sm"
            value={goal.frequency || ""}
            onValueChange={(val) => onUpdate(goal.id, { frequency: val || null })}
          />
        </div>

        {/* Category */}
        <div className="w-24">
          <label className="text-[9px] text-default-400 font-semibold uppercase block mb-0.5">Type</label>
          <Select
            classNames={{ trigger: "rounded-md bg-default-100/50 h-6 min-h-6" }}
            defaultSelectedKeys={[goal.category]}
            size="sm"
            onSelectionChange={(keys) => {
              const val = Array.from(keys)[0] as string;
              if (val) onUpdate(goal.id, { category: val });
            }}
          >
            {CATEGORIES.map((c) => (
              <SelectItem key={c.key}>{c.label}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};
