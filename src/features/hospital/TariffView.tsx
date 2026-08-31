"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { hospitalDepartments, type Department } from "@/data/hospital";
import { cn } from "@/lib/utils";

export function TariffView() {
  const setView = useAppStore((s) => s.setView);
  const [dept, setDept] = useState<Department>(hospitalDepartments[0]);

  return (
    <PatientPageShell title="Tariff" currentTab="HOSPITAL_HOME" onBack={() => setView("HOSPITAL_HOME")}>
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {hospitalDepartments.map((d) => (
          <button key={d.id} onClick={() => setDept(d)}
            className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              dept.id === d.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {d.name}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card card-soft overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-3 gap-2 border-b border-border bg-muted/50 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <span className="col-span-1">Service</span>
          <span className="text-right">OTS</span>
          <span className="text-right">General</span>
        </div>
        {/* Rows */}
        {dept.tariffs.map((t, i) => (
          <motion.div key={t.service} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            className="grid grid-cols-3 gap-2 border-b border-border/50 px-4 py-3 last:border-0">
            <span className="col-span-1 text-sm">{t.service}</span>
            <span className="text-right text-sm font-semibold">{t.ots}</span>
            <span className="text-right text-sm font-medium text-muted-foreground">{t.general}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        Charges may vary. Government hospital tariffs are indicative. Concessions available under BPL and insurance schemes.
      </div>
    </PatientPageShell>
  );
}
