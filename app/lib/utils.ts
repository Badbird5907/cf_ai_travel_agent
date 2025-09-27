import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix: string, length: number = 12) {
  return `${prefix}_${crypto.randomUUID().slice(0, length)}`;
}