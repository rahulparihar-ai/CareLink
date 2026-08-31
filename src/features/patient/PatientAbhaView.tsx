"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Link2, Keyboard, ScanQrCode, ArrowRight, BadgeCheck, FileText, HeartHandshake } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

export function PatientAbhaView() {
  const setView = useAppStore((s) => s.setView);
  const p = useAppStore((s) => s.patientProfile);
  const [step, setStep] = useState<"main" | "onboard">("main");
  const linked = p?.abhaStatus === "Linked";

  const options = [
    { icon: Link2, label: "Link Existing ABHA", desc: "Connect an existing health ID" },
    { icon: Keyboard, label: "Enter ABHA Details", desc: "Type your ABHA number" },
    { icon: ScanQrCode, label: "Scan QR", desc: "Scan from the ABHA app" },
  ];

  return (
    <PatientPageShell title="ABHA Health ID" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HOME")}>
      {step === "main" ? (
        <>
          {/* Status card */}
          <div className="rounded-3xl border border-border bg-card p-5 card-soft">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="size-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold">ABHA Status</p>
                {linked ? (
                  <StatusBadge variant="success" dot className="mt-1">Linked</StatusBadge>
                ) : (
                  <StatusBadge variant="warning" dot className="mt-1">Not Linked</StatusBadge>
                )}
              </div>
            </div>
            {linked && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">ABHA Reference</p>
                  <p className="font-semibold">{p?.abhaReference ?? "91-XXXX-XXXX-XXXX"}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Consent Status</p>
                  <StatusBadge variant="success" dot>Managed</StatusBadge>
                </div>
              </div>
            )}
          </div>

          {/* Health records */}
          <section className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Health Records & Consent</h2>
            <div className="space-y-2">
              <RecordRow icon={FileText} label="Health Records" sub="Your linked records across facilities" />
              <RecordRow icon={HeartHandshake} label="Consent Management" sub="Control who can view your records" />
            </div>
          </section>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>This is a frontend prototype using mock data. No live ABDM integration.</p>
          </div>

          {!linked && (
            <Button className="mt-5 h-13 w-full text-base" onClick={() => setStep("onboard")}>
              ABHA Onboarding <ArrowRight className="ml-1.5" />
            </Button>
          )}
        </>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-bold">ABHA Onboarding</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create or link your Ayushman Bharat Health Account.</p>
          </motion.div>

          <div className="mt-5 space-y-2.5">
            {options.map((o, i) => (
              <motion.button key={o.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setStep("main");
                  setView("PATIENT_PROFILE");
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left card-soft">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><o.icon className="size-5" /></span>
                <div className="flex-1">
                  <p className="font-semibold">{o.label}</p>
                  <p className="text-xs text-muted-foreground">{o.desc}</p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </motion.button>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center">
            <button onClick={() => { setStep("main"); }} className="flex items-center gap-1.5 text-sm font-medium text-primary">
              Continue without linking
              {linked && <BadgeCheck className="size-4" />}
            </button>
          </div>
        </>
      )}
    </PatientPageShell>
  );
}

function RecordRow({ icon: Icon, label, sub }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left card-soft">
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </button>
  );
}
