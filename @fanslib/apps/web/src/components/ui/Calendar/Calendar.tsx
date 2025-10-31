import { createCalendar, getWeeksInMonth } from '@internationalized/date';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import type { AriaCalendarProps, DateValue } from 'react-aria';
import { useCalendar, useCalendarCell, useCalendarGrid, useLocale } from 'react-aria';
import type { CalendarState } from 'react-stately';
import { useCalendarState } from 'react-stately';
import { cn } from '~/lib/utils';

export type CalendarProps<T extends DateValue> = AriaCalendarProps<T> & {
  className?: string;
};

export const Calendar = <T extends DateValue>(props: CalendarProps<T>) => {
  const { locale } = useLocale();
  const state = useCalendarState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } = useCalendar(props, state);

  return (
    <div {...calendarProps} ref={ref} className={cn('p-3', props.className)}>
      <div className="flex items-center justify-between pb-2">
        <button
          {...prevButtonProps}
          className="btn btn-ghost btn-sm"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium">{title}</h2>
        <button
          {...nextButtonProps}
          className="btn btn-ghost btn-sm"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <CalendarGrid state={state} />
    </div>
  );
};

type CalendarGridProps = {
  state: CalendarState;
};

const CalendarGrid = ({ state }: CalendarGridProps) => {
  const { locale } = useLocale();
  const { gridProps, headerProps, weekDays } = useCalendarGrid({}, state);

  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <table {...gridProps} className="w-full border-collapse">
      <thead {...headerProps}>
        <tr>
          {weekDays.map((day) => (
            <th key={day} className="text-xs font-normal text-base-content/50 p-1">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeksInMonth).keys()].map((weekIndex) => {
          const datesInWeek = state.getDatesInWeek(weekIndex);
          return (
            <tr key={weekIndex}>
              {datesInWeek.map((date, dayIndex) =>
                date ? (
                  <CalendarCell key={date.toString()} state={state} date={date} />
                ) : (
                  <td key={`empty-${weekIndex}-${dayIndex}`} />
                )
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

type CalendarCellProps = {
  state: CalendarState;
  date: DateValue;
};

const CalendarCell = ({ state, date }: CalendarCellProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    isUnavailable,
    formattedDate,
  } = useCalendarCell({ date: date as DateValue }, state, ref);

  return (
    <td {...cellProps} className="p-0 text-center">
      <div
        {...buttonProps}
        ref={ref}
        className={cn(
          'h-9 w-9 p-0 font-normal rounded-lg cursor-pointer flex items-center justify-center text-sm',
          'hover:bg-base-200',
          isSelected && 'bg-primary text-primary-content hover:bg-primary',
          isOutsideVisibleRange && 'text-base-content/30',
          isDisabled && 'text-base-content/30 cursor-not-allowed',
          isUnavailable && 'text-error line-through'
        )}
      >
        {formattedDate}
      </div>
    </td>
  );
};

Calendar.displayName = 'Calendar';

