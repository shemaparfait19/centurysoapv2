import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-RW', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

export const formatShortDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-RW', {
    month: 'short',
    day: 'numeric',
  });
};
