import { type CalendarDate } from "@internationalized/date";
import { format, isSameDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/Button";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { DateView } from "./DateView";
import { TimeView } from "./TimeView";
import { YearView } from "./YearView";

type DateTimePickerProps = {
  date: Date;
  setDate: (date: Date) => void;
  minValue?: Date;
  preferredTimes?: string[];
};

export const DateTimePicker = ({
  date,
  setDate,
  minValue,
  preferredTimes = [],
}: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"date" | "time" | "year">("date");
  const [tempDate, setTempDate] = useState<Date>(date);
  const [focusedInput, setFocusedInput] = useState<"hours" | "minutes" | null>(null);
  const [yearInputValue, setYearInputValue] = useState<string>(date.getFullYear().toString());
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempDate(date);
    setYearInputValue(date.getFullYear().toString());
  }, [date]);

  useEffect(() => {
    if (!open) {
      setView("date");
      setFocusedInput(null);
    }
  }, [open]);

  const switchToYearMode = () => {
    setView("year");
    setTempDate(date);
    setYearInputValue(date.getFullYear().toString());
    // Focus year input after switching to year mode
    setTimeout(() => {
      yearRef.current?.focus();
    }, 0);
  };

  const handleCalendarChange = (newDate: CalendarDate | null) => {
    if (!newDate) return;
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDate.year);
    updatedDate.setMonth(newDate.month - 1);
    updatedDate.setDate(newDate.day);
    setDate(updatedDate);
    // Switch to time mode after selecting a date
    switchToTimeMode();
  };

  const switchToTimeMode = () => {
    setView("time");
    setTempDate(date);
    setFocusedInput("hours");
  };

  const switchToDateMode = () => {
    setView("date");
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
  };

  const handleHourChange = (hour: number) => {
    const updated = new Date(tempDate);
    // Wrap around: -1 becomes 23, 24 becomes 0
    const clampedHour = hour < 0 ? 23 : hour > 23 ? 0 : hour;
    updated.setHours(clampedHour);

    // Check if this hour is disabled
    if (minValue && isSameDay(date, minValue)) {
      const minHour = minValue.getHours();
      if (clampedHour < minHour) {
        return;
      }
      // If selecting the minimum hour, ensure minutes are also valid
      if (clampedHour === minHour && updated.getMinutes() < minValue.getMinutes()) {
        updated.setMinutes(minValue.getMinutes());
      }
    }

    setTempDate(updated);
    handleTimeChange(updated.getHours(), updated.getMinutes());
    // Focus minutes input after selecting an hour
    setTimeout(() => {
      minutesRef.current?.focus();
    }, 0);
  };

  const handleMinuteChange = (minute: number) => {
    const updated = new Date(tempDate);
    // Wrap around: -1 becomes 59, 60 becomes 0
    const clampedMinute = minute < 0 ? 59 : minute > 59 ? 0 : minute;
    updated.setMinutes(clampedMinute);

    // Check if this minute is disabled
    if (minValue && isSameDay(date, minValue)) {
      const selectedHour = updated.getHours();
      const minHour = minValue.getHours();
      const minMinute = minValue.getMinutes();

      if (selectedHour < minHour || (selectedHour === minHour && clampedMinute < minMinute)) {
        return;
      }
    }

    setTempDate(updated);
    handleTimeChange(updated.getHours(), updated.getMinutes());
  };

  const handleYearChange = (year: number) => {
    const updated = new Date(tempDate);
    // Set reasonable bounds for year (e.g., 1900-2100)
    const clampedYear = Math.max(1900, Math.min(2100, year));
    updated.setFullYear(clampedYear);
    setTempDate(updated);
    const newDate = new Date(date);
    newDate.setFullYear(clampedYear);
    setDate(newDate);
    setYearInputValue(clampedYear.toString());
  };

  const commitYearInput = (value: string) => {
    const year = parseInt(value, 10);
    if (!isNaN(year) && value.length === 4 && year >= 1900 && year <= 2100) {
      handleYearChange(year);
    } else {
      // Reset to current year if invalid
      setYearInputValue(tempDate.getFullYear().toString());
    }
  };

  const incrementYear = () => {
    handleYearChange(tempDate.getFullYear() + 1);
  };

  const decrementYear = () => {
    handleYearChange(tempDate.getFullYear() - 1);
  };

  const incrementHour = () => {
    handleHourChange(tempDate.getHours() + 1);
  };

  const decrementHour = () => {
    handleHourChange(tempDate.getHours() - 1);
  };

  const incrementMinute = () => {
    handleMinuteChange(tempDate.getMinutes() + 5);
  };

  const decrementMinute = () => {
    handleMinuteChange(tempDate.getMinutes() - 5);
  };

  const setToNow = () => {
    const now = new Date();
    const newDate = new Date(date);
    newDate.setHours(now.getHours());
    newDate.setMinutes(now.getMinutes());
    setTempDate(newDate);
    handleTimeChange(newDate.getHours(), newDate.getMinutes());
  };

  const setTimeFromString = (timeString: string) => {
    const [hoursStr, minutesStr] = timeString.split(":");
    const hours = hoursStr ? parseInt(hoursStr, 10) : 0;
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;

    if (isNaN(hours) || isNaN(minutes)) return;

    // Check if this time would be disabled
    if (minValue && isSameDay(date, minValue)) {
      const minHour = minValue.getHours();
      const minMinute = minValue.getMinutes();

      if (hours < minHour || (hours === minHour && minutes < minMinute)) {
        return;
      }
    }

    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setTempDate(newDate);
    handleTimeChange(hours, minutes);
  };

  const setToToday = () => {
    const today = new Date();
    const newDate = new Date(date);
    newDate.setFullYear(today.getFullYear());
    newDate.setMonth(today.getMonth());
    newDate.setDate(today.getDate());
    setDate(newDate);
    switchToTimeMode();
  };

  const currentTime = format(date, "HH:mm");
  const currentYear = new Date().getFullYear();
  const isCurrentYear = date.getFullYear() === currentYear;
  const dateFormat = isCurrentYear ? "MMMM d" : "MMMM d, yyyy";
  const currentDate = format(date, dateFormat);

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        className={cn(
          "border-black",
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground",
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? `${format(date, dateFormat)} ${format(date, "p")}` : <span>Pick a date</span>}
      </Button>
      <Popover className="w-auto p-0">
        <div className="p-3 relative" style={{ minWidth: "350px", minHeight: "400px" }}>
          <DateView
            date={date}
            minValue={minValue}
            handleCalendarChange={handleCalendarChange}
            switchToTimeMode={switchToTimeMode}
            switchToYearMode={switchToYearMode}
            setToToday={setToToday}
            currentTime={currentTime}
            currentDate={currentDate}
            view={view}
          />
          <TimeView
            date={date}
            tempDate={tempDate}
            minValue={minValue}
            focusedInput={focusedInput}
            hoursRef={hoursRef}
            minutesRef={minutesRef}
            handleHourChange={handleHourChange}
            handleMinuteChange={handleMinuteChange}
            incrementHour={incrementHour}
            decrementHour={decrementHour}
            incrementMinute={incrementMinute}
            decrementMinute={decrementMinute}
            setFocusedInput={setFocusedInput}
            setToNow={setToNow}
            setTimeFromString={setTimeFromString}
            preferredTimes={preferredTimes}
            setOpen={setOpen}
            switchToDateMode={switchToDateMode}
            currentDate={currentDate}
            view={view}
          />
          <YearView
            tempDate={tempDate}
            yearInputValue={yearInputValue}
            setYearInputValue={setYearInputValue}
            handleYearChange={handleYearChange}
            commitYearInput={commitYearInput}
            incrementYear={incrementYear}
            decrementYear={decrementYear}
            switchToDateMode={switchToDateMode}
            currentDate={currentDate}
            yearRef={yearRef}
            view={view}
          />
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
