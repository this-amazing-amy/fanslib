import { addHours, format, startOfHour } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useOverlayTriggerState } from "react-stately";
import { Button } from "~/components/ui/Button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "~/components/ui/Dialog";
import { cn } from "~/lib/cn";

type TimePickerProps = {
  date: Date;
  setDate: (hours: number, minutes: number) => void;
  className?: string;
  preferredTimes?: string[];
};

type ClockView = "hours" | "minutes";

export const TimePicker = ({ date, setDate, className, preferredTimes = [] }: TimePickerProps) => {
  const dialogState = useOverlayTriggerState({});
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [view, setView] = useState<ClockView>("hours");

  const openModal = () => {
    setTempDate(date);
    setView("hours");
    dialogState.open();
  };

  const closeModal = () => {
    dialogState.close();
    setTempDate(null);
    setView("hours");
  };

  const confirmTime = () => {
    if (!tempDate) return;
    setDate(tempDate.getHours(), tempDate.getMinutes());
    closeModal();
  };

  const setTimeFromString = (timeString: string) => {
    const [hours, minutes] = timeString.split(":").map(Number);
    if (hours === undefined || minutes === undefined) return;
    const newDate = new Date(date);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    setTempDate(newDate);
    setView("hours");
  };

  const setToNow = () => {
    const now = new Date();
    const newDate = new Date(date);
    newDate.setHours(now.getHours());
    newDate.setMinutes(now.getMinutes());
    setTempDate(newDate);
  };

  const setToNextHour = () => {
    const now = new Date();
    const nextHour = addHours(startOfHour(now), 1);
    const newDate = new Date(date);
    newDate.setHours(nextHour.getHours());
    newDate.setMinutes(nextHour.getMinutes());
    setTempDate(newDate);
  };

  const currentTime = format(date, "HH:mm");

  const hours = Array.from({ length: 24 }, (_, index) => index);
  const minutes = Array.from({ length: 60 }, (_, index) => index);

  const selectHour = (hour: number) => {
    const base = tempDate ?? new Date(date);
    const updated = new Date(base);
    updated.setHours(hour);
    setTempDate(updated);
    setView("minutes");
  };

  const selectMinute = (minute: number) => {
    const base = tempDate ?? new Date(date);
    const updated = new Date(base);
    updated.setMinutes(minute);
    setTempDate(updated);
  };

  return (
    <div className={cn(className)}>
      <Button variant="ghost" onPress={openModal} className="w-full">
        {currentTime}
      </Button>

      <Dialog open={dialogState.isOpen} onOpenChange={(open) => (open ? dialogState.open() : dialogState.close())}>
        <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Time</DialogTitle>
        </DialogHeader>

          <span className="text-5xl font-bold text-muted-foreground/50 text-center">
            <button
              onClick={() => setView("hours")}
              className="hover:bg-muted hover:text-foreground rounded-sm p-1 transition-all cursor-pointer"
            >
              {tempDate ? format(tempDate, "HH") : "--"}
            </button>
            :
            <button
              onClick={() => setView("minutes")}
              className="hover:bg-muted hover:text-foreground rounded-sm p-1 transition-all cursor-pointer"
            >
              {tempDate ? format(tempDate, "mm") : "--"}
            </button>
          </span>

          <div className="flex items-center justify-center">
            <div className={cn("flex flex-col items-center", view === "hours" && "pb-8 w-full max-w-md")}> 
              {view === "hours" && (
                <div className="grid grid-cols-6 gap-2 w-full">
                  {hours.map((hour) => (
                    <Button
                      key={hour}
                      size="sm"
                      variant={tempDate?.getHours() === hour ? "primary" : "ghost"}
                      onPress={() => selectHour(hour)}
                    >
                      {hour.toString().padStart(2, "0")}
                    </Button>
                  ))}
                </div>
              )}
              {view === "minutes" && (
                <>
                  <div className="grid grid-cols-10 gap-2 w-full max-w-md">
                    {minutes.map((minute) => (
                      <Button
                        key={minute}
                        size="sm"
                        variant={tempDate?.getMinutes() === minute ? "primary" : "ghost"}
                        onPress={() => selectMinute(minute)}
                      >
                        {minute.toString().padStart(2, "0")}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setView("hours")}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground mt-3"
                  >
                    <ChevronLeft className="mr-1 h-3 w-3" />
                    Hours
                  </Button>
                </>
              )}
            </div>
            {preferredTimes.length > 0 && (
              <div className="flex flex-col items-end gap-3 w-full">
                <span className="text-sm text-muted-foreground text-right">Quick select</span>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="ghost" onPress={setToNow}>
                    Now
                  </Button>
                  <Button size="sm" variant="ghost" onPress={setToNextHour}>
                    Next hour
                  </Button>
                  <div className="w-full border-t my-2" />
                  {preferredTimes.map((time) => (
                    <Button
                      key={time}
                      size="sm"
                      variant={time === currentTime ? "primary" : "ghost"}
                      onPress={() => setTimeFromString(time)}
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

        <DialogFooter>
          <Button onPress={confirmTime} isDisabled={!tempDate}>
            Confirm
          </Button>
        </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
