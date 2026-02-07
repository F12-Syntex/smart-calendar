"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Globe,
  Clock,
  Target,
  CalendarDays,
} from "lucide-react";

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

interface DynamicSource {
  url: string;
  description: string;
}

export const SettingsView = () => {
  const year = new Date().getFullYear();

  const [goals, setGoals] = useState<GoalData[]>([]);
  const [workingDays, setWorkingDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dailySchedule, setDailySchedule] = useState("");
  const [dynamicSources, setDynamicSources] = useState<DynamicSource[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");

  // Collapsible sections
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [scheduleOpen, setScheduleOpen] = useState(true);
  const [sourcesOpen, setSourcesOpen] = useState(true);
  const [workingDaysOpen, setWorkingDaysOpen] = useState(true);

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
    setDailySchedule(data.dailySchedule || "");
    if (data.dynamicSources) {
      try {
        setDynamicSources(JSON.parse(data.dynamicSources));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    fetchGoals();
    fetchSettings();
  }, [fetchGoals, fetchSettings]);

  // ── Goal actions ──
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

  // ── Working days ──
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

  // ── Daily schedule ──
  const saveDailySchedule = async () => {
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dailySchedule: dailySchedule || null }),
    });
  };

  // ── Dynamic sources ──
  const saveDynamicSources = async (sources: DynamicSource[]) => {
    setDynamicSources(sources);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dynamicSources: JSON.stringify(sources) }),
    });
  };

  const addSource = () => {
    saveDynamicSources([...dynamicSources, { url: "", description: "" }]);
  };

  const updateSource = (index: number, updates: Partial<DynamicSource>) => {
    const next = dynamicSources.map((s, i) =>
      i === index ? { ...s, ...updates } : s,
    );
    setDynamicSources(next);
  };

  const saveSource = (index: number) => {
    saveDynamicSources(dynamicSources);
  };

  const removeSource = (index: number) => {
    saveDynamicSources(dynamicSources.filter((_, i) => i !== index));
  };

  // ── Sync plan ──
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
            <h2 className="text-base font-bold tracking-tight">Settings</h2>
            <p className="text-[11px] text-default-400 font-medium">
              Goals, schedule, and preferences
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

      <div className="flex-1 p-4 sm:p-5 lg:p-6 max-w-3xl mx-auto w-full space-y-4">
        {/* ── Section: Goals ── */}
        <SectionHeader
          icon={<Target size={14} />}
          isOpen={goalsOpen}
          subtitle={`${goals.length} goal${goals.length !== 1 ? "s" : ""}`}
          title="Goals"
          onToggle={() => setGoalsOpen(!goalsOpen)}
        />
        {goalsOpen && (
          <div className="space-y-3">
            {goals.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-default-100/50 flex items-center justify-center mb-3">
                  <Plus className="text-default-300" size={20} />
                </div>
                <p className="text-sm text-default-400 mb-1">No goals yet</p>
                <p className="text-[11px] text-default-300">Add your first goal below</p>
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
            <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
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
                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[120px]">
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
        )}

        {/* ── Section: Working Days ── */}
        <SectionHeader
          icon={<CalendarDays size={14} />}
          isOpen={workingDaysOpen}
          subtitle={`${workingDays.length} days active`}
          title="Working Days"
          onToggle={() => setWorkingDaysOpen(!workingDaysOpen)}
        />
        {workingDaysOpen && (
          <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
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
        )}

        {/* ── Section: Daily Schedule ── */}
        <SectionHeader
          icon={<Clock size={14} />}
          isOpen={scheduleOpen}
          subtitle={dailySchedule ? "Configured" : "Not set"}
          title="Daily Schedule"
          onToggle={() => setScheduleOpen(!scheduleOpen)}
        />
        {scheduleOpen && (
          <div className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4">
            <p className="text-[10px] text-default-400 mb-3">
              Describe your typical day in natural language. The AI will use this to schedule tasks at appropriate times.
            </p>
            <textarea
              className="w-full rounded-lg bg-default-100/50 border border-default-200/30 p-3 text-sm text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[100px]"
              placeholder="e.g. I wake up at 7am, get ready until 8am. Work from 9am-5pm with lunch at 12:30pm. Gym at 6pm for an hour. Free time from 7:30pm. Bed by 11pm."
              value={dailySchedule}
              onBlur={saveDailySchedule}
              onChange={(e) => setDailySchedule(e.target.value)}
            />
          </div>
        )}

        {/* ── Section: Dynamic Sources ── */}
        <SectionHeader
          icon={<Globe size={14} />}
          isOpen={sourcesOpen}
          subtitle={`${dynamicSources.length} source${dynamicSources.length !== 1 ? "s" : ""}`}
          title="Dynamic Sources"
          onToggle={() => setSourcesOpen(!sourcesOpen)}
        />
        {sourcesOpen && (
          <div className="space-y-3">
            <p className="text-[10px] text-default-400 px-1">
              Attach URLs that contain scheduling data (e.g. prayer timetables, class schedules).
              The AI will fetch and use this data when generating your daily plan.
            </p>

            {dynamicSources.map((source, i) => (
              <div
                key={i}
                className="rounded-2xl border border-default-200/20 bg-default-50/30 p-4"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-[11px] text-default-400 font-semibold uppercase">
                    <Globe size={12} />
                    Source {i + 1}
                  </div>
                  <button
                    className="text-default-300 hover:text-danger cursor-pointer transition-colors"
                    onClick={() => removeSource(i)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <Input
                  classNames={{ inputWrapper: "rounded-lg bg-default-100/50 mb-2" }}
                  placeholder="https://example.com/schedule.pdf"
                  size="sm"
                  value={source.url}
                  onBlur={() => saveSource(i)}
                  onValueChange={(val) => updateSource(i, { url: val })}
                />
                <textarea
                  className="w-full rounded-lg bg-default-100/50 border border-default-200/30 p-2.5 text-xs text-foreground placeholder:text-default-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none min-h-[60px]"
                  placeholder="How should the AI use this? e.g. Prayer times - takes 5 min to get there, 10 min for prayer, 5 min back = 30 min total per prayer"
                  value={source.description}
                  onBlur={() => saveSource(i)}
                  onChange={(e) => updateSource(i, { description: e.target.value })}
                />
              </div>
            ))}

            <button
              className="flex items-center gap-2 text-[11px] text-default-400 hover:text-primary px-3 py-2 cursor-pointer transition-colors"
              onClick={addSource}
            >
              <Plus size={14} />
              Add source
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Section Header ─────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const SectionHeader = ({ title, subtitle, icon, isOpen, onToggle }: SectionHeaderProps) => (
  <button
    className="w-full flex items-center gap-3 py-2 px-1 cursor-pointer group"
    onClick={onToggle}
  >
    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
      {icon}
    </div>
    <div className="flex-1 text-left">
      <p className="text-sm font-bold leading-none">{title}</p>
      <p className="text-[10px] text-default-400 mt-0.5">{subtitle}</p>
    </div>
    <div className="text-default-400 group-hover:text-default-600 transition-colors">
      {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </div>
  </button>
);

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
          className="text-default-300 hover:text-danger shrink-0 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => onDelete(goal.id)}
        >
          <Trash2 size={14} />
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

      <div className="flex flex-wrap items-center gap-4 ml-4">
        {/* Multiplier slider */}
        <div className="flex-1 min-w-[120px]">
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
