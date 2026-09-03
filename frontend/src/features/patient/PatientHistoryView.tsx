"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  UserRound,
  HeartPulse,
  Activity,
  Scissors,
  Stethoscope,
  Pill,
  AlertTriangle,
  Users,
  Syringe,
  FlaskConical,
  Dumbbell,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/utils";

interface HistorySection {
  key: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "complete" | "incomplete" | "review";
  content: React.ReactNode;
}

export function PatientHistoryView() {
  const setView = useAppStore((s) => s.setView);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const medications = useAppStore((s) => s.medications);
  const allergies = useAppStore((s) => s.allergies);
  const family = useAppStore((s) => s.familyHealth);
  const vaccinations = useAppStore((s) => s.vaccinations);
  const [open, setOpen] = useState<string | null>("conditions");

  const sections: HistorySection[] = [
    {
      key: "personal",
      title: "Personal Information",
      icon: UserRound,
      status: "complete",
      content: (
        <div className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name:</span> {patientProfile?.name ?? "—"}</p>
          <p><span className="text-muted-foreground">Age/Sex:</span> {patientProfile?.age ? `${patientProfile.age} · ${patientProfile.gender}` : "—"}</p>
          <p><span className="text-muted-foreground">Blood group:</span> {patientProfile?.bloodGroup ?? "—"}</p>
        </div>
      ),
    },
    {
      key: "conditions",
      title: "Medical Conditions",
      icon: HeartPulse,
      status: "complete",
      content: (
        <div className="space-y-2">
          {patientProfile?.knownConditions ? (
            <ConditionTag label={patientProfile.knownConditions} note="On record" tone="info" />
          ) : (
            <p className="text-sm text-muted-foreground">No conditions recorded.</p>
          )}
        </div>
      ),
    },
    {
      key: "past",
      title: "Past Illnesses",
      icon: Activity,
      status: "incomplete",
      content: <p className="text-sm text-muted-foreground">No significant past illnesses recorded.</p>,
    },
    {
      key: "surgeries",
      title: "Surgeries",
      icon: Scissors,
      status: "complete",
      content: <p className="text-sm text-muted-foreground">No surgeries on record.</p>,
    },
    {
      key: "hospital",
      title: "Hospitalizations",
      icon: Stethoscope,
      status: "incomplete",
      content: <p className="text-sm text-muted-foreground">Not recorded.</p>,
    },
    {
      key: "medications",
      title: "Medications",
      icon: Pill,
      status: "complete",
      content: (
        <div className="space-y-2">
          {medications.filter((m) => m.status === "current").map((m) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{m.name} <span className="text-muted-foreground">{m.strength}</span></span>
              <span className="text-xs text-muted-foreground">{m.frequency}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "allergies",
      title: "Allergies",
      icon: AlertTriangle,
      status: "complete",
      content: (
        <div className="space-y-2">
          {allergies.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg bg-red-500/5 px-3 py-2 text-sm">
              <span className="font-medium">{a.substance}</span>
              <StatusBadge variant={a.severity === "Severe" ? "danger" : "warning"}>{a.severity}</StatusBadge>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "family",
      title: "Family History",
      icon: Users,
      status: "complete",
      content: (
        <div className="space-y-2">
          {family.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{f.relationship}</span>
              <span className="text-xs text-muted-foreground">{f.condition}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "vaccines",
      title: "Vaccinations",
      icon: Syringe,
      status: "complete",
      content: (
        <div className="space-y-2">
          {vaccinations.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{v.vaccine}</span>
              <span className="text-xs text-muted-foreground">{v.date}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      key: "procedures",
      title: "Procedures",
      icon: FlaskConical,
      status: "incomplete",
      content: <p className="text-sm text-muted-foreground">No procedures recorded.</p>,
    },
    {
      key: "lifestyle",
      title: "Lifestyle Information",
      icon: Dumbbell,
      status: "review",
      content: <p className="text-sm text-muted-foreground">Smoking/Eligibility details need review.</p>,
    },
  ];

  const statusLabel: Record<string, string> = {
    complete: "Complete",
    incomplete: "Incomplete",
    review: "Needs Review",
  };
  const statusVariantMap: Record<string, "success" | "warning" | "danger"> = {
    complete: "success",
    incomplete: "warning",
    review: "warning",
  };

  return (
    <PatientPageShell title="Medical History" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HOME")}>
      <div className="space-y-2.5">
        {sections.map((sec) => {
          const isOpen = open === sec.key;
          const Icon = sec.icon;
          return (
            <div key={sec.key} className="overflow-hidden rounded-2xl border border-border bg-card card-soft">
              <button
                onClick={() => setOpen(isOpen ? null : sec.key)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1 font-medium">{sec.title}</span>
                <StatusBadge variant={statusVariantMap[sec.status]} dot>
                  {statusLabel[sec.status]}
                </StatusBadge>
                <ChevronDown
                  className={cn("size-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="border-t border-border px-4 py-3">{sec.content}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </PatientPageShell>
  );
}

function ConditionTag({ label, note, tone }: { label: string; note: string; tone: "warn" | "info" }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
      <span className="font-medium">{label}</span>
      <span className={cn("text-xs", tone === "warn" ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400")}>
        {note}
      </span>
    </div>
  );
}
