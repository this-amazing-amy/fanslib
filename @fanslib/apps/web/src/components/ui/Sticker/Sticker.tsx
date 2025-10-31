import { type ReactNode } from 'react';

type StickerProps = {
  children: ReactNode;
  className?: string;
};

export const Sticker = ({ children, className = '' }: StickerProps) => (
  <div
    className={`rounded bg-background flex items-center justify-center min-w-5 h-5 p-1 text-foreground border ${className}`}
  >
    {children}
  </div>
);


