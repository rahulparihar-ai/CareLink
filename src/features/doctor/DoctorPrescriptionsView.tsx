"use client";

import { motion } from "framer-motion";
import { Pill, Download } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";

const demoRx = [
  { id: "rx1", patient: "Amit Verma", date: "Today · 09:25", items: ["Pantoprazole 40 mg — once daily", "Antacid PRN"], status: "active" },
  { id: "rx2", patient: "Ravi Kumar", date: "Aug 28", items: ["Aspirin 75 mg — once daily", "Atorvastatin 10 mg — nightly"], status: "active" },
  { id: "rx3", patient: "Rahul Sharma", date: "Aug 20", items: ["Amlodipine 5 mg — once daily"], status: "active" },
];

export function DoctorPrescriptionsView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);

  const openPatient = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  return (
    <DoctorPageShell title="Prescriptions" currentTab="DOCTOR_QUEUE" sub={`${demoRx.length} active`}>
      <div className="space-y-2.5">
        {demoRx.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-3.5 card-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Pill className="size-4" /></span>
                <div>
                  <p className="text-sm font-semibold">{r.patient}</p>
                  <p className="text-[10px] text-muted-foreground">{r.date}</p>
                </div>
              </div>
              <button onClick={() => openPatient("p3")} className="flex items-center gap-1 text-xs font-medium text-primary">View <Download className="size-3.5" /></button>
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
    </DoctorPageShell>
  );
}
