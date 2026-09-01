"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, XCircle } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { hospitalDepartments, type Department } from "@/data/hospital";
import { cn } from "@/lib/utils";

export function ConsultantScheduleView() {
  const setView = useAppStore((s) => s.setView);
  const [dept, setDept] = useState<Department>(hospitalDepartments[0]);

  return (
    <PatientPageShell title="Consultant Schedule" currentTab="HOSPITAL_HOME" onBack={() => setView("HOSPITAL_HOME")}>
      {/* Dept selector */}
      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {hospitalDepartments.map((d) => (
          <button key={d.id} onClick={() => setDept(d)}
            className={cn("shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              dept.id === d.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {d.name}
          </button>
        ))}
      </div>

      {/* Consultants */}
      <div className="space-y-3">
        {dept.consultants.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 card-soft">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {c.name.replace("Dr. ", "").split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.designation} · {c.qualification}</p>
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="mt-3 grid grid-cols-7 gap-1">
              {c.schedule.map((s) => (
                <div key={s.day} className={cn("flex flex-col items-center rounded-xl py-2 text-center", s.opd ? "bg-emerald-500/10" : "bg-muted/50")}>
                  <span className="text-[10px] font-bold uppercase">{s.day.slice(0, 2)}</span>
                  <span className="mt-0.5 flex items-center justify-center text-[10px] text-muted-foreground">
                    {s.opd ? <CheckCircle2 className="size-2.5 text-emerald-500" /> : <XCircle className="size-2.5 text-red-400" />}
                  </span>
                  <span className="text-[9px] text-muted-foreground leading-tight">{s.time || "—"}</span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
        <CalendarDays className="size-4 shrink-0 text-primary" />
        OPD schedule shown. Consultation hours may change on holidays.
      </div>
    </PatientPageShell>
  );
}
