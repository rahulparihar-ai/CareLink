"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, TrendingUp } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { SyntheticNote, EmptyState } from "@/components/shared/primitive";
import { statusVariant, StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

export function PatientLabView() {
  const setView = useAppStore((s) => s.setView);
  const reports = useAppStore((s) => s.labReports);
  const [selected, setSelected] = useState(reports[0]?.id);

  const report = reports.find((r) => r.id === selected) ?? reports[0];

  if (reports.length === 0) {
    return (
      <PatientPageShell title="Lab Reports" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_DOCUMENTS")}>
        <EmptyState title="No lab reports yet" hint="Uploaded investigation reports will appear here." icon={FlaskConical} />
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell title="Lab Reports" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_DOCUMENTS")}>
      <div className="mb-3 flex items-center gap-2">
        <SyntheticNote text="Synthetic demo values" />
      </div>

      {/* Report list */}
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {reports.map((r) => (
          <button key={r.id} onClick={() => setSelected(r.id)}
            className={cn("shrink-0 rounded-xl border px-3 py-2 text-left", selected === r.id ? "border-primary bg-primary/5" : "border-border bg-card")}>
            <p className="text-xs font-semibold">{r.title}</p>
            <p className="text-[10px] text-muted-foreground">{r.date}</p>
          </button>
        ))}
      </div>

      {report && (
        <div className="rounded-2xl border border-border bg-card p-4 card-soft">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-lg bg-pink-500/10 text-pink-600"><FlaskConical className="size-4" /></span>
              <div>
                <p className="font-semibold">{report.title}</p>
                <p className="text-[10px] text-muted-foreground">{report.source} · {report.date}</p>
              </div>
            </div>
            <StatusBadge variant={statusVariant(report.status)} dot>{report.status}</StatusBadge>
          </div>

          <div className="mt-3 space-y-2">
            {report.markers.map((m, i) => (
              <motion.div key={m.name} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.flag}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{m.value} <span className="text-xs font-normal text-muted-foreground">{m.unit}</span></p>
                  <span className={cn("text-xs font-medium", m.flag === "Normal" ? "text-emerald-600" : "text-amber-600")}>{m.normal}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-xl border border-primary/15 bg-primary/5 p-2.5 text-xs text-muted-foreground">
            <TrendingUp className="size-4 shrink-0 text-primary" />
            This is a synthetic demo report. No real clinical values.
          </div>
        </div>
      )}
    </PatientPageShell>
  );
}
