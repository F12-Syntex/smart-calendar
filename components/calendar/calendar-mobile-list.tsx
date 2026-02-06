import clsx from "clsx";

interface CalendarMobileListProps {
  currentMonth: number;
  currentYear: number;
  onDayClick: (year: number, month: number, date: number) => void;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const CalendarMobileList = ({
  currentMonth,
  currentYear,
  onDayClick,
}: CalendarMobileListProps) => {
  const today = new Date();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = i + 1;
    const dayOfWeek = new Date(currentYear, currentMonth, date).getDay();
    const isToday =
      date === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return { date, dayOfWeek, isToday, isWeekend };
  });

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2">
      <div className="flex flex-col gap-1">
        {days.map((day) => (
          <button
            key={day.date}
            className={clsx(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all active:scale-[0.98]",
              day.isToday
                ? "bg-primary/10 ring-1 ring-primary/20"
                : "hover:bg-default-100/60",
            )}
            type="button"
            onClick={() => onDayClick(currentYear, currentMonth, day.date)}
          >
            <div
              className={clsx(
                "w-11 h-11 rounded-xl flex flex-col items-center justify-center shrink-0",
                day.isToday
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-default-100 text-foreground",
              )}
            >
              <span className="text-lg font-bold leading-none">{day.date}</span>
              <span className="text-[8px] font-bold uppercase tracking-wider opacity-70">
                {DAY_SHORT[day.dayOfWeek]}
              </span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div
                className={clsx(
                  "text-sm font-semibold",
                  day.isWeekend ? "text-primary/80" : "text-foreground",
                )}
              >
                {DAY_NAMES[day.dayOfWeek]}
              </div>
              <div className="text-[11px] text-default-400">
                {MONTH_NAMES[currentMonth]} {day.date}, {currentYear}
              </div>
            </div>
            <div className="text-[10px] text-default-300 font-medium">
              No events
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
