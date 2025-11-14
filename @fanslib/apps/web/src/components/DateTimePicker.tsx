import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Calendar } from "~/components/ui/Calendar";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/Popover";
import { cn } from "~/lib/cn";
import { TimePicker } from "./TimePicker";

type DateTimePickerProps = {
  date: Date;
  setDate: (date: Date) => void;
};

export const DateTimePicker = ({ date, setDate }: DateTimePickerProps) => {

  const handleCalendarChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    const updatedDate = new Date(date);
    updatedDate.setFullYear(newDate.getFullYear());
    updatedDate.setMonth(newDate.getMonth());
    updatedDate.setDate(newDate.getDate());
    setDate(updatedDate);
  };

  return (
    <Popover>
      <PopoverTrigger>
      <Button
        variant="secondary"
        className={cn(
          "w-full justify-start text-left font-normal",
          !date && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, "PPP p") : <span>Pick a date</span>}
      </Button>
      </PopoverTrigger>
      <PopoverContent>
          <div className="space-y-4 p-3">
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleCalendarChange}
              autoFocus
            />
            <div className="border-t border-border pt-3">
              <TimePicker
                setDate={(hours: number, minutes: number) => {
                  const newDate = new Date(date);
                  newDate.setHours(hours);
                  newDate.setMinutes(minutes);
                  setDate(newDate);
                }}
                date={date}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
  );
};
