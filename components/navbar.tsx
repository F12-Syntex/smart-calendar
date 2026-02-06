"use client";

import { Button } from "@heroui/button";

import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type ViewTab = "day" | "week" | "month" | "year";

interface PlannerHeaderProps {
  activeTab: ViewTab;
  currentDay: number;
  currentMonth: number;
  currentYear: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

function getHeaderLabel(
  tab: ViewTab,
  day: number,
  month: number,
  year: number,
): string {
  const dateObj = new Date(year, month, day);

  switch (tab) {
    case "day":
      return `${DAY_NAMES[dateObj.getDay()]}, ${MONTH_NAMES[month]} ${day}`;
    case "week":
      return `${MONTH_NAMES[month]} ${year}`;
    case "month":
      return `${year}`;
    case "year":
      return `${year}`;
  }
}

export const PlannerHeader = ({
  activeTab,
  currentDay,
  currentMonth,
  currentYear,
  onPrev,
  onNext,
  onToday,
}: PlannerHeaderProps) => {
  const label = getHeaderLabel(
    activeTab,
    currentDay,
    currentMonth,
    currentYear,
  );
  const showNav = activeTab !== "year";

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-default-200/50 bg-background/80 backdrop-blur-xl shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="text-primary" size={20} />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-tight">Smart Planner</p>
          <p className="text-[10px] text-default-400 font-medium uppercase tracking-widest">
            {currentYear}
          </p>
        </div>
      </div>

      {showNav ? (
        <div className="flex items-center gap-0.5 bg-default-100/50 rounded-2xl px-1 py-1">
          <Button
            isIconOnly
            className="rounded-xl min-w-8 w-8 h-8"
            size="sm"
            variant="light"
            onPress={onPrev}
          >
            <ChevronLeftIcon size={16} />
          </Button>
          <span className="text-sm font-bold min-w-[130px] sm:min-w-[200px] text-center select-none tracking-tight">
            {label}
          </span>
          <Button
            isIconOnly
            className="rounded-xl min-w-8 w-8 h-8"
            size="sm"
            variant="light"
            onPress={onNext}
          >
            <ChevronRightIcon size={16} />
          </Button>
        </div>
      ) : (
        <span className="text-sm font-bold select-none tracking-tight">
          {label}
        </span>
      )}

      <div className="flex items-center gap-1.5">
        <Button
          className="rounded-xl font-semibold text-xs h-8 px-3"
          color="primary"
          size="sm"
          variant="flat"
          onPress={onToday}
        >
          Today
        </Button>
        <ThemeSwitcher />
      </div>
    </header>
  );
};
