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
    <header className="flex items-center justify-between px-3 sm:px-6 py-3 border-b border-default-200 bg-content1 shrink-0">
      <div className="flex items-center gap-2">
        <CalendarIcon size={28} />
        <p className="font-bold text-inherit hidden sm:block">Smart Calendar</p>
      </div>

      <div className="flex items-center gap-1">
        <Button isIconOnly size="sm" variant="light" onPress={onPrevMonth}>
          <ChevronLeftIcon size={18} />
        </Button>
        <span className="text-base sm:text-lg font-semibold min-w-[140px] sm:min-w-[200px] text-center inline-block">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <Button isIconOnly size="sm" variant="light" onPress={onNextMonth}>
          <ChevronRightIcon size={18} />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="flat" onPress={onToday}>
          Today
        </Button>
        <ThemeSwitcher />
      </div>
    </header>
  );
};
