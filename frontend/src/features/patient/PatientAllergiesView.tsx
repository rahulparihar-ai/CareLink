"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function PatientAllergiesView() {
  const setView = useAppStore((s) => s.setView);
  const allergies = useAppStore((s) => s.allergies);

  const known = allergies.filter((a) => a.status === "known" || a.status === "unknown");

  return (
    <PatientPageShell title="Allergies" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HISTORY")}>
      {known.length === 0 ? (
        <>
          <EmptyState title="No allergy information recorded" icon={AlertTriangle} />
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            <Info className="mt-0.5 size-4 shrink-0" />
            <p>Allergy information has not been recorded. This is not the same as &apos;No Known Allergy&apos;.</p>
          </div>
        </>
      ) : (
        <div className="space-y-2.5">
          {known.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4 card-soft">
              <div className="flex items-start gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600"><AlertTriangle className="size-5" /></span>
                <div className="flex-1">
                  <p className="font-semibold">{a.substance}</p>
                  {a.reaction && <p className="text-xs text-muted-foreground">Reaction: {a.reaction}</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <StatusBadge variant={a.severity === "Severe" ? "danger" : a.severity === "Moderate" ? "warning" : "muted"}>
                      {a.severity ?? "Unknown"}
                    </StatusBadge>
                    <span className="text-[10px] text-muted-foreground">Source: {a.source}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}
