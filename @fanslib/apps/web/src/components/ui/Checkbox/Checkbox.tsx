import { Check } from 'lucide-react';
import { useRef } from 'react';
import type { AriaCheckboxProps } from 'react-aria';
import { useCheckbox } from 'react-aria';
import { useToggleState } from 'react-stately';
import { cn } from '~/lib/cn';

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
          'relative inline-flex items-center justify-center',
          'w-5 h-5 rounded-full',
          'border-2 transition-all',
          state.isSelected 
            ? 'border-primary bg-primary' 
            : 'border-base-content/20 bg-base-100',
          !props.isDisabled && 'hover:border-base-content/40',
          props.isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {state.isSelected && (
          <Check 
            className="w-3.5 h-3.5 text-primary-content" 
            strokeWidth={2.5} 
          />
        )}
      </div>
      {props.children && <span className="label-text">{props.children}</span>}
    </label>
  );
};

