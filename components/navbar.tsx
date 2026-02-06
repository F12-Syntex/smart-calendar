"use client";

import { Button } from "@heroui/button";

import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/components/icons";

interface CalendarHeaderProps {
  currentMonth: number;
  currentYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}

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

export const CalendarHeader = ({
  currentMonth,
  currentYear,
  onPrevMonth,
  onNextMonth,
  onToday,
}: CalendarHeaderProps) => {
  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-16 border-b border-default-200/50 bg-background/80 backdrop-blur-xl shrink-0 relative z-20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="text-primary" size={20} />
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-bold tracking-tight">Smart Calendar</p>
          <p className="text-[10px] text-default-400 font-medium uppercase tracking-widest">
            {currentYear}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 bg-default-100/50 rounded-2xl px-1 py-1">
        <Button
          isIconOnly
          className="rounded-xl min-w-8 w-8 h-8"
          size="sm"
          variant="light"
          onPress={onPrevMonth}
        >
          <ChevronLeftIcon size={16} />
        </Button>
        <span className="text-sm font-bold min-w-[130px] sm:min-w-[160px] text-center select-none tracking-tight">
          {MONTH_NAMES[currentMonth]}
        </span>
        <Button
          isIconOnly
          className="rounded-xl min-w-8 w-8 h-8"
          size="sm"
          variant="light"
          onPress={onNextMonth}
        >
          <ChevronRightIcon size={16} />
        </Button>
      </div>

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
