import { CalendarDate } from "@internationalized/date";
import { format } from "date-fns";
import { CalendarIcon, ChevronUp, ChevronDown, Moon, Sunrise, Sun, Sunset } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { I18nProvider } from "react-aria";
import { Button } from "~/components/ui/Button";
import { Calendar } from "~/components/ui/Calendar";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";

type DateTimePickerProps = {
  date: Date;
  setDate: (date: Date) => void;
};

export const DateTimePicker = ({ date, setDate }: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState<Date>(date);
  const [focusedInput, setFocusedInput] = useState<"hours" | "minutes" | null>(null);
  const hoursRef = useRef<HTMLInputElement>(null);
  const minutesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempDate(date);
  }, [date]);

  useEffect(() => {
    if (!open) {
      setView("date");
      setFocusedInput(null);
    }
  }, [open]);

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
    setTempDate(updated);
    handleTimeChange(updated.getHours(), updated.getMinutes());
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



  const hours = Array.from({ length: 24 }, (_, index) => index);
  const commonMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const currentTime = format(date, "HH:mm");
  const currentDate = format(date, "PPP");

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        className={cn(
          "border-black",
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP p") : <span>Pick a date</span>}
      </Button>
      <Popover className="w-auto p-0">
        <div className="p-3 relative" style={{ minWidth: "350px", minHeight: "400px" }}>
          <div 
            className={cn(
              "flex flex-col absolute inset-0 p-3",
              view === "date" ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{ visibility: view === "date" ? "visible" : "hidden" }}
          >
            <div>
              <I18nProvider locale="de-DE">
                <Calendar
                  value={
                    new CalendarDate(
                      date.getFullYear(),
                      date.getMonth() + 1,
                      date.getDate()
                    )
                  }
                  onChange={handleCalendarChange}
                />
              </I18nProvider>
            </div>
            <div className="border-t border-border pt-3 mt-auto">
              <Button
                variant="ghost"
                onPress={switchToTimeMode}
                className="w-full justify-center text-center font-bold transition-opacity hover:opacity-80 text-xl"
              >
                <span>{currentTime}</span>
              </Button>
            </div>
          </div>
          <div 
            className={cn(
              "flex flex-col absolute inset-0 p-3",
              view === "time" ? "pointer-events-auto" : "pointer-events-none"
            )}
            style={{ visibility: view === "time" ? "visible" : "hidden" }}
          >
            <Button
              variant="ghost"
              onPress={switchToDateMode}
              className="w-full justify-start text-left font-normal text-sm transition-opacity hover:opacity-80 mb-4"
            >
              <span className="font-bold">{currentDate}</span>
            </Button>
            <div className="border-t border-border pt-3 flex-1 flex flex-col">
              <div className="flex flex-col flex-1 space-y-4">
                {/* Time Display */}
                <div className="flex items-center justify-center gap-2">
                  {/* Hours Selector */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={incrementHour}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Increment hour"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <input
                      ref={hoursRef}
                      type="number"
                      min="0"
                      max="23"
                      value={tempDate.getHours().toString().padStart(2, "0")}
                      onChange={(e) => {
                        const hour = parseInt(e.target.value, 10);
                        if (!isNaN(hour)) {
                          handleHourChange(hour);
                        }
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        setFocusedInput("hours");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          incrementHour();
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          decrementHour();
                        }
                      }}
                      className="text-4xl font-mono font-bold text-center w-16 bg-transparent border-none outline-none focus:bg-muted/50 rounded px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onWheel={(e) => {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -1 : 1;
                        handleHourChange(tempDate.getHours() + delta);
                      }}
                    />
                    <button
                      type="button"
                      onClick={decrementHour}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Decrement hour"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-4xl font-bold">:</span>

                  {/* Minutes Selector */}
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={incrementMinute}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Increment minute"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <input
                      ref={minutesRef}
                      type="number"
                      min="0"
                      max="59"
                      value={tempDate.getMinutes().toString().padStart(2, "0")}
                      onChange={(e) => {
                        const minute = parseInt(e.target.value, 10);
                        if (!isNaN(minute)) {
                          handleMinuteChange(minute);
                        }
                      }}
                      onFocus={(e) => {
                        e.target.select();
                        setFocusedInput("minutes");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                          e.preventDefault();
                          incrementMinute();
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          decrementMinute();
                        }
                      }}
                      className="text-4xl font-mono font-bold text-center w-16 bg-transparent border-none outline-none focus:bg-muted/50 rounded px-2 py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      onWheel={(e) => {
                        e.preventDefault();
                        const delta = e.deltaY > 0 ? -5 : 5;
                        handleMinuteChange(tempDate.getMinutes() + delta);
                      }}
                    />
                    <button
                      type="button"
                      onClick={decrementMinute}
                      className="p-1 hover:bg-muted rounded transition-colors"
                      aria-label="Decrement minute"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Quick Selection */}
                {focusedInput !== "minutes" ? (
                  <div className="space-y-1.5 flex flex-col items-center">
                    {[
                      { icon: Moon, hours: [0, 1, 2, 3, 4, 5] },
                      { icon: Sunrise, hours: [6, 7, 8, 9, 10, 11] },
                      { icon: Sun, hours: [12, 13, 14, 15, 16, 17] },
                      { icon: Sunset, hours: [18, 19, 20, 21, 22, 23] },
                    ].map((period, index) => {
                      const Icon = period.icon;
                      return (
                        <div key={index} className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4 text-muted-foreground opacity-40 flex-shrink-0" />
                          <div className="flex gap-1 flex-wrap">
                            {period.hours.map((hour) => (
                              <Button
                                key={hour}
                                size="sm"
                                variant={tempDate.getHours() === hour ? "primary" : "ghost"}
                                onPress={() => handleHourChange(hour)}
                                className="text-xs h-7 px-2 w-[2.5rem]"
                              >
                                {hour.toString().padStart(2, "0")}
                              </Button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-6 gap-1 justify-center px-4">
                    {commonMinutes.map((minute) => (
                      <Button
                        key={minute}
                        size="sm"
                        variant={tempDate.getMinutes() === minute ? "primary" : "ghost"}
                        onPress={() => {
                          handleMinuteChange(minute);
                          setOpen(false);
                        }}
                        className="text-xs h-7 px-2 w-[2.5rem]"
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex justify-center gap-2 pt-2 mt-auto">
                  <Button size="sm" variant="ghost" onPress={setToNow}>
                    Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
