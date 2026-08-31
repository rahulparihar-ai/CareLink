"use client";

import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "muted" | "info" | "gold";

const variants: Record<Variant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-700 dark:text-red-400",
  muted: "bg-muted text-muted-foreground",
  info: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  gold: "bg-[var(--gold-soft)] text-[var(--gold-foreground)]",
};

const dot: Record<string, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  gold: "bg-[var(--gold)]",
  default: "bg-primary",
  muted: "bg-muted-foreground",
};

export function StatusBadge({
  children,
  variant = "default",
  dot: withDot = false,
  className,
}: {
  children: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {withDot && <span className={cn("size-1.5 rounded-full", dot[variant])} />}
      {children}
    </span>
  );
}

export function statusVariant(value: string): Variant {
  const v = value.toLowerCase();
  if (["completed", "active", "verified", "linked", "normal", "available", "done"].some((k) => v.includes(k)))
    return "success";
  if (["needs review", "needs_review", "pending", "borderline", "incomplete", "unknown"].some((k) => v.includes(k)))
    return "warning";
  if (["urgent", "high", "severe", "cancelled", "error"].some((k) => v.includes(k))) return "danger";
  if (["info", "upcoming"].includes(v)) return "info";
  if (["gold", "premium"].includes(v)) return "gold";
  return "muted";
}
