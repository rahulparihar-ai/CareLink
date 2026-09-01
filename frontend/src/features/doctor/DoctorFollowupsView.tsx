"use client";

import { motion } from "framer-motion";
import { CalendarClock, ChevronRight, CalendarCheck } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";

const followups = [
  { id: "f1", patientId: "p2", patient: "Sunita Devi", reason: "Echo + dyspnea review", date: "Sep 06, 2026", status: "scheduled" },
  { id: "f2", patientId: "p5", patient: "Kiran Patel", reason: "Diabetic neuropathy review", date: "Sep 12, 2026", status: "scheduled" },
  { id: "f3", patientId: "p1", patient: "Ravi Kumar", reason: "Cardiology referral follow-up", date: "Sep 03, 2026", status: "pending" },
  { id: "f4", patientId: "p6", patient: "Rahul Sharma", reason: "HbA1c + BP review", date: "Sep 20, 2026", status: "completed" },
];

export function DoctorFollowupsView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);

  return (
    <DoctorPageShell title="Follow-ups" currentTab="DOCTOR_QUEUE" sub={`${followups.length} scheduled`}>
      <div className="mb-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <CalendarCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>CareLink can auto-schedule follow-ups based on conditions and prescriptions.</p>
      </div>
      <div className="space-y-2.5">
        {followups.map((f, i) => (
          <motion.button key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            whileTap={{ scale: 0.99 }} onClick={() => { setSelectedPatientId(f.patientId); setView("DOCTOR_PATIENT"); }}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
            <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><CalendarClock className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{f.patient}</p>
              <p className="truncate text-xs text-muted-foreground">{f.reason}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">{f.date}</p>
            </div>
            <StatusBadge variant={statusVariant(f.status)} dot>{f.status}</StatusBadge>
            <ChevronRight className="size-4 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </DoctorPageShell>
  );
}
