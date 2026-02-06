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
  const today = new Date();
  const [activeTab, setActiveTab] = useState<ViewTab>("day");
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentDay, setCurrentDay] = useState(today.getDate());

  const onPrev = () => {
    if (activeTab === "day") {
      const prev = new Date(currentYear, currentMonth, currentDay - 1);
      setCurrentDay(prev.getDate());
      setCurrentMonth(prev.getMonth());
      setCurrentYear(prev.getFullYear());
    } else if (activeTab === "week") {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else if (activeTab === "month") {
      setCurrentYear(currentYear - 1);
    }
  };

  const onNext = () => {
    if (activeTab === "day") {
      const next = new Date(currentYear, currentMonth, currentDay + 1);
      setCurrentDay(next.getDate());
      setCurrentMonth(next.getMonth());
      setCurrentYear(next.getFullYear());
    } else if (activeTab === "week") {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    } else if (activeTab === "month") {
      setCurrentYear(currentYear + 1);
    }
  };

  const onToday = () => {
    const now = new Date();
    setCurrentDay(now.getDate());
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  };

  const onMonthSelect = (month: number) => {
    setCurrentMonth(month);
    setActiveTab("week");
  };

  return (
    <>
      <PlannerHeader
        activeTab={activeTab}
        currentDay={currentDay}
        currentMonth={currentMonth}
        currentYear={currentYear}
        onNext={onNext}
        onPrev={onPrev}
        onToday={onToday}
      />

      <div className="px-4 sm:px-6 pt-3 shrink-0">
        <Tabs
          classNames={{
            tabList:
              "bg-default-100/50 rounded-2xl p-1 gap-0",
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
        {activeTab === "week" && (
          <WeekView currentMonth={currentMonth} currentYear={currentYear} />
        )}
        {activeTab === "month" && (
          <MonthView
            currentYear={currentYear}
            onMonthSelect={onMonthSelect}
          />
        )}
        {activeTab === "year" && <YearView />}
      </div>
    </>
  );
};
