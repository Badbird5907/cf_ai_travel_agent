import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix: string, length: number = 12) {
  return `${prefix}_${crypto.randomUUID().slice(0, length)}`;
}

export const capitalize = (str: string, deep: boolean = false) => {
  if (deep) {
    return str.toLowerCase().split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  }
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}