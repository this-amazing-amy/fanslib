import { Check } from 'lucide-react';
import { useRef } from 'react';
import type { AriaCheckboxProps } from 'react-aria';
import { useCheckbox } from 'react-aria';
import { useToggleState } from 'react-stately';
import { cn } from '~/lib/utils';

export type CheckboxProps = AriaCheckboxProps & {
  className?: string;
};

export const Checkbox = ({ className, ...props }: CheckboxProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const state = useToggleState(props);
  const { inputProps } = useCheckbox(props, state, ref);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input {...inputProps} ref={ref} className="hidden" />
      <div
        className={cn(
          'checkbox flex items-center justify-center',
          state.isSelected && 'checkbox-primary',
          className
        )}
      >
        {state.isSelected && <Check className="w-4 h-4" />}
      </div>
      {props.children && <span className="label-text">{props.children}</span>}
    </label>
  );
};

