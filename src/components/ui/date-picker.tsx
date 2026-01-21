import * as React from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

const months = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];

const weekDays = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pa"];

export function DatePicker({
  value,
  onChange,
  className,
  placeholder = "Tarih seçin",
  disabled = false,
  min,
  max,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentDate, setCurrentDate] = React.useState(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  const inputRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0

    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const handleDateSelect = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const selected = new Date(year, month, day);
    const dateString = selected.toISOString().split("T")[0];
    
    // Check min/max constraints
    if (min && dateString < min) return;
    if (max && dateString > max) return;
    
    onChange(dateString);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const todayString = today.toISOString().split("T")[0];
    
    if (min && todayString < min) return;
    if (max && todayString > max) return;
    
    onChange(todayString);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const formatDisplayValue = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  return (
    <div ref={inputRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "ring-2 ring-ring ring-offset-2"
        )}
      >
        <span className={cn(!value && "text-muted-foreground")}>
          {value ? formatDisplayValue(value) : placeholder}
        </span>
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-[320px] rounded-lg border border-border bg-popover p-4 shadow-lg">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-md p-1.5 hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-2">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => {
                  const newDate = new Date(currentDate.getFullYear(), parseInt(e.target.value), 1);
                  setCurrentDate(newDate);
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {months.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => {
                  const newDate = new Date(parseInt(e.target.value), currentDate.getMonth(), 1);
                  setCurrentDate(newDate);
                }}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Array.from({ length: 100 }, (_, i) => today.getFullYear() - 50 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-md p-1.5 hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Week days */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {weekDays.map((day) => (
              <div
                key={day}
                className="flex h-8 items-center justify-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="h-8" />;
              }

              const dateString = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day
              ).toISOString().split("T")[0];

              const isSelected = dateString === value;
              const isToday = dateString === todayString;
              const isDisabled = (min && dateString < min) || (max && dateString > max);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => !isDisabled && handleDateSelect(day)}
                  disabled={isDisabled}
                  className={cn(
                    "h-8 rounded-md text-sm transition-colors",
                    "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                    isDisabled && "cursor-not-allowed opacity-30",
                    isSelected && "bg-primary text-primary-foreground hover:bg-primary/90",
                    !isSelected && !isDisabled && "hover:bg-muted",
                    isToday && !isSelected && "border border-primary font-semibold"
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-primary hover:underline"
            >
              Temizle
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="text-sm text-primary hover:underline"
            >
              Bugün
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
