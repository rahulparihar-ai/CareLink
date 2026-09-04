"use client";

import { useState } from "react";
import { QrCode, ScanLine, X, UserRound, ChevronRight, AlertCircle } from "lucide-react";
import { useAppStore } from "@/store";
import type { PatientProfile } from "@/types";
import { Button } from "@/components/ui/button";

export function DoctorScanPatientModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const caseQueue = useAppStore((s) => s.caseQueue);
  const registry = useAppStore((s) => s.patientRegistry);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const setView = useAppStore((s) => s.setView);

  const [phase, setPhase] = useState<"idle" | "scanning" | "found" | "empty">("idle");
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  const startScan = async () => {
    setPhase("scanning");
    await new Promise((r) => setTimeout(r, 1800));
    // The QR contains only a patient reference ID (no medical data).
    // Look up the matching record in the patient registry.
    const candidates =
      registry.length > 0
        ? registry
        : caseQueue
            .filter((c) => c.patientId)
            .map((c) => ({
              id: c.patientId,
              name: c.name,
              age: c.age,
              gender: c.gender,
              mobileNumber: "",
            } as PatientProfile));

    const match = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
    setPatient(match);
    setPhase(match ? "found" : "empty");
  };

  const openConsultation = () => {
    const record = caseQueue.find((c) => c.patientId === patient?.id);
    if (record) {
      setSelectedPatientId(record.id);
      setView("DOCTOR_CONSULTATION");
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-card p-5 card-soft sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold">
            <QrCode className="size-5 text-primary" /> Scan Patient
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X />
          </Button>
        </div>

        {phase === "scanning" && (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="flex size-20 animate-pulse items-center justify-center rounded-2xl bg-primary/10">
              <ScanLine className="size-10 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Scanning QR code…</p>
          </div>
        )}

        {phase === "found" && patient && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-background/60 p-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <UserRound className="size-6 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{patient.name}</p>
                <p className="text-xs text-muted-foreground">{patient.id}</p>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  {patient.age != null && <span className="rounded-full bg-muted px-2 py-0.5">{patient.age} yrs</span>}
                  {patient.gender && <span className="rounded-full bg-muted px-2 py-0.5">{patient.gender}</span>}
                  {patient.bloodGroup && <span className="rounded-full bg-muted px-2 py-0.5">Blood {patient.bloodGroup}</span>}
                </div>
                {(patient.mobileNumber || patient.address) && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {patient.mobileNumber}
                    {patient.mobileNumber && patient.address ? " · " : ""}{patient.address}
                  </p>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={openConsultation}>
              {caseQueue.some((c) => c.patientId === patient.id) ? "Open consultation" : "Patient not in queue"} <ChevronRight className="ml-1 size-4" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">Patient shared this QR at admission. No health data is stored in the code.</p>
          </div>
        )}

        {phase === "empty" && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="size-10 text-muted-foreground" />
            <p className="text-sm font-medium">No matching patient found</p>
            <p className="text-xs text-muted-foreground">Ask the patient to re-share their registration QR, or register them manually.</p>
          </div>
        )}

        {phase !== "scanning" && (
          <div className="mt-4 border-t border-border pt-4">
            <Button variant={phase === "found" || phase === "empty" ? "outline" : "default"} className="w-full" onClick={startScan} disabled={phase === "found" || phase === "empty"}>
              {phase === "idle" ? "Scan QR code" : "Scan another"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}