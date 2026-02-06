"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@heroui/button";

import { ChevronLeftIcon } from "@/components/icons";

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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-default-200 bg-content1 shrink-0">
        <Button
          isIconOnly
          size="sm"
          variant="light"
          onPress={() => router.push("/")}
        >
          <ChevronLeftIcon size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg sm:text-xl font-bold">
            {DAY_NAMES[dayOfWeek]}, {MONTH_NAMES[month]} {day}
          </h1>
          <p className="text-sm text-default-500">
            {year}
            {isToday && (
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
          </p>
        </div>
      </header>

      {/* Day content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hour timeline */}
        <div className="divide-y divide-default-100">
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

            return (
              <div
                key={hour}
                className="flex min-h-[60px] hover:bg-content2 transition-colors"
              >
                <div className="w-16 sm:w-20 shrink-0 py-2 pr-3 text-right text-xs text-default-400">
                  {label}
                </div>
                <div className="flex-1 border-l border-default-200 py-2 px-3" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
