import { useRef } from 'react';
import type { AriaTextFieldProps } from 'react-aria';
import { useTextField } from 'react-aria';
import { cn } from '~/lib/cn';

export type TextareaProps = AriaTextFieldProps & {
  className?: string;
  rows?: number;
};

export const Textarea = ({ className, rows = 3, ...props }: TextareaProps) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const textFieldProps = { ...(props as Record<string, unknown>), inputElementType: 'textarea' } as unknown as AriaTextFieldProps;
  const { inputProps } = useTextField(textFieldProps, ref as unknown as React.RefObject<HTMLInputElement>);

  return (
    <textarea
      {...(inputProps as unknown as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
      ref={ref}
      rows={rows}
      className={cn('textarea border w-full rounded-lg focus:outline-none', className)}
    />
  );
};

