"use client";

import { motion } from "framer-motion";
import { Files, ChevronRight, CheckCircle2, Clock } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import { demoPatients } from "@/data/demo";

export function DoctorCasesView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);

  const open = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  return (
    <DoctorPageShell title="Cases & Records" currentTab="DOCTOR_QUEUE" sub={`${demoPatients.length} cases`}>
      <div className="space-y-2.5">
        {demoPatients.map((p, i) => (
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
