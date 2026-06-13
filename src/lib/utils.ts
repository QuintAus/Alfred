import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — merge Tailwind class names intelligently.
 * Combines clsx (conditional classes) with tailwind-merge (dedupe conflicts).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a Date as HH:MM:SS in 24h time, zero-padded. */
export function formatClock(date: Date): { hms: string; ampm: string } {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const s = date.getSeconds().toString().padStart(2, "0");
  const hh = h.toString().padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  return { hms: `${hh}:${m}:${s}`, ampm };
}

/** Format a Date as a long, HUD-style date line, e.g. "THURSDAY · 13 JUN 2026". */
export function formatDateLine(date: Date): string {
  const day = date
    .toLocaleDateString("en-GB", { weekday: "long" })
    .toUpperCase();
  const d = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleDateString("en-GB", { month: "short" })
    .toUpperCase();
  const year = date.getFullYear();
  return `${day} · ${d} ${month} ${year}`;
}

/** Convert a 24h time string ("09:30") into a friendly label ("9:30 AM"). */
export function prettyTime(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${ampm}`;
}

/** Clamp a number to a range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
