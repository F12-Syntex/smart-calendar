import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";

interface CalendarGridProps {
  currentMonth: number;
  currentYear: number;
  onDayClick: (year: number, month: number, date: number) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayCellData {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function getCalendarDays(month: number, year: number): DayCellData[] {
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: DayCellData[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    const date = daysInPrevMonth - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;

    days.push({
      date,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday:
        date === today.getDate() &&
        prevMonth === today.getMonth() &&
        prevYear === today.getFullYear(),
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: d,
      month,
      year,
      isCurrentMonth: true,
      isToday:
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
    });
  }

  const remaining = 42 - days.length;

  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;

    days.push({
      date: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday:
        d === today.getDate() &&
        nextMonth === today.getMonth() &&
        nextYear === today.getFullYear(),
    });
  }

  return days;
}

export const CalendarGrid = ({
  currentMonth,
  currentYear,
  onDayClick,
}: CalendarGridProps) => {
  const days = getCalendarDays(currentMonth, currentYear);

  return (
    <div className="flex flex-col h-full w-full">
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name + i}
            className="text-center text-sm font-semibold text-default-500 py-1"
          >
            {name}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 grid-rows-6 flex-1 gap-px bg-default-200 border border-default-200 rounded-lg overflow-hidden">
        {days.map((day, index) => (
          <CalendarDayCell
            key={index}
            date={day.date}
            isCurrentMonth={day.isCurrentMonth}
            isToday={day.isToday}
            onClick={() => onDayClick(day.year, day.month, day.date)}
          />
        ))}
      </div>
    </div>
  );
};
