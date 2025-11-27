import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { I18nProvider } from 'react-aria';
import {
  DateRangePicker as AriaDateRangePicker,
  Button,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  RangeCalendar,
  type DateRangePickerProps as AriaDateRangePickerProps,
  type DateValue,
} from 'react-aria-components';
import { cn } from '~/lib/cn';

export type DateRangePickerProps<T extends DateValue> = AriaDateRangePickerProps<T> & {
  label?: string;
  className?: string;
  error?: string;
  locale?: string;
};

export const DateRangePicker = <T extends DateValue>({
  label,
  className,
  error,
  locale = 'de-DE',
  ...props
}: DateRangePickerProps<T>) => (
  <I18nProvider locale={locale}>
    <AriaDateRangePicker {...props} className={cn('form-control', className)}>
      {label && (
        <Label className="label">
          <span className="label-text">{label}</span>
        </Label>
      )}
      <Group className="flex gap-2">
        <div className="input border border-base-content flex gap-0 items-center flex-1 px-3">
          <DateInput slot="start" className="flex gap-0">
            {(segment) => (
              <DateSegment
                segment={segment}
                className={cn(
                  'rounded text-sm tabular-nums outline-none',
                  'focus:bg-primary focus:text-primary-content',
                  'data-[placeholder]:text-base-content/50'
                )}
              />
            )}
          </DateInput>
          <span className="mx-2">–</span>
          <DateInput slot="end" className="flex gap-0">
            {(segment) => (
              <DateSegment
                segment={segment}
                className={cn(
                  'rounded text-sm tabular-nums outline-none',
                  'focus:bg-primary focus:text-primary-content',
                  'data-[placeholder]:text-base-content/50'
                )}
              />
            )}
          </DateInput>
        </div>
        <Button className="btn btn-ghost btn-square">
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </Group>
      <Popover
        className={cn(
          'z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg',
          'entering:animate-in entering:fade-in entering:zoom-in-95',
          'exiting:animate-out exiting:fade-out exiting:zoom-out-95'
        )}
        offset={8}
      >
        <Dialog className="outline-none">
          <RangeCalendar className="p-3">
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
                      'data-[selected]:bg-primary/20',
                      'data-[selection-start]:bg-primary data-[selection-start]:text-primary-content data-[selection-start]:rounded-lg',
                      'data-[selection-end]:bg-primary data-[selection-end]:text-primary-content data-[selection-end]:rounded-lg',
                      'data-[outside-month]:text-base-content/30',
                      'data-[disabled]:text-base-content/30 data-[disabled]:cursor-not-allowed',
                      'data-[unavailable]:text-error data-[unavailable]:line-through'
                    )}
                  />
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </RangeCalendar>
        </Dialog>
      </Popover>
      {error && (
        <div className="label">
          <span className="label-text-alt text-error">{error}</span>
        </div>
      )}
    </AriaDateRangePicker>
  </I18nProvider>
);

DateRangePicker.displayName = 'DateRangePicker';

