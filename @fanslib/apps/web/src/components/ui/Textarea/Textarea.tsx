import { useRef } from 'react';
import type { AriaTextFieldProps } from 'react-aria';
import { useTextField } from 'react-aria';
import { cn } from '~/lib/utils';

export type TextareaProps = AriaTextFieldProps & {
  className?: string;
  rows?: number;
};

export const Textarea = ({ className, rows = 3, ...props }: TextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const { inputProps } = useTextField(
    { ...props, inputElementType: 'textarea' },
    ref
  );

  return (
    <textarea
      {...inputProps}
      ref={ref}
      rows={rows}
      className={cn('textarea textarea-bordered w-full rounded-lg focus:outline-none', className)}
    />
  );
};

