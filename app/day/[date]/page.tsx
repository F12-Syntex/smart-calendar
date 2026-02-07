"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import { ChevronLeft } from "lucide-react";
import { ThemeSwitcher } from "@/components/theme-switcher";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
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

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const dateStr = params.date as string;

  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  const dateObj = new Date(year, month, day);
  const dayOfWeek = dateObj.getDay();

  const today = new Date();
  const isToday =
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const currentHour = isToday ? today.getHours() : -1;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 sm:px-6 h-16 border-b border-default-200/50 bg-background/80 backdrop-blur-xl shrink-0 relative z-20">
        <Button
          isIconOnly
          className="rounded-xl"
          size="sm"
          variant="light"
          onPress={() => router.push("/")}
        >
          <ChevronLeft size={18} />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold tracking-tight">
              {DAY_NAMES[dayOfWeek]}, {MONTH_NAMES[month]} {day}
            </h1>
            {isToday && (
              <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
          <p className="text-[11px] text-default-400 font-medium">{year}</p>
        </div>
        <ThemeSwitcher />
      </header>

      {/* Hour timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {Array.from({ length: 24 }, (_, i) => {
            const hour = i;
            const label =
              hour === 0
                ? "12 AM"
                : hour < 12
                  ? `${hour} AM`
                  : hour === 12
                    ? "12 PM"
                    : `${hour - 12} PM`;
            const isCurrent = hour === currentHour;

            return (
              <div key={hour} className="flex min-h-[64px] group relative">
                <div
                  className={`w-16 sm:w-20 shrink-0 py-2.5 pr-3 text-right text-[11px] font-semibold ${
                    isCurrent ? "text-primary" : "text-default-300"
                  }`}
                >
                  {label}
                </div>
                <div className="flex-1 border-l border-t border-default-200/30 group-hover:bg-primary/[0.03] transition-colors" />
                {isCurrent && (
                  <div className="absolute left-16 sm:left-20 right-0 top-0 flex items-center z-10">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary -ml-[5px] shadow-lg shadow-primary/30" />
                    <div className="flex-1 h-[2px] bg-primary/60" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
