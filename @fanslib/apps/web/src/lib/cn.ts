import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: (string | undefined | null | false)[]): string =>
  twMerge(inputs.filter(Boolean).join(' '));