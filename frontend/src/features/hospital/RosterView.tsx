"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Clock, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { dutyRoster } from "@/data/hospital";
import { cn } from "@/lib/utils";

export function RosterView() {
  const setView = useAppStore((s) => s.setView);
  const [dayIdx, setDayIdx] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const today = dutyRoster[Math.min(dayIdx, dutyRoster.length - 1)];

  return (
    <PatientPageShell title="Roster Enquiry" currentTab="HOSPITAL_HOME" onBack={() => setView("HOSPITAL_HOME")}>
      <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {dutyRoster.map((d, i) => (
          <button key={d.day} onClick={() => setDayIdx(i)}
            className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              dayIdx === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {d.day}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {today.entries.map((e, i) => (
          <motion.div key={`${today.day}-${e.dept}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="rounded-2xl border border-border bg-card p-4 card-soft">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Stethoscope className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{e.dept}</p>
                  <p className="text-xs text-muted-foreground">{e.doctor}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="flex items-center gap-1 text-xs"><Clock className="size-3 text-muted-foreground" /> {e.shift}</p>
                <p className="text-[10px] text-muted-foreground">{e.emergency}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        Roster is subject to change on holidays. Emergency services are available 24/7.
      </div>
    </PatientPageShell>
  );
}
