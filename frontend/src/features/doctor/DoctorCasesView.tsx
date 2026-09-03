"use client";

import { motion } from "framer-motion";
import { Files, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";

export function DoctorCasesView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const caseQueue = useAppStore((s) => s.caseQueue);

  const open = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  return (
    <DoctorPageShell title="Cases & Records" currentTab="DOCTOR_QUEUE" sub={`${caseQueue.length} cases`}>
      <div className="space-y-2.5">
        {caseQueue.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">No cases yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Patients captured at the clinic will appear here.</p>
          </div>
        )}
        {caseQueue.map((p, i) => (
          <motion.button key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.99 }} onClick={() => open(p.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Files className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <StatusBadge variant={statusVariant(p.summaryStatus ?? "pending")} dot>{p.summaryStatus?.replace("_", " ") ?? "pending"}</StatusBadge>
                <span className="text-[11px] text-muted-foreground">{p.historyCompletion ?? 0}% history</span>
              </div>
            </div>
            {p.summaryStatus === "verified" ? (
              <CheckCircle2 className="size-5 text-emerald-500" />
            ) : (
              <Clock className="size-5 text-amber-500" />
            )}
            <ChevronRight className="size-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </DoctorPageShell>
  );
}
