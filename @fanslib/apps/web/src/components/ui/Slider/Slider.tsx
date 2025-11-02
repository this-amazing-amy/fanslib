import { useRef } from 'react';
import type { AriaSliderProps } from 'react-aria';
import { mergeProps, useFocusRing, useNumberFormatter, useSlider, useSliderThumb, VisuallyHidden } from 'react-aria';
import type { SliderState } from 'react-stately';
import { useSliderState } from 'react-stately';
import { cn } from '~/lib/cn';

export type SliderProps = AriaSliderProps<number | number[]> & {
  label?: string;
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
};

export const Slider = (props: SliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const numberFormatter = useNumberFormatter(props.formatOptions ?? { useGrouping: false });
  const state = useSliderState({
    ...props,
    numberFormatter,
  });
  const { groupProps, trackProps, labelProps, outputProps } = useSlider(
    props,
    state,
    trackRef
  );

  const colorClasses = {
    primary: 'range-primary',
    secondary: 'range-secondary',
    accent: 'range-accent',
    success: 'range-success',
    warning: 'range-warning',
    error: 'range-error',
    info: 'range-info',
  };

  return (
    <div {...groupProps} className={cn('form-control', props.className)}>
      {props.label && (
        <div className="flex justify-between items-center mb-2">
          <label {...labelProps} className="label-text">
            {props.label}
          </label>
          <output {...outputProps} className="label-text-alt">
            {state.values.map((v, i) => {
              try {
                return state.getThumbValueLabel(i);
              } catch {
                return String(v);
              }
            }).join(' – ')}
          </output>
        </div>
      )}
      <div
        {...trackProps}
        ref={trackRef}
        className="relative w-full h-2 rounded-full bg-base-300"
      >
        <div
          className={cn(
            'absolute h-full rounded-full',
            colorClasses[props.color ?? 'primary']
          )}
          style={{
            left: `${state.getThumbPercent(0) * 100}%`,
            width: state.values.length > 1
              ? `${(state.getThumbPercent(1) - state.getThumbPercent(0)) * 100}%`
              : `${state.getThumbPercent(0) * 100}%`,
          }}
        />
        {state.values.map((_, i) => (
          <Thumb key={i} index={i} state={state} trackRef={trackRef} color={props.color} />
        ))}
      </div>
    </div>
  );
};

type ThumbProps = {
  index: number;
  state: SliderState;
  trackRef: React.RefObject<HTMLDivElement>;
  color?: SliderProps['color'];
};

const Thumb = ({ index, state, trackRef, color = 'primary' }: ThumbProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { thumbProps, inputProps } = useSliderThumb(
    {
      index,
      trackRef,
      inputRef,
    },
    state
  );

  const { focusProps, isFocusVisible } = useFocusRing();

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    info: 'bg-info',
  };

  return (
    <div
      {...thumbProps}
      className="absolute top-1/2 -translate-y-1/2"
      style={{
        left: `${state.getThumbPercent(index) * 100}%`,
      }}
    >
      <div
        className={cn(
          'w-5 h-5 rounded-full shadow cursor-pointer transition-all',
          colorClasses[color],
          isFocusVisible && 'ring-2 ring-offset-2 ring-primary'
        )}
      >
        <VisuallyHidden>
          <input ref={inputRef} {...mergeProps(inputProps, focusProps)} />
        </VisuallyHidden>
      </div>
    </div>
  );
};

Slider.displayName = 'Slider';

