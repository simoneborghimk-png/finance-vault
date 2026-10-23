import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Unisce classi CSS gestendo conflitti Tailwind e valori condizionali in modo sicuro.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
