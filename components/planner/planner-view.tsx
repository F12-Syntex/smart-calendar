"use client";

import { useState, useEffect, useCallback } from "react";
import { Tabs, Tab } from "@heroui/tabs";

import { PlannerHeader } from "@/components/navbar";
import { DayView } from "@/components/planner/day-view";
import { WeekView } from "@/components/planner/week-view";
import { MonthView } from "@/components/planner/month-view";
import { YearView } from "@/components/planner/year-view";
import { GoalChat } from "@/components/planner/goal-chat";

type ViewTab = "day" | "week" | "month" | "year";

export const PlannerView = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>("day");
  const [hasGoals, setHasGoals] = useState<boolean | null>(null); // null = loading

  const checkGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    const goals = await res.json();
    setHasGoals(goals.length > 0);
  }, []);

  useEffect(() => {
    checkGoals();
  }, [checkGoals]);

  const onGoalsComplete = () => {
    setHasGoals(true);
  };

  // Loading state
  if (hasGoals === null) {
    return (
      <>
        <PlannerHeader activeTab={activeTab} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-default-400">Loading...</p>
        </div>
      </>
    );
  }

  // No goals — show onboarding chat
  if (!hasGoals) {
    return (
      <>
        <PlannerHeader activeTab={activeTab} />
        <div className="flex-1 overflow-hidden">
          <GoalChat onGoalsComplete={onGoalsComplete} />
        </div>
      </>
    );
  }

  return (
    <>
      <PlannerHeader activeTab={activeTab} />

      <div className="px-4 sm:px-6 pt-3 shrink-0">
        <Tabs
          classNames={{
            tabList: "bg-default-100/50 rounded-2xl p-1 gap-0",
            tab: "rounded-xl h-8 text-xs font-semibold",
            cursor: "rounded-xl",
          }}
          selectedKey={activeTab}
          size="sm"
          variant="solid"
          onSelectionChange={(key) => setActiveTab(key as ViewTab)}
        >
          <Tab key="day" title="Day" />
          <Tab key="week" title="Week" />
          <Tab key="month" title="Month" />
          <Tab key="year" title="Year" />
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "day" && <DayView />}
        {activeTab === "week" && <WeekView />}
        {activeTab === "month" && <MonthView />}
        {activeTab === "year" && <YearView />}
      </div>
    </>
  );
};
