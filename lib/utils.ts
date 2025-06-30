import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatError = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unknown error has occured';
