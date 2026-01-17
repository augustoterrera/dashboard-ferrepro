import { ChatMsg, Part } from '@/types/chat';
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)


export function isNearBottom(el: HTMLElement, threshold = 120) {
  const diff = el.scrollHeight - el.scrollTop - el.clientHeight;
  return diff < threshold;
}
