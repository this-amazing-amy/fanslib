import { createCalendar, getWeeksInMonth } from '@internationalized/date';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRef } from 'react';
import type { AriaDateRangePickerProps, DateValue } from 'react-aria';
import { useCalendarCell, useCalendarGrid, useDateRangePicker, useDateSegment, useLocale, useRangeCalendar } from 'react-aria';
import type { DateFieldState, DateSegment, RangeCalendarState } from 'react-stately';
import { useDateRangePickerState, useRangeCalendarState } from 'react-stately';
import { cn } from '~/lib/utils';
import { Button } from '../Button';

export type DateRangePickerProps<T extends DateValue> = AriaDateRangePickerProps<T> & {
  label?: string;
  className?: string;
  error?: string;
};

export const DateRangePicker = <T extends DateValue>(props: DateRangePickerProps<T>) => {
  const state = useDateRangePickerState(props);
  const ref = useRef<HTMLDivElement>(null);
  const {
    groupProps,
    labelProps,
    startFieldProps,
    endFieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDateRangePicker(props, state, ref);

  return (
    <div className={cn('form-control', props.className)}>
      {props.label && (
        <label {...labelProps} className="label">
          <span className="label-text">{props.label}</span>
        </label>
      )}
      <div className="relative">
        <div {...groupProps} ref={ref} className="flex gap-2">
          <div className="input input-bordered flex items-center flex-1 px-3">
            <DateField {...startFieldProps} fieldState={state.startFieldState} />
            <span className="mx-2">–</span>
            <DateField {...endFieldProps} fieldState={state.endFieldState} />
          </div>
          <Button
            {...buttonProps}
            variant="ghost"
            className="btn-square"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>
        {state.isOpen && (
          <div
            {...dialogProps}
            className="absolute z-50 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-lg"
          >
            <RangeCalendar {...calendarProps} />
          </div>
        )}
      </div>
      {props.error && (
        <label className="label">
          <span className="label-text-alt text-error">{props.error}</span>
        </label>
      )}
    </div>
  );
};

type DateFieldProps = {
  fieldState: DateFieldState;
};

const DateField = ({ fieldState, ...props }: DateFieldProps & React.HTMLAttributes<HTMLDivElement>) => {
  const ref = useRef<HTMLDivElement>(null);
  
  const domProps = Object.fromEntries(
    Object.entries(props as any).filter(([key]) => 
      !key.startsWith('__') && 
      ![
        'placeholderValue', 
        'hideTimeZone', 
        'hourCycle', 
        'shouldForceLeadingZeros', 
        'isDisabled', 
        'isReadOnly', 
        'isRequired', 
        'validationBehavior'
      ].includes(key)
    )
  );

  if (!fieldState?.segments) {
    return <div {...domProps} ref={ref} className="flex gap-1" />;
  }

  return (
    <div {...domProps} ref={ref} className="flex gap-1">
      {fieldState.segments.map((segment, i) => (
        <DateSegmentComponent key={i} segment={segment} state={fieldState} />
      ))}
    </div>
  );
};

type DateSegmentProps = {
  segment: DateSegment;
  state: DateFieldState;
};

const DateSegmentComponent = ({ segment, state }: DateSegmentProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { segmentProps } = useDateSegment(segment, state, ref);

  return (
    <div
      {...segmentProps}
      ref={ref}
      className={cn(
        'px-0.5 rounded text-sm tabular-nums outline-none focus:bg-primary focus:text-primary-content',
        segment.isPlaceholder && 'text-base-content/50'
      )}
    >
      {segment.text}
    </div>
  );
};

type RangeCalendarProps = {
  className?: string;
};

const RangeCalendar = <T extends DateValue>(props: RangeCalendarProps) => {
  const { locale } = useLocale();
  const state = useRangeCalendarState({
    ...props,
    locale,
    createCalendar,
  });

  const ref = useRef<HTMLDivElement>(null);
  const { calendarProps, prevButtonProps, nextButtonProps, title } = useRangeCalendar(
    props,
    state,
    ref
  );

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
      <RangeCalendarGrid state={state} />
    </div>
  );
};

type RangeCalendarGridProps = {
  state: RangeCalendarState;
};

const RangeCalendarGrid = ({ state }: RangeCalendarGridProps) => {
  const { locale } = useLocale();
  const { gridProps, headerProps, weekDays } = useCalendarGrid({}, state);

  const weeksInMonth = getWeeksInMonth(state.visibleRange.start, locale);

  return (
    <table {...gridProps} className="w-full border-collapse">
      <thead {...headerProps}>
        <tr>
          {weekDays.map((day, index) => (
            <th key={index} className="text-xs font-normal text-base-content/50 p-1">
              {day}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...new Array(weeksInMonth).keys()].map((weekIndex) => (
          <tr key={weekIndex}>
            {state.getDatesInWeek(weekIndex).map((date, i) =>
              date ? (
                <RangeCalendarCell key={i} state={state} date={date} />
              ) : (
                <td key={i} />
              )
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

type RangeCalendarCellProps = {
  state: RangeCalendarState;
  date: DateValue;
};

const RangeCalendarCell = ({ state, date }: RangeCalendarCellProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const {
    cellProps,
    buttonProps,
    isSelected,
    isOutsideVisibleRange,
    isDisabled,
    isUnavailable,
    formattedDate,
  } = useCalendarCell({ date }, state, ref);

  const isSelectionStart = state.highlightedRange ? date.compare(state.highlightedRange.start) === 0 : false;
  const isSelectionEnd = state.highlightedRange ? date.compare(state.highlightedRange.end) === 0 : false;

  return (
    <td {...cellProps} className="p-0 text-center relative">
      <div
        {...buttonProps}
        ref={ref}
        className={cn(
          'h-9 w-9 p-0 font-normal cursor-pointer flex items-center justify-center text-sm',
          'hover:bg-base-200',
          isSelected && !isSelectionStart && !isSelectionEnd && 'bg-primary/20',
          (isSelectionStart || isSelectionEnd) && 'bg-primary text-primary-content rounded-lg',
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

DateRangePicker.displayName = 'DateRangePicker';

