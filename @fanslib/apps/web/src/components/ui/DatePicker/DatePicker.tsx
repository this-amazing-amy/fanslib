import { Calendar as CalendarIcon } from 'lucide-react';
import { useRef } from 'react';
import type { AriaDateFieldProps, AriaDatePickerProps, DateValue } from 'react-aria';
import { useDateField, useDatePicker, useDateSegment, useLocale } from 'react-aria';
import type { DateFieldState, DateSegment } from 'react-stately';
import { useDateFieldState, useDatePickerState } from 'react-stately';
import { createCalendar } from '@internationalized/date';
import { cn } from '~/lib/cn';
import { Button } from '../Button';
import { Calendar } from '../Calendar';

export type DatePickerProps<T extends DateValue> = AriaDatePickerProps<T> & {
  label?: string;
  className?: string;
  error?: string;
};

export const DatePicker = <T extends DateValue>(props: DatePickerProps<T>) => {
  const state = useDatePickerState(props);
  const ref = useRef<HTMLDivElement>(null);
  const {
    groupProps,
    labelProps,
    fieldProps,
    buttonProps,
    dialogProps,
    calendarProps,
  } = useDatePicker(props, state, ref);

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
            <DateField {...fieldProps} />
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
            <Calendar {...calendarProps} />
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

const DateField = <T extends DateValue>(props: AriaDateFieldProps<T>) => {
  const { locale } = useLocale();
  const state = useDateFieldState({
    ...props,
    locale,
    createCalendar,
  });
  const ref = useRef<HTMLDivElement>(null);
  const { fieldProps } = useDateField(props, state, ref);

  return (
    <div {...fieldProps} ref={ref} className="flex gap-1">
      {state.segments.map((segment, i) => (
        <DateSegmentComponent key={i} segment={segment} state={state} />
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

DatePicker.displayName = 'DatePicker';

