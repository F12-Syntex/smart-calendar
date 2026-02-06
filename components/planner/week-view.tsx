"use client";

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

const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface WeekInfo {
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  days: Date[];
}

function getWeeksOfMonth(year: number, month: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  let currentDate = new Date(firstDay);
  // Adjust to start of week (Sunday)
  currentDate.setDate(currentDate.getDate() - currentDate.getDay());

  let weekNum = 1;

  while (currentDate <= lastDay || weekNum === 1) {
    const days: Date[] = [];
    const weekStart = new Date(currentDate);

    for (let i = 0; i < 7; i++) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weekEnd = new Date(days[6]);

    weeks.push({
      weekNumber: weekNum,
      startDate: weekStart,
      endDate: weekEnd,
      days,
    });

    weekNum++;

    if (currentDate.getMonth() !== month && currentDate.getDay() === 0) {
      break;
    }
  }

  return weeks;
}

function formatShortDate(date: Date): string {
  return `${date.getDate()}`;
}

interface WeekViewProps {
  currentMonth: number;
  currentYear: number;
}

export const WeekView = ({ currentMonth, currentYear }: WeekViewProps) => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const weeks = getWeeksOfMonth(currentYear, currentMonth);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <h2 className="text-lg font-bold tracking-tight">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h2>
        <p className="text-xs text-default-400 font-medium">
          {weeks.length} weeks
        </p>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-3">
        {weeks.map((week) => {
          const hasToday = week.days.some((d) => {
            const dStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
            return dStr === todayStr;
          });

          return (
            <div
              key={week.weekNumber}
              className={`rounded-2xl border p-4 transition-all ${
                hasToday
                  ? "border-primary/40 bg-primary/[0.04] shadow-sm"
                  : "border-default-200/30 bg-default-50/50 hover:bg-default-100/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">
                    Week {week.weekNumber}
                  </span>
                  {hasToday && (
                    <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-xs text-default-400 font-medium">
                  {MONTH_NAMES[week.startDate.getMonth()].slice(0, 3)}{" "}
                  {week.startDate.getDate()} —{" "}
                  {MONTH_NAMES[week.endDate.getMonth()].slice(0, 3)}{" "}
                  {week.endDate.getDate()}
                </span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {week.days.map((day, i) => {
                  const dayStr = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                  const isToday = dayStr === todayStr;
                  const isCurrentMonth = day.getMonth() === currentMonth;

                  return (
                    <div
                      key={i}
                      className={`flex flex-col items-center py-2 rounded-xl transition-colors ${
                        isToday
                          ? "bg-primary text-primary-foreground"
                          : isCurrentMonth
                            ? "text-foreground"
                            : "text-default-300"
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase">
                        {DAY_NAMES_SHORT[i]}
                      </span>
                      <span
                        className={`text-sm font-bold ${isToday ? "" : ""}`}
                      >
                        {formatShortDate(day)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-default-200/20">
                <p className="text-xs text-default-300 italic">
                  No tasks planned
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
