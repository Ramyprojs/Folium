import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  wait = 400,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), wait);
  };
}
