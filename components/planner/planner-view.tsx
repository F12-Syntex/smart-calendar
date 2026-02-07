"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";

import { PlannerHeader } from "@/components/navbar";
import { DayView } from "@/components/planner/day-view";
import { WeekView } from "@/components/planner/week-view";
import { MonthView } from "@/components/planner/month-view";
import { YearView } from "@/components/planner/year-view";

type ViewTab = "day" | "week" | "month" | "year";

export const PlannerView = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>("day");

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
