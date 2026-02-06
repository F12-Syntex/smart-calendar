"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { CalendarIcon } from "@/components/icons";

type ViewTab = "day" | "week" | "month" | "year";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

interface PlannerHeaderProps {
  activeTab: ViewTab;
}

function getHeaderLabel(tab: ViewTab): string {
  const today = new Date();
  switch (tab) {
    case "day":
      return `${DAY_NAMES[today.getDay()]}, ${MONTH_NAMES[today.getMonth()]} ${today.getDate()}`;
    case "week":
      return `This Week`;
    case "month":
      return `${MONTH_NAMES[today.getMonth()]} ${today.getFullYear()}`;
    case "year":
      return `${today.getFullYear()}`;
  }
}

export const PlannerHeader = ({ activeTab }: PlannerHeaderProps) => {
  const label = getHeaderLabel(activeTab);
  const year = new Date().getFullYear();

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-default-200/50 bg-background/80 backdrop-blur-xl shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="text-primary" size={20} />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-tight">Smart Planner</p>
          <p className="text-[10px] text-default-400 font-medium uppercase tracking-widest">
            {year}
          </p>
        </div>
      </div>

      <span className="text-sm font-bold select-none tracking-tight">
        {label}
      </span>

      <div className="flex items-center gap-1.5">
        <ThemeSwitcher />
      </div>
    </header>
  );
};
