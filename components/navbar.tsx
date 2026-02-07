"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { CalendarIcon } from "@/components/icons";
import { Tabs, Tab } from "@heroui/tabs";

type ViewTab = "day" | "week" | "month" | "year" | "timetable" | "goals";

interface PlannerHeaderProps {
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
}

export const PlannerHeader = ({ activeTab, onTabChange }: PlannerHeaderProps) => {
  const year = new Date().getFullYear();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 border-b border-default-200/30 bg-background/80 backdrop-blur-xl shrink-0 relative z-20">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="text-primary" size={18} />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-tight leading-none">Smart Planner</p>
          <p className="text-[10px] text-default-400 font-medium uppercase tracking-widest">
            {year}
          </p>
        </div>
      </div>

      {/* Tabs in header on desktop */}
      <div className="hidden md:block">
        <Tabs
          classNames={{
            tabList: "bg-default-100/50 rounded-xl p-0.5 gap-0",
            tab: "rounded-lg h-7 text-[11px] font-semibold px-3",
            cursor: "rounded-lg",
          }}
          selectedKey={activeTab}
          size="sm"
          variant="solid"
          onSelectionChange={(key) => onTabChange(key as ViewTab)}
        >
          <Tab key="day" title="Day" />
          <Tab key="week" title="Week" />
          <Tab key="timetable" title="Timetable" />
          <Tab key="month" title="Month" />
          <Tab key="year" title="Year" />
          <Tab key="goals" title="Goals" />
        </Tabs>
      </div>

      <div className="flex items-center gap-1.5">
        <ThemeSwitcher />
      </div>
    </header>
  );
};
