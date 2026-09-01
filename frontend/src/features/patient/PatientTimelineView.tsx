"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  FileText,
  Pill,
  FlaskConical,
  Syringe,
  Stethoscope,
  History,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types";

const filters = [
  { key: "all", label: "All", icon: History },
  { key: "visit", label: "Visits", icon: Stethoscope },
  { key: "document", label: "Documents", icon: FileText },
  { key: "medication", label: "Medications", icon: Pill },
  { key: "lab", label: "Reports", icon: FlaskConical },
  { key: "vaccination", label: "Vaccines", icon: Syringe },
];

const iconMap: Record<TimelineEvent["category"], { icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  visit: { icon: Stethoscope, bg: "bg-primary/10 text-primary" },
  document: { icon: FileText, bg: "bg-sky-500/10 text-sky-600" },
  medication: { icon: Pill, bg: "bg-emerald-500/10 text-emerald-600" },
  lab: { icon: FlaskConical, bg: "bg-pink-500/10 text-pink-600" },
  vaccination: { icon: Syringe, bg: "bg-amber-500/10 text-amber-600" },
  report: { icon: FileText, bg: "bg-sky-500/10 text-sky-600" },
  procedure: { icon: Stethoscope, bg: "bg-primary/10 text-primary" },
};

export function PatientTimelineView() {
  const setView = useAppStore((s) => s.setView);
  const timeline = useAppStore((s) => s.timeline);
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? timeline : timeline.filter((e) => e.category === filter);
  const grouped = groupByYear(filtered);

  return (
    <PatientPageShell
      title="Health Timeline"
      currentTab="PATIENT_HISTORY"
      onBack={() => setView("PATIENT_HOME")}
      right={
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState title="No timeline events yet" hint="Your health activity will appear here." icon={CalendarDays} />
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([year, events]) => (
            <div key={year}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">{year}</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="relative ml-3 border-l-2 border-border pl-5">
                {events.map((ev, i) => {
                  const meta = iconMap[ev.category] ?? { icon: History, bg: "bg-muted text-muted-foreground" };
                  const Icon = meta.icon;
                  return (
                    <motion.div
                      key={ev.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative mb-4"
                    >
                      <span className={cn("absolute -left-[30px] flex size-6 items-center justify-center rounded-full ring-4 ring-background", meta.bg)}>
                        <Icon className="size-3.5" />
                      </span>
                      <div className="rounded-xl border border-border bg-card p-3 card-soft">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{ev.title}</p>
                          <span className="text-xs text-muted-foreground">{ev.date ?? ev.year}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{ev.description}</p>
                        {ev.hospital && (
                          <span className="mt-1.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {ev.hospital}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}

function groupByYear(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  return events.reduce((acc, e) => {
    (acc[e.year] = acc[e.year] || []).push(e);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);
}
