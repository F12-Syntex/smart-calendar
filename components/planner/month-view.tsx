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

const MONTH_SHORT = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

interface MonthViewProps {
  currentYear: number;
  onMonthSelect: (month: number) => void;
}

export const MonthView = ({ currentYear, onMonthSelect }: MonthViewProps) => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const isCurrentYear = today.getFullYear() === currentYear;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-4 sm:px-6 py-4 border-b border-default-200/30">
        <h2 className="text-lg font-bold tracking-tight">{currentYear}</h2>
        <p className="text-xs text-default-400 font-medium">12 months</p>
      </div>

      <div className="flex-1 p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {MONTH_NAMES.map((name, i) => {
            const isNow = isCurrentYear && i === currentMonth;
            const isPast = isCurrentYear && i < currentMonth;
            const daysInMonth = new Date(currentYear, i + 1, 0).getDate();

            return (
              <button
                key={i}
                className={`relative rounded-2xl border p-4 text-left transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                  isNow
                    ? "border-primary/40 bg-primary/[0.06] shadow-sm"
                    : isPast
                      ? "border-default-200/20 bg-default-50/30 opacity-60"
                      : "border-default-200/30 bg-default-50/50 hover:bg-default-100/50"
                }`}
                onClick={() => onMonthSelect(i)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[11px] font-bold tracking-widest ${
                      isNow ? "text-primary" : "text-default-400"
                    }`}
                  >
                    {MONTH_SHORT[i]}
                  </span>
                  {isNow && (
                    <span className="text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Now
                    </span>
                  )}
                </div>
                <p className="text-base font-bold tracking-tight">{name}</p>
                <p className="text-[11px] text-default-400 mt-1">
                  {daysInMonth} days
                </p>
                <div className="mt-3 pt-2 border-t border-default-200/20">
                  <p className="text-[11px] text-default-300 italic">
                    No tasks
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
