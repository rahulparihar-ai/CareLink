"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Link2, Keyboard, ScanQrCode, ArrowRight, FileText, HeartHandshake, User } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function PatientAbhaView() {
  const setView = useAppStore((s) => s.setView);
  const p = useAppStore((s) => s.patientProfile);
  const setPatientProfile = useAppStore((s) => s.setPatientProfile);
  const linked = p?.abhaStatus === "Linked";

  const options = [
    { icon: Link2, label: "Link Existing ABHA", desc: "Connect an existing health ID" },
    { icon: Keyboard, label: "Enter ABHA Details", desc: "Type your ABHA number" },
    { icon: ScanQrCode, label: "Scan QR", desc: "Scan from the ABHA app" },
  ];

  const linkFromOption = () => {
    if (!p) return;
    setPatientProfile({ ...p, abhaStatus: "Linked", abhaReference: p?.abhaReference ?? "91-" + Math.floor(100000000 + Math.random() * 900000000) });
  };

  if (!p) {
    return (
      <PatientPageShell title="ABHA Health ID" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HOME")}>
        <div className="rounded-2xl border border-border bg-card p-6 text-center card-soft">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <User className="size-7" />
          </div>
          <p className="mt-3 font-semibold">No profile yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete registration to link your ABHA health ID.
          </p>
        </div>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell title="ABHA Health ID" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HOME")}>
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

      {!linked ? (
        <>
          <div className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Link your ABHA</h2>
            <p className="mb-3 text-xs text-muted-foreground">Create or link your Ayushman Bharat Health Account to bring your health records into one place.</p>
            <div className="space-y-2.5">
              {options.map((o, i) => (
                <motion.button key={o.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={linkFromOption}
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
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>This is a frontend prototype using mock data. No live ABDM integration.</p>
          </div>
        </>
      ) : (
        <>
          {/* Health records */}
          <section className="mt-5">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Health Records & Consent</h2>
            <div className="space-y-2">
              <RecordRow icon={FileText} label="Health Records" sub="Your linked records across facilities" onClick={() => setView("PATIENT_DOCUMENTS")} />
              <RecordRow icon={HeartHandshake} label="Consent Management" sub="Control who can view your records" onClick={() => setView("PATIENT_SETTINGS")} />
            </div>
          </section>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>This is a frontend prototype using mock data. No live ABDM integration.</p>
          </div>
        </>
      )}
    </PatientPageShell>
  );
}

function RecordRow({ icon: Icon, label, sub, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; sub: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left card-soft">
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Icon className="size-5" /></span>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <ArrowRight className="size-4 text-muted-foreground" />
    </button>
  );
}
