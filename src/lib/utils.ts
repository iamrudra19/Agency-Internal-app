import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, endOfMonth } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Indian Rupees, lakh-style grouping. e.g. 150000 -> ₹1,50,000 */
export function formatINR(amount: number, compact = false): string {
  if (compact && Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)}L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function daysRemainingInMonth(date = new Date()): number {
  return Math.max(1, differenceInDays(endOfMonth(date), date) + 1);
}

export function daysSince(dateStr: string): number {
  return differenceInDays(new Date(), new Date(dateStr));
}

export function titleCase(s: string): string {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
