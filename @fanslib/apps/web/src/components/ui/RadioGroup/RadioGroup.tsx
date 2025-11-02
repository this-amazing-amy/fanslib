import { createContext, useContext, useRef, type ReactNode } from 'react';
import type { AriaRadioGroupProps, AriaRadioProps } from 'react-aria';
import { useRadio, useRadioGroup } from 'react-aria';
import type { RadioGroupState } from 'react-stately';
import { useRadioGroupState } from 'react-stately';
import { cn } from '~/lib/cn';

type RadioGroupContextValue = {
  state: RadioGroupState;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type RadioGroupProps = AriaRadioGroupProps & {
  className?: string;
  children: ReactNode;
};

export const RadioGroup = ({ className, children, ...props }: RadioGroupProps) => {
  const state = useRadioGroupState(props);
  const { radioGroupProps, labelProps } = useRadioGroup(props, state);

  return (
    <div {...radioGroupProps} className={cn('flex flex-col gap-2', className)}>
      {props.label && <span {...labelProps} className="label-text font-medium">{props.label}</span>}
      <RadioGroupContext.Provider value={{ state }}>
        {children}
      </RadioGroupContext.Provider>
    </div>
  );
};

export type RadioGroupItemProps = AriaRadioProps & {
  className?: string;
  children: ReactNode;
};

export const RadioGroupItem = ({ className, children, ...props }: RadioGroupItemProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const context = useContext(RadioGroupContext);
  
  if (!context) {
    throw new Error('RadioGroupItem must be used within RadioGroup');
  }
  
  const { state } = context;
  const { inputProps } = useRadio(props, state, ref);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input {...inputProps} ref={ref} type="radio" className="radio radio-primary" />
      <span className="label-text">{children}</span>
    </label>
  );
};

