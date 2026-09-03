"use client";

import { HeartPulse } from "lucide-react";
import { cn } from "@/utils";
import { useAppStore } from "@/store";

export function CareLinkLogo({
  className,
  withWordmark = true,
  size = "md",
  animate = false,
}: {
  className?: string;
  withWordmark?: boolean;
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}) {
  const theme = useAppStore((s) => s.theme);
  const sizes = {
    sm: "h-8 w-8",
    md: "h-11 w-11",
    lg: "h-16 w-16",
  };
  const wordmark = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };
  const isBlack = theme === "black" || theme === "dark";

  return (
    <div className={cn("flex items-center gap-2.5", animate && "animate-in fade-in", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30",
          sizes[size]
        )}
      >
        <HeartPulse className="h-[55%] w-[55%]" strokeWidth={2.2} />
        <span
          className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20"
          aria-hidden
        />
      </div>
      {withWordmark && (
        <div className={cn("font-bold tracking-tight", wordmark[size], isBlack ? "text-foreground" : "text-foreground")}>
          Care<span className="text-primary">Link</span>
        </div>
      )}
    </div>
  );
}
