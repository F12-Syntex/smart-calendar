import clsx from "clsx";

interface CalendarDayCellProps {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  onClick: () => void;
}

export const CalendarDayCell = ({
  date,
  isCurrentMonth,
  isToday,
  isWeekend,
  onClick,
}: CalendarDayCellProps) => {
  return (
    <button
      className={clsx(
        "relative flex flex-col items-center pt-2 pb-1 transition-all duration-150 border-b border-r border-default-200/20",
        "hover:bg-primary/5 active:scale-[0.97]",
        isCurrentMonth ? "bg-content1" : "bg-background/50",
        !isCurrentMonth && "opacity-30",
      )}
      type="button"
      onClick={onClick}
    >
      <div
        className={clsx(
          "text-xs font-semibold w-7 h-7 flex items-center justify-center rounded-full transition-all",
          isToday &&
            "bg-primary text-primary-foreground font-extrabold shadow-lg shadow-primary/30 scale-110",
          !isToday && isCurrentMonth && isWeekend && "text-primary/70",
          !isToday && isCurrentMonth && !isWeekend && "text-foreground",
          !isToday && !isCurrentMonth && "text-default-400",
        )}
      >
        {date}
      </div>
    </button>
  );
};
