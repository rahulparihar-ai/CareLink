"use client";

import { Footprints, Moon, Sparkles, Salad, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";

export function PatientWellnessView() {
  const setView = useAppStore((s) => s.setView);
  const stepsData = useAppStore((s) => s.stepsData);
  const sleepData = useAppStore((s) => s.sleepData);

  const items = [
    { icon: Footprints, title: "Steps", sub: "Track your daily activity", bg: "bg-emerald-500/10 text-emerald-600", metric: stepsData ? stepsData.today.toLocaleString() : "—", metricLabel: stepsData ? "steps today" : "no data yet", view: "PATIENT_STEPS" as const },
    { icon: Moon, title: "Sleep", sub: "Understand your rest", bg: "bg-sky-500/10 text-sky-600", metric: sleepData ? `${sleepData.todayHours}h` : "—", metricLabel: sleepData ? "last night" : "no data yet", view: "PATIENT_SLEEP" as const },
    { icon: Sparkles, title: "Health Guidance", sub: "Personalized healthy habits", bg: "bg-[var(--gold-soft)] text-[var(--gold-foreground)]", view: "PATIENT_GUIDANCE" as const },
    { icon: Salad, title: "Ask AI About Nutrition", sub: "Education, not dieting", bg: "bg-pink-500/10 text-pink-600", view: "PATIENT_NUTRITION" as const },
  ];

  return (
    <PatientPageShell title="Wellness" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_HOME")}>
      <div className="space-y-3">
        {items.map((it) => (
          <button key={it.title} onClick={() => setView(it.view)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left card-soft">
            <span className={`flex size-12 items-center justify-center rounded-xl ${it.bg}`}>
              <it.icon className="size-6" />
            </span>
            <div className="flex-1">
              <p className="font-semibold">{it.title}</p>
              <p className="text-xs text-muted-foreground">{it.sub}</p>
              {it.metric && (
                <p className="mt-1 text-sm font-bold">{it.metric} <span className="text-xs font-normal text-muted-foreground">· {it.metricLabel}</span></p>
              )}
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </PatientPageShell>
  );
}
