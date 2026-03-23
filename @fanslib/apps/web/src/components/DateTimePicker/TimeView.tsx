import { format } from "date-fns";
import { ChevronDown, ChevronUp, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import type { RefObject } from "react";
import { Button } from "~/components/ui/Button";
import { cn } from "~/lib/cn";
import { isHourDisabled, isMinuteDisabled, isTimeStringDisabled } from "./date-time-helpers";

type TimeViewProps = {
  date: Date;
  tempDate: Date;
  minValue?: Date;
  focusedInput: "hours" | "minutes" | null;
  hoursRef: RefObject<HTMLInputElement | null>;
  minutesRef: RefObject<HTMLInputElement | null>;
  handleHourChange: (hour: number) => void;
  handleMinuteChange: (minute: number) => void;
  incrementHour: () => void;
  decrementHour: () => void;
  incrementMinute: () => void;
  decrementMinute: () => void;
  setFocusedInput: (input: "hours" | "minutes" | null) => void;
  setToNow: () => void;
  setTimeFromString: (timeString: string) => void;
  preferredTimes: string[];
  setOpen: (open: boolean) => void;
  switchToDateMode: () => void;
  currentDate: string;
  view: "date" | "time" | "year";
};

const commonMinutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

export const TimeView = ({
  date,
  tempDate,
  minValue,
  focusedInput,
  hoursRef,
  minutesRef,
  handleHourChange,
  handleMinuteChange,
  incrementHour,
  decrementHour,
  incrementMinute,
  decrementMinute,
  setFocusedInput,
  setToNow,
  setTimeFromString,
  preferredTimes,
  setOpen,
  switchToDateMode,
  currentDate,
  view,
}: TimeViewProps) => (
    <div
      className={cn(
        "flex flex-col absolute inset-0 p-3",
        view === "time" ? "pointer-events-auto" : "pointer-events-none",
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
              ].map((period) => {
                const Icon = period.icon;
                const periodKey = `${period.hours[0]}-${period.hours[period.hours.length - 1]}`;
                return (
                  <div key={periodKey} className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground opacity-40 flex-shrink-0" />
                    <div className="flex gap-1 flex-wrap">
                      {period.hours.map((hour) => (
                        <Button
                          key={hour}
                          size="sm"
                          variant={tempDate.getHours() === hour ? "primary" : "ghost"}
                          onPress={() => handleHourChange(hour)}
                          isDisabled={isHourDisabled(hour, date, minValue)}
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
                  isDisabled={isMinuteDisabled(minute, tempDate, date, minValue)}
                  className="text-xs h-7 px-2 w-[2.5rem]"
                >
                  {minute.toString().padStart(2, "0")}
                </Button>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex justify-center gap-2 pt-2 mt-auto flex-wrap">
            <Button size="sm" variant="ghost" onPress={setToNow}>
              Now
            </Button>
            {preferredTimes.map((time) => (
              <Button
                key={time}
                size="sm"
                variant={format(tempDate, "HH:mm") === time ? "primary" : "ghost"}
                onPress={() => setTimeFromString(time)}
                isDisabled={isTimeStringDisabled(time, date, minValue)}
              >
                {time}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
);
