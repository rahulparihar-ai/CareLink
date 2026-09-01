import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type ToneKey = "primary" | "gold" | "green" | "pink" | "sky" | "danger" | "muted";

const toneMap: Record<ToneKey, string> = {
  primary: "bg-primary/10 text-primary",
  gold: "bg-[var(--gold-soft)] text-[var(--gold-foreground)]",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  danger: "bg-red-500/10 text-red-600 dark:text-red-400",
  muted: "bg-muted text-muted-foreground",
};

export function toneBg(tone?: ToneKey | string): string {
  return toneMap[(tone ?? "primary") as ToneKey] ?? toneMap.primary;
}
