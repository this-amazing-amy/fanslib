import { useRef } from 'react';
import type { AriaSwitchProps } from 'react-aria';
import { useSwitch } from 'react-aria';
import { useToggleState } from 'react-stately';

export type SwitchProps = AriaSwitchProps & {
  className?: string;
};

export const Switch = ({ className, ...props }: SwitchProps) => {
  const ref = useRef<HTMLInputElement>(null);
  const state = useToggleState(props);
  const { inputProps } = useSwitch(props, state, ref);

  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input {...inputProps} ref={ref} type="checkbox" className="toggle toggle-primary" checked={state.isSelected} />
      {props.children && <span className="label-text">{props.children}</span>}
    </label>
  );
};

