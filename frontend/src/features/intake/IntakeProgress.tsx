"use client";

import { motion } from "framer-motion";
import { type IntakePhase } from "@/types";
import { cn } from "@/utils";
import { ScanLine, CheckCheck, FileDigit, MessageSquareText, LockKeyhole, IdCard } from "lucide-react";

const STEPS: { key: IntakePhase; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "identify", label: "Identify", icon: IdCard },
  { key: "consent", label: "Consent", icon: LockKeyhole },
  { key: "history", label: "History", icon: MessageSquareText },
  { key: "documents", label: "Documents", icon: FileDigit },
  { key: "summary", label: "Summary", icon: ScanLine },
  { key: "complete", label: "Done", icon: CheckCheck },
];

export function IntakeProgress({ phase }: { phase: IntakePhase }) {
  const shown = phase === "welcome" ? [] : STEPS;

  return (
    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-4 py-3">
      {shown.map((step, i) => {
        const Icon = step.icon;
        const isActive = phase === step.key;
        const isDone = phase !== "welcome" && i < STEPS.findIndex((s) => s.key === phase);
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-emerald-500/15 text-emerald-600",
                  !isActive && !isDone && "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </motion.div>
              <span className={cn("text-[9px] font-medium", isActive ? "text-primary" : "text-muted-foreground")}>{step.label}</span>
            </div>
            {i < shown.length - 1 && (
              <div className={cn("mx-1 mb-4 h-0.5 flex-1 rounded-full", isDone ? "bg-emerald-500/40" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

