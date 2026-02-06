import clsx from "clsx";

interface CalendarDayCellProps {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

export const CalendarDayCell = ({
  date,
  isCurrentMonth,
  isToday,
  onClick,
}: CalendarDayCellProps) => {
  return (
    <button
      className={clsx(
        "bg-content1 p-2 transition-colors cursor-pointer hover:bg-content2 text-left",
        !isCurrentMonth && "opacity-40",
      )}
      type="button"
      onClick={onClick}
    >
      <div
        className={clsx(
          "text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full",
          isToday && "bg-primary text-primary-foreground font-bold",
          !isToday && isCurrentMonth && "text-foreground",
          !isToday && !isCurrentMonth && "text-default-400",
        )}
      >
        {date}
      </div>
    </button>
  );
};
