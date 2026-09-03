"use client";

import { motion } from "framer-motion";
import { CalendarClock, ChevronRight, CalendarCheck } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import type { DoctorPatientRecord } from "@/types";

export function DoctorFollowupsView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const caseQueue = useAppStore((s) => s.caseQueue);

  // Follow-ups are "follow-up" type clinical notes authored by the clinician.
  const followups = caseQueue
    .filter((p: DoctorPatientRecord) => p.notes?.some((n) => n.type === "follow-up"))
    .map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patient: p.name,
      reason: p.notes!.filter((n) => n.type === "follow-up").map((n) => n.content).join(" · "),
      date: p.notes!.filter((n) => n.type === "follow-up").map((n) => new Date(n.timestamp).toLocaleDateString()).at(-1) ?? "—",
      status: p.status,
    }));

  return (
    <DoctorPageShell title="Follow-ups" currentTab="DOCTOR_QUEUE" sub={`${followups.length} scheduled`}>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Follow-ups created during a consultation are saved to the patient record.</p>
      </div>
      {followups.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground"><CalendarClock className="size-6" /></span>
          <p className="mt-3 text-sm font-semibold">No follow-ups yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">Follow-ups you schedule during a consultation will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {followups.map((f, i) => (
            <motion.button key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.99 }} onClick={() => { setSelectedPatientId(f.id); setView("DOCTOR_PATIENT"); }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
              <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><CalendarClock className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{f.patient}</p>
                <p className="truncate text-xs text-muted-foreground">{f.reason}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{f.date}</p>
              </div>
              <StatusBadge variant={statusVariant(f.status)} dot>{f.status?.replace("_", " ")}</StatusBadge>
              <ChevronRight className="size-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      )}
    </DoctorPageShell>
  );
}
