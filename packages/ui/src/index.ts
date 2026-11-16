import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export const THEME_COLORS = {
  background: '#0B0F19',
  surface: '#111827',
  surfaceElevated: '#1F2937',
  border: '#374151',
  primary: '#3B82F6', // Electric Blue
  primaryHover: '#2563EB',
  accent: '#60A5FA',
  textMain: '#F9FAFB',
  textMuted: '#9CA3AF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

