"use client";

import { motion } from "framer-motion";
import { Syringe } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function PatientVaccinationView() {
  const setView = useAppStore((s) => s.setView);
  const vaccinations = useAppStore((s) => s.vaccinations);

  return (
    <PatientPageShell title="Vaccinations" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HISTORY")}>
      {vaccinations.length === 0 ? (
        <EmptyState title="No vaccinations recorded" icon={Syringe} />
      ) : (
        <div className="space-y-2.5">
          {vaccinations.map((v, i) => (
            <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4 card-soft">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600"><Syringe className="size-5" /></span>
                <div className="flex-1">
                  <p className="font-semibold">{v.vaccine}</p>
                  <p className="text-xs text-muted-foreground">{v.dose} · {v.date}</p>
                </div>
                <StatusBadge variant="success" dot>{v.status}</StatusBadge>
              </div>
              <div className="mt-2 border-t border-border pt-2 text-[11px] text-muted-foreground">Source: {v.source}</div>
            </motion.div>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}
