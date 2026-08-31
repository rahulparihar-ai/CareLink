"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Footprints, TrendingUp, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";

export function PatientStepsView() {
  const setView = useAppStore((s) => s.setView);
  const d = useAppStore((s) => s.stepsData);
  const [range, setRange] = useState<"week" | "month" | "year">("week");

  const weeklyMax = Math.max(...d.weekly);
  const monthlyMax = Math.max(...d.monthly);
  const bars = range === "week" ? d.weekly : d.monthly;
  const max = range === "week" ? weeklyMax : monthlyMax;
  const labels = range === "week" ? d.last7days : d.monthly.map((_, i) => `M${i + 1}`);
  const avg = range === "week" ? Math.round(d.weekly.reduce((a, b) => a + b, 0) / 7) : d.avgDaily;

  return (
    <PatientPageShell title="Steps" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_WELLNESS")}>
      {/* Hero metric */}
      <div className="rounded-3xl border border-border bg-card p-5 text-center card-soft">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
          <Footprints className="size-7" />
        </div>
        <p className="mt-3 text-4xl font-bold">{d.today.toLocaleString()}</p>
        <p className="text-sm text-muted-foreground">Today&apos;s Steps</p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <motion.div initial={{ width: 0 }} animate={{ width: `${(d.today / d.goal) * 100}%` }}
            transition={{ duration: 1, ease: "easeOut" }} className="h-full rounded-full bg-emerald-500" />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">Goal {d.goal.toLocaleString()}</p>
      </div>

      {/* Range selector + chart */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-4 card-soft">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Activity</p>
          <div className="flex gap-1 rounded-lg bg-muted p-0.5">
            {(["week", "month", "year"] as const).map((r) => (
              <button key={r} onClick={() => setRange(r)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors ${range === r ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex h-36 items-end gap-1.5">
          {labels.map((l, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <motion.div initial={{ height: 0 }} animate={{ height: `${(bars[i] / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.04 }}
                className={`w-full rounded-t-md ${range === "week" ? "bg-emerald-500/80" : "bg-emerald-500/60"}`} />
              <span className="text-[9px] text-muted-foreground">{l}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" /> Avg daily
          </div>
          <span className="text-sm font-bold">{avg.toLocaleString()}</span>
        </div>
      </div>

      {/* Benchmark */}
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>{d.benchmark}</p>
      </div>
    </PatientPageShell>
  );
}
