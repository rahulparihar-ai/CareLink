"use client";

import { Siren, Phone, AlertTriangle, Droplets, HeartPulse, Pill } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";

export function PatientEmergencyCardView() {
  const setView = useAppStore((s) => s.setView);
  const p = useAppStore((s) => s.patientProfile);

  return (
    <PatientPageShell title="Emergency Card" currentTab="PATIENT_PROFILE" onBack={() => setView("PATIENT_HOME")}>
      <div className="overflow-hidden rounded-3xl border-2 border-red-200 dark:border-red-500/40 bg-card">
        <div className="bg-red-600 px-4 py-3 text-center">
          <p className="flex items-center justify-center gap-2 font-bold text-white">
            <Siren className="size-5" /> EMERGENCY CARD
          </p>
          <p className="text-xs text-white/80">Show this in an emergency</p>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10">
              <Droplets className="size-6" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Blood Group</p>
              <p className="text-lg font-bold">{p?.bloodGroup ?? "—"}</p>
            </div>
          </div>

          <EmergencyRow icon={AlertTriangle} tone="danger" label="Critical Allergies" value={p?.allergies ?? "—"} />

          <EmergencyRow icon={HeartPulse} tone="warn" label="Critical Conditions" value={p?.knownConditions ?? "—"} />

          <EmergencyRow icon={Pill} tone="info" label="Important Medication" value={p?.currentMedicines ?? "—"} />

          <div className="rounded-2xl bg-muted/50 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              <Phone className="size-4" /> Emergency Contact
            </p>
            <p className="mt-1 text-sm">{p?.emergencyContact}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href="tel:112" className="rounded-xl bg-red-600 py-2.5 text-center text-sm font-semibold text-white">Call 112</a>
              <a href="tel:+919123456780" className="rounded-xl bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground">Call Contact</a>
            </div>
          </div>
        </div>
      </div>
    </PatientPageShell>
  );
}

function EmergencyRow({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: string }) {
  const tones: Record<string, string> = {
    danger: "text-red-600",
    warn: "text-amber-600",
    info: "text-sky-600",
  };
  const bgs: Record<string, string> = {
    danger: "bg-red-50 dark:bg-red-500/10",
    warn: "bg-amber-50 dark:bg-amber-500/10",
    info: "bg-sky-50 dark:bg-sky-500/10",
  };
  return (
    <div className="flex items-center gap-3">
      <div className={`flex size-10 items-center justify-center rounded-xl ${bgs[tone]}`}>
        <Icon className={`size-5 ${tones[tone]}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
