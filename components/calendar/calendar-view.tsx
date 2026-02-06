"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { CalendarHeader } from "@/components/navbar";
import { CalendarGrid } from "@/components/calendar/calendar-grid";
import { CalendarMobileList } from "@/components/calendar/calendar-mobile-list";

export const CalendarView = () => {
  const today = new Date();
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const onPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const onNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const onToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const onDayClick = (year: number, month: number, date: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(date).padStart(2, "0");

    router.push(`/day/${year}-${m}-${d}`);
  };

  return (
    <>
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        onNextMonth={onNextMonth}
        onPrevMonth={onPrevMonth}
        onToday={onToday}
      />
      {/* Desktop: grid view */}
      <div className="hidden sm:flex flex-1 overflow-hidden p-3 md:p-5">
        <CalendarGrid
          currentMonth={currentMonth}
          currentYear={currentYear}
          onDayClick={onDayClick}
        />
      </div>
      {/* Mobile: list view */}
      <div className="flex sm:hidden flex-1 overflow-hidden">
        <CalendarMobileList
          currentMonth={currentMonth}
          currentYear={currentYear}
          onDayClick={onDayClick}
        />
      </div>
    </>
  );
};
