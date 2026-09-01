"use client";

import { motion } from "framer-motion";
import { Sparkles, AlertCircle, Inbox, RefreshCw, ShieldAlert } from "lucide-react";
import { cn, toneBg } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// ---- Skeleton ----
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-lg bg-muted", className)} aria-hidden />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-xl" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}

// ---- Section title ----
export function SectionTitle({
  title,
  action,
  onAction,
  className,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("mb-2 flex items-center justify-between", className)}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      {action && (
        <button
          onClick={onAction}
          className="text-sm font-medium text-primary hover:underline"
        >
          {action}
        </button>
      )}
    </div>
  );
}

// ---- Empty state ----
export function EmptyState({
  title,
  hint,
  icon: Icon = Inbox,
  action,
  onAction,
  className,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-7" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {action && (
        <Button className="mt-4" onClick={onAction} size="sm">
          {action}
        </Button>
      )}
    </div>
  );
}

// ---- Error state ----
export function ErrorState({
  title,
  hint,
  onRetry,
  icon: Icon = AlertCircle,
  className,
}: {
  title: string;
  hint?: string;
  onRetry?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center",
        className
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <Icon className="size-7" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-4" onClick={onRetry} size="sm">
          <RefreshCw className="mr-1.5" /> Try Again
        </Button>
      )}
    </div>
  );
}

// ---- Demo / synthetic label ----
export function SyntheticNote({ text = "Demo value" }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      <Sparkles className="size-3" />
      {text}
    </span>
  );
}

// ---- AI disclaimer ----
export function AIDisclaimer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground",
        className
      )}
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>AI-generated information. Not a diagnosis. Please consult your doctor.</p>
    </div>
  );
}

// ---- Feature / service card ----
export function FeatureCard({
  icon: Icon,
  title,
  description,
  onClick,
  tone,
  className,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  onClick?: () => void;
  tone?: "primary" | "gold" | "green" | "pink" | "sky";
  className?: string;
  delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.04, duration: 0.3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "elevate flex flex-col items-start gap-2.5 rounded-2xl border border-border bg-card p-4 text-left card-soft",
        className
      )}
    >
      <div className={cn("flex size-11 items-center justify-center rounded-xl", toneBg(tone))}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {description && (
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </motion.button>
  );
}

// ---- Row item used in health snapshot ----
export function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-2.5", className)}>
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-4" />
          </span>
        )}
        <span>{label}</span>
      </div>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}
