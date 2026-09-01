"use client";

import { motion } from "framer-motion";
import { Moon, Sunrise, Sunset, Clock, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";

export function PatientSleepView() {
  const setView = useAppStore((s) => s.setView);
  const d = useAppStore((s) => s.sleepData);

  if (!d) {
    return (
      <PatientPageShell title="Sleep" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_WELLNESS")}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center card-soft">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
            <Moon className="size-7" />
          </div>
          <p className="mt-3 font-semibold">No sleep data yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Your sleep data will appear here once monitoring is connected.
          </p>
        </div>
      </PatientPageShell>
    );
  }
  const max = Math.max(...d.week);

  return (
    <PatientPageShell title="Sleep" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_WELLNESS")}>
      <div className="rounded-3xl border border-border bg-card p-5 text-center card-soft">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
          <Moon className="size-7" />
        </div>
        <p className="mt-3 text-4xl font-bold">{d.todayHours}h</p>
        <p className="text-sm text-muted-foreground">Last night&apos;s sleep</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Metric icon={Sunset} label="Bedtime" value={d.bedtime} />
          <Metric icon={Sunrise} label="Wake time" value={d.wakeTime} />
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-card p-4 card-soft">
        <p className="mb-3 text-sm font-semibold">This week</p>
        <p className="mb-3 text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3.5" /> Average {d.avgSleep}h / night</p>
        <div className="flex h-32 items-end gap-2">
          {d.week.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <motion.div initial={{ height: 0 }} animate={{ height: `${(h / max) * 100}%` }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="w-full rounded-t-md bg-sky-500/70" />
              <span className="text-[9px] text-muted-foreground">{d.days[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        <p>Sleep data is for general wellness awareness and is not a medical diagnostic.</p>
      </div>
    </PatientPageShell>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground"><Icon className="size-3.5" /> {label}</p>
      <p className="mt-1 text-base font-bold">{value}</p>
    </div>
  );
}
