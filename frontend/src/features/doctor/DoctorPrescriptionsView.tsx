"use client";

import { motion } from "framer-motion";
import { Pill, FileText, Plus } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { Button } from "@/components/ui/button";
import type { DoctorPatientRecord } from "@/types";

export function DoctorPrescriptionsView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const caseQueue = useAppStore((s) => s.caseQueue);

  // Gather finalized prescriptions from real case records only.
  const finalized = caseQueue
    .filter((p: DoctorPatientRecord) => p.prescriptions?.some((r) => r.confirmed))
    .map((p) => ({
      id: p.id,
      patientId: p.patientId,
      patient: p.name,
      items: (p.prescriptions ?? []).filter((r) => r.confirmed).map((r) => [r.medicine, r.dose, r.frequency].filter(Boolean).join(" · ")),
    }));

  const openPatient = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  return (
    <DoctorPageShell title="Prescriptions" currentTab="DOCTOR_QUEUE" sub={`${finalized.length} finalized`}>
      {finalized.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground"><Pill className="size-6" /></span>
          <p className="mt-3 text-sm font-semibold">No prescriptions yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">Finalized prescriptions will appear here once a consultation is completed.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setView("DOCTOR_QUEUE")}>
            <Plus className="size-4 mr-1" /> Open patient queue
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {finalized.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-3.5 card-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Pill className="size-4" /></span>
                  <div>
                    <p className="text-sm font-semibold">{r.patient}</p>
                    <p className="text-[10px] text-muted-foreground">{r.patientId}</p>
                  </div>
                </div>
                <button onClick={() => openPatient(r.id)} className="flex items-center gap-1 text-xs font-medium text-primary">View <FileText className="size-3.5" /></button>
              </div>
              <ul className="mt-2 space-y-1 border-t border-border pt-2">
                {r.items.map((it, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{it}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      )}
      <p className="mt-4 text-center text-[11px] text-muted-foreground">Prescriptions are authored by the clinician only. AI does not finalize scripts.</p>
    </DoctorPageShell>
  );
}
