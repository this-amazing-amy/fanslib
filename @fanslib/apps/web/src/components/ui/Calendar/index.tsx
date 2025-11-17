import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Calendar as AriaCalendar,
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  Heading,
  type CalendarProps as AriaCalendarProps,
  type DateValue,
} from 'react-aria-components';
import { cn } from '~/lib/cn';

export type CalendarProps<T extends DateValue> = AriaCalendarProps<T> & {
  className?: string;
};

export const Calendar = <T extends DateValue>({
  className,
  ...props
}: CalendarProps<T>) => (
  <AriaCalendar {...props} className={cn('p-3', className)}>
    <header className="flex items-center justify-between pb-2">
      <Button slot="previous" className="btn btn-ghost btn-sm">
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Heading className="text-sm font-medium" />
      <Button slot="next" className="btn btn-ghost btn-sm">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </header>
    <CalendarGrid className="w-full border-collapse">
      <CalendarGridHeader>
        {(day) => (
          <CalendarHeaderCell className="text-xs font-normal text-base-content/50 p-1">
            {day}
          </CalendarHeaderCell>
        )}
      </CalendarGridHeader>
      <CalendarGridBody>
        {(date) => (
          <CalendarCell
            date={date}
            className={cn(
              'h-9 w-9 p-0 font-normal cursor-pointer flex items-center justify-center text-sm',
              'outline-none',
              'hover:bg-base-200',
              'data-[selected]:bg-primary data-[selected]:text-primary-content data-[selected]:rounded-lg',
              'data-[outside-month]:text-base-content/30',
              'data-[disabled]:text-base-content/30 data-[disabled]:cursor-not-allowed',
              'data-[unavailable]:text-error data-[unavailable]:line-through'
            )}
          />
        )}
      </CalendarGridBody>
    </CalendarGrid>
  </AriaCalendar>
);
