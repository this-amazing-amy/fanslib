import { CalendarDate } from "@internationalized/date";
import { addHours, format, startOfHour } from "date-fns";
import { CalendarIcon, ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { I18nProvider } from "react-aria";
import { Button } from "~/components/ui/Button";
import { Calendar } from "~/components/ui/Calendar";
import { Popover, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";

type DateTimePickerProps = {
  date: Date;
  setDate: (date: Date) => void;
};

type ClockView = "hours" | "minutes";

export const DateTimePicker = ({ date, setDate }: DateTimePickerProps) => {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"date" | "time">("date");
  const [clockView, setClockView] = useState<ClockView>("hours");
  const [tempDate, setTempDate] = useState<Date>(date);

  useEffect(() => {
    setTempDate(date);
  }, [date]);

  useEffect(() => {
    if (!open) {
      setView("date");
      setClockView("hours");
    }
  }, [open]);

  const handleCalendarChange = (newDate: CalendarDate | null) => {
    if (!newDate) return;
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDate.year);
    updatedDate.setMonth(newDate.month - 1);
    updatedDate.setDate(newDate.day);
    setDate(updatedDate);
  };

  const switchToTimeMode = () => {
    if (!document.startViewTransition) {
      setView("time");
      setTempDate(date);
      setClockView("hours");
      return;
    }

    document.startViewTransition(() => {
      setView("time");
      setTempDate(date);
      setClockView("hours");
    });
  };

  const switchToDateMode = () => {
    if (!document.startViewTransition) {
      setView("date");
      return;
    }

    document.startViewTransition(() => {
      setView("date");
    });
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setDate(newDate);
  };

  const selectHour = (hour: number) => {
    const updated = new Date(tempDate);
    updated.setHours(hour);
    setTempDate(updated);
    setClockView("minutes");
  };

  const selectMinute = (minute: number) => {
    const updated = new Date(tempDate);
    updated.setMinutes(minute);
    setTempDate(updated);
    handleTimeChange(updated.getHours(), updated.getMinutes());
  };

  const setToNow = () => {
    const now = new Date();
    const newDate = new Date(date);
    newDate.setHours(now.getHours());
    newDate.setMinutes(now.getMinutes());
    setTempDate(newDate);
    handleTimeChange(newDate.getHours(), newDate.getMinutes());
  };

  const setToNextHour = () => {
    const now = new Date();
    const nextHour = addHours(startOfHour(now), 1);
    const newDate = new Date(date);
    newDate.setHours(nextHour.getHours());
    newDate.setMinutes(nextHour.getMinutes());
    setTempDate(newDate);
    handleTimeChange(newDate.getHours(), newDate.getMinutes());
  };


  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = Array.from({ length: 60 }, (_, index) => index);
  const currentTime = format(date, "HH:mm");
  const currentDate = format(date, "PPP");

  return (
    <PopoverTrigger isOpen={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        className={cn(
          "border-black/20",
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
              "space-y-4 transition-all duration-300 ease-in-out absolute inset-0 p-3",
              view === "date" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            style={{ viewTransitionName: "date-content" }}
          >
            <div style={{ viewTransitionName: "calendar" }}>
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
            <div className="border-t border-border pt-3">
              <Button
                variant="ghost"
                onPress={switchToTimeMode}
                className="w-full justify-start text-left font-normal transition-opacity hover:opacity-80"
              >
                <span style={{ viewTransitionName: "time-display" }}>{currentTime}</span>
              </Button>
            </div>
          </div>
          <div 
            className={cn(
              "space-y-4 transition-all duration-300 ease-in-out absolute inset-0 p-3",
              view === "time" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
            style={{ viewTransitionName: "time-content" }}
          >
            <Button
              variant="ghost"
              onPress={switchToDateMode}
              className="w-full justify-start text-left font-normal text-sm transition-opacity hover:opacity-80"
              style={{ viewTransitionName: "date-button" }}
            >
              {currentDate}
            </Button>
            <div className="border-t border-border pt-3">
              <div className="space-y-4">
                <div className="text-5xl font-bold text-muted-foreground/50 text-center">
                  <span style={{ viewTransitionName: "time-display" }} className="inline-block">
                    <button
                      onClick={() => setClockView("hours")}
                      className="hover:bg-muted hover:text-foreground rounded-sm p-1 transition-all cursor-pointer"
                    >
                      {format(tempDate, "HH")}
                    </button>
                    <span>:</span>
                    <button
                      onClick={() => setClockView("minutes")}
                      className="hover:bg-muted hover:text-foreground rounded-sm p-1 transition-all cursor-pointer"
                    >
                      {format(tempDate, "mm")}
                    </button>
                  </span>
                </div>

                <div className="flex items-center justify-center">
                  <div className={cn("flex flex-col items-center w-full transition-all duration-300", clockView === "hours" && "pb-8")}>
                    {clockView === "hours" && (
                      <div className="grid grid-cols-6 gap-2 w-full transition-opacity duration-300">
                        {hours.map((hour) => (
                          <Button
                            key={hour}
                            size="sm"
                            variant={tempDate.getHours() === hour ? "primary" : "ghost"}
                            onPress={() => selectHour(hour)}
                          >
                            {hour.toString().padStart(2, "0")}
                          </Button>
                        ))}
                      </div>
                    )}
                    {clockView === "minutes" && (
                      <>
                        <div className="grid grid-cols-10 gap-2 w-full max-w-md transition-opacity duration-300">
                          {minutes.map((minute) => (
                            <Button
                              key={minute}
                              size="sm"
                              variant={tempDate.getMinutes() === minute ? "primary" : "ghost"}
                              onPress={() => selectMinute(minute)}
                            >
                              {minute.toString().padStart(2, "0")}
                            </Button>
                          ))}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => setClockView("hours")}
                          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground mt-3 transition-opacity"
                        >
                          <ChevronLeft className="mr-1 h-3 w-3" />
                          Hours
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3 w-full transition-opacity duration-300">
                    <div className="flex flex-wrap gap-2 justify-end">
                      <Button size="sm" variant="ghost" onPress={setToNow}>
                        Now
                      </Button>
                      <Button size="sm" variant="ghost" onPress={setToNextHour}>
                        Next hour
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Popover>
    </PopoverTrigger>
  );
};
