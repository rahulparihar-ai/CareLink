"use client";

import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { QRCodeSVG } from "qrcode.react";
import { Droplets, AlertTriangle, HeartPulse, Phone } from "lucide-react";

export function PatientHealthCardView() {
  const setView = useAppStore((s) => s.setView);
  const p = useAppStore((s) => s.patientProfile);

  return (
    <PatientPageShell title="Health Card" currentTab="PATIENT_PROFILE" onBack={() => setView("PATIENT_PROFILE")}>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary/85 text-primary-foreground shadow-xl shadow-primary/30">
        <div className="flex items-center justify-between border-b border-white/15 p-5">
          <div className="flex items-center gap-2">
            <CareLinkLogo size="sm" withWordmark={false} />
            <span className="font-bold">CareLink Health Card</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold">{p?.name}</p>
            <p className="text-xs text-white/70">{p?.id}</p>
            <div className="mt-3 space-y-1.5 text-sm">
              <p className="flex items-center gap-2"><Droplets className="size-4" /> Blood Group: <span className="font-semibold">{p?.bloodGroup}</span></p>
              <p className="flex items-center gap-2"><AlertTriangle className="size-4" /> Allergies: <span className="font-semibold">{p?.allergies}</span></p>
              <p className="flex items-center gap-2"><HeartPulse className="size-4" /> Conditions: <span className="font-semibold">{p?.knownConditions}</span></p>
              <p className="flex items-center gap-2"><Phone className="size-4" /> Emergency: <span className="font-semibold text-xs">{p?.emergencyContact}</span></p>
            </div>
          </div>
          <div className="shrink-0 rounded-2xl bg-white p-2">
            <QRCodeSVG value={p?.id ?? "CL-2026-000124"} size={96} fgColor="#1a6eb5" />
          </div>
        </div>
      </div>
    </PatientPageShell>
  );
}
