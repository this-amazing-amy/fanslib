import type { LabelHTMLAttributes } from 'react';
import { cn } from '~/lib/cn';

export type LabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

export const Label = ({ className, required, children, ...props }: LabelProps) => (
  <label className={cn('label text-xs mb-1', className)} {...props}>
    <span className="label-text">
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </span>
  </label>
);

