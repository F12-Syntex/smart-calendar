"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";

import { PlannerHeader } from "@/components/navbar";
import { DayView } from "@/components/planner/day-view";
import { WeekView } from "@/components/planner/week-view";
import { MonthView } from "@/components/planner/month-view";
import { YearView } from "@/components/planner/year-view";
import { TimetableView } from "@/components/planner/timetable-view";
import { SettingsView } from "@/components/planner/settings-view";

type ViewTab = "day" | "week" | "month" | "year" | "timetable" | "settings";

export const PlannerView = () => {
  const [activeTab, setActiveTab] = useState<ViewTab>("day");

  return (
    <>
      <PlannerHeader activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Mobile tabs */}
      <div className="md:hidden px-4 pt-2 pb-1 shrink-0">
        <Tabs
          classNames={{
            tabList: "bg-default-100/50 rounded-xl p-0.5 gap-0 w-full",
            tab: "rounded-lg h-7 text-[11px] font-semibold",
            cursor: "rounded-lg",
          }}
          fullWidth
          selectedKey={activeTab}
          size="sm"
          variant="solid"
          onSelectionChange={(key) => setActiveTab(key as ViewTab)}
        >
          <Tab key="day" title="Day" />
          <Tab key="week" title="Week" />
          <Tab key="timetable" title="Table" />
          <Tab key="month" title="Month" />
          <Tab key="year" title="Year" />
          <Tab key="settings" title="Settings" />
        </Tabs>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto">
          {activeTab === "day" && <DayView />}
          {activeTab === "week" && <WeekView />}
          {activeTab === "timetable" && <TimetableView />}
          {activeTab === "month" && <MonthView />}
          {activeTab === "year" && <YearView />}
          {activeTab === "settings" && <SettingsView />}
        </div>
      </div>
    </>
  );
};
