"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, Camera, FileText, Check, Upload, Loader2, ShieldCheck } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "scanning" | "review" | "sent";

export function ScanPrescriptionView() {
  const setView = useAppStore((s) => s.setView);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const [phase, setPhase] = useState<Phase>("idle");
  const [loading, setLoading] = useState(false);
  const [fields, setFields] = useState<{ label: string; value: string }[]>([]);

  const startScan = async () => {
    setPhase("scanning");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 2400));
    setLoading(false);
    setFields([
      { label: "Patient Name", value: patientProfile?.name ?? "Guest" },
      { label: "Date", value: "Aug 31, 2026" },
      { label: "Doctor", value: "—" },
      { label: "Medicine 1", value: "—" },
      { label: "Medicine 2", value: "—" },
      { label: "Instructions", value: "—" },
    ]);
    setPhase("review");
  };

  const submit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setPhase("sent");
  };

  return (
    <PatientPageShell title="Scan Prescription" currentTab="HOSPITAL_HOME" onBack={() => setView("HOSPITAL_HOME")}>
      <AnimatePresence mode="wait">
        {phase === "idle" && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center py-10 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ScanLine className="size-10" />
            </span>
            <h2 className="mt-5 text-lg font-bold">Scan your prescription</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Upload a photo of your prescription. AI will extract details and send it to the Doctor Desk for review.</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 w-full max-w-xs">
              <button onClick={startScan} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 card-soft">
                <Camera className="size-7 text-primary" />
                <span className="text-xs font-semibold">Take photo</span>
              </button>
              <button onClick={startScan} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-5 card-soft">
                <FileText className="size-7 text-primary" />
                <span className="text-xs font-semibold">Upload file</span>
              </button>
            </div>
          </motion.div>
        )}

        {phase === "scanning" && (
          <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col items-center py-16 text-center">
            <div className="relative flex size-24 items-center justify-center">
              <span className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <span className="absolute inset-2 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <ScanLine className="size-10 text-primary" />
            </div>
            <p className="mt-5 text-sm font-semibold">Scanning prescription…</p>
            <p className="mt-1 text-xs text-muted-foreground">Extracting text via OCR</p>
          </motion.div>
        )}

        {phase === "review" && (
          <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mb-3 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="font-semibold">Review extracted data</p>
              <p className="mt-0.5">Please verify the fields below before sending to Doctor Desk.</p>
            </div>
            <div className="space-y-2">
              {fields.map((f, i) => (
                <motion.div key={f.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card px-3.5 py-2.5 card-soft">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">{f.label}</p>
                  <input value={f.value} onChange={(e) => setFields((prev) => prev.map((p, j) => j === i ? { ...p, value: e.target.value } : p))}
                    className="mt-0.5 w-full bg-transparent text-sm outline-none" />
                </motion.div>
              ))}
            </div>
            <Button onClick={submit} className="mt-4 w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Sending…</> : <><Upload className="mr-2 size-4" /> Send to Doctor Desk</>}
            </Button>
            <button onClick={() => setPhase("idle")} className="mt-2 w-full text-center text-xs text-muted-foreground">Cancel</button>
          </motion.div>
        )}

        {phase === "sent" && (
          <motion.div key="sent" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <Check className="size-10" />
            </div>
            <h2 className="mt-5 text-lg font-bold">Prescription sent</h2>
            <p className="mt-1 text-sm text-muted-foreground">Your prescription has been sent to the Doctor Desk for review.</p>
            <Button onClick={() => setView("HOSPITAL_HOME")} className="mt-6">Back to home</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-6 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
        This is a simulated prescription scan for demo. No real OCR or ABDM integration is active.
      </div>
    </PatientPageShell>
  );
}
