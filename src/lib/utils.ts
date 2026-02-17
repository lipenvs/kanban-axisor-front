import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFieldErrors(errors: unknown[]): string[] {
  return errors
    .map((e) =>
      typeof e === 'string' ? e : ((e as { message?: string })?.message ?? ''),
    )
    .filter(Boolean)
}
