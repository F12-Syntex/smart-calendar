import { CalendarDayCell } from "@/components/calendar/calendar-day-cell";

interface CalendarGridProps {
  currentMonth: number;
  currentYear: number;
  onDayClick: (year: number, month: number, date: number) => void;
}

const DAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

interface DayCellData {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
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
    const dow = new Date(prevYear, prevMonth, date).getDay();

    days.push({
      date,
      month: prevMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday:
        date === today.getDate() &&
        prevMonth === today.getMonth() &&
        prevYear === today.getFullYear(),
      isWeekend: dow === 0 || dow === 6,
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay();

    days.push({
      date: d,
      month,
      year,
      isCurrentMonth: true,
      isToday:
        d === today.getDate() &&
        month === today.getMonth() &&
        year === today.getFullYear(),
      isWeekend: dow === 0 || dow === 6,
    });
  }

  const remaining = 42 - days.length;

  for (let d = 1; d <= remaining; d++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dow = new Date(nextYear, nextMonth, d).getDay();

    days.push({
      date: d,
      month: nextMonth,
      year: nextYear,
      isCurrentMonth: false,
      isToday:
        d === today.getDate() &&
        nextMonth === today.getMonth() &&
        nextYear === today.getFullYear(),
      isWeekend: dow === 0 || dow === 6,
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
    <div className="flex flex-col h-full w-full gap-2">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name + i}
            className={`text-center text-[10px] font-bold tracking-widest py-2 ${
              i === 0 || i === 6 ? "text-primary/60" : "text-default-400"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 rounded-2xl overflow-hidden border border-default-200/40 bg-default-100/30">
        {days.map((day, index) => (
          <CalendarDayCell
            key={index}
            date={day.date}
            isCurrentMonth={day.isCurrentMonth}
            isToday={day.isToday}
            isWeekend={day.isWeekend}
            onClick={() => onDayClick(day.year, day.month, day.date)}
          />
        ))}
      </div>
    </div>
  );
};
