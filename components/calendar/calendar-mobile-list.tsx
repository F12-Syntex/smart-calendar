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

    return { date, dayOfWeek, isToday };
  });

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="divide-y divide-default-200">
        {days.map((day) => (
          <button
            key={day.date}
            className={clsx(
              "w-full flex items-center gap-4 px-4 py-3 hover:bg-content2 active:bg-content2 transition-colors text-left",
              day.isToday && "bg-primary/10",
            )}
            type="button"
            onClick={() => onDayClick(currentYear, currentMonth, day.date)}
          >
            <div
              className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold shrink-0",
                day.isToday
                  ? "bg-primary text-primary-foreground"
                  : "bg-content2 text-foreground",
              )}
            >
              {day.date}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground">
                {DAY_NAMES[day.dayOfWeek]}
              </div>
              <div className="text-xs text-default-500">
                {MONTH_NAMES[currentMonth]} {day.date}, {currentYear}
              </div>
            </div>
            <div className="text-xs text-default-400">No events</div>
          </button>
        ))}
      </div>
    </div>
  );
};
