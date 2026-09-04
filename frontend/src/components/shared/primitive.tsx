"use client";

import { Inbox, ShieldAlert } from "lucide-react";
import { cn } from "@/utils";
import { Button } from "@/components/ui/button";

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