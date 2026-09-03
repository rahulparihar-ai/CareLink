"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ChevronRight, ShieldAlert, Flag } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";

const order = { URGENT: 0, NEEDS_REVIEW: 1, HIGH: 2, NORMAL: 3 };

export function DoctorPriorityView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const caseQueue = useAppStore((s) => s.caseQueue);

  const sorted = [...caseQueue].sort((a, b) =>
    (order[a.redFlagLevel as keyof typeof order] ?? 4) - (order[b.redFlagLevel as keyof typeof order] ?? 4));

  const open = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  const urgentCount = caseQueue.filter((p) => p.redFlagLevel === "URGENT").length;

  return (
    <DoctorPageShell title="Priority Queue" currentTab="DOCTOR_PRIORITY" sub="Sorted by clinical urgency">
      {urgentCount > 0 && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-300/60 bg-red-50 p-3.5 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-bold">{urgentCount} urgent case(s) need attention</p>
            <p className="mt-0.5 text-xs opacity-90">Red-flagged patients are prioritized first for review.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 border-b border-border pb-2 text-xs font-medium text-muted-foreground">
        <span>Priority score</span>
        <span className="flex flex-1 items-center justify-between"><Flag className="size-3.5" /> <span>Wait</span></span>
      </div>

      <div className="mt-2 space-y-2.5">
        {sorted.map((p, i) => {
          const score = order[p.redFlagLevel as keyof typeof order] ?? 4;
          const level = p.redFlagLevel ?? "NORMAL";
          return (
            <motion.button key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.99 }} onClick={() => open(p.id)}
              className="w-full rounded-2xl border border-border bg-card p-4 text-left card-soft">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{p.name}</p>
                    <span className="text-xs text-muted-foreground">· {p.age}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{p.chiefComplaint}</p>
                </div>
                <span className="text-xs font-medium">{p.waitTime}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                <StatusBadge variant={statusVariant(level)} dot>{level.replace("_", " ")}</StatusBadge>
                <div className="flex gap-1">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <span key={j}
                      className={`flex h-2 w-6 items-center justify-center ${j < score + 1 ? "" : "bg-muted"}`}>
                      <span className={`h-1 w-full rounded-full ${j < score + 1 ? (level === "URGENT" ? "bg-red-500" : level === "NEEDS_REVIEW" ? "bg-amber-500" : "bg-primary/40") : "bg-transparent"}`} />
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
          <AlertTriangle className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-muted-foreground">No cases yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Patients captured at the clinic will appear here.</p>
        </div>
      )}
    </DoctorPageShell>
  );
}
