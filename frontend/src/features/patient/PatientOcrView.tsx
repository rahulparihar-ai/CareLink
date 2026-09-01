"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Save,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { runOcrPipeline, ocrSteps, type OcrStep } from "@/services/ocrService";
import { uid } from "@/lib/brand/constants";

const stepLabels: Record<OcrStep, string> = {
  uploading: "Uploading…",
  extracting_text: "Scanning document…",
  identifying_entities: "Extracting information…",
  organising: "Organising your health record…",
  done: "Done",
};

export function PatientOcrView() {
  const setView = useAppStore((s) => s.setView);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const addDocument = useAppStore((s) => s.addDocument);
  const addVaultDocument = useAppStore((s) => s.addVaultDocument);
  const [phase, setPhase] = useState<"idle" | "scanning" | "review" | "done">("idle");
  const [stepIdx, setStepIdx] = useState(0);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runOcrPipeline>> | null>(null);
  const [saving, setSaving] = useState(false);

  const startScan = async () => {
    setPhase("scanning");
    setStepIdx(0);
    try {
      const res = await runOcrPipeline();
      setResult(res);
      setPhase("review");
    } catch {
      setPhase("idle");
    }
  };

  const save = () => {
    setSaving(true);
    setTimeout(() => {
      const now = new Date().toISOString();
      addDocument({
        id: uid("doc"),
        type: result?.docType ?? "Lab Report",
        name: result?.title + ".pdf",
        dateStr: result?.date,
        hospital: result?.hospital,
        confidence: Math.round((result?.confidenceOverall ?? 0.9) * 100),
        status: "ready",
      });
      addVaultDocument({
        id: uid("vault"),
        patientId: patientProfile?.id ?? "",
        title: result?.title ?? "Document",
        type: result?.docType ?? "report",
        date: result?.date ?? "",
        hospital: result?.hospital,
        entities: [],
        confidenceOverall: result?.confidenceOverall ?? 0.9,
        source: "OCR",
        createdAt: now,
        updatedAt: now,
      });
      setSaving(false);
      setPhase("done");
    }, 1000);
  };

  return (
    <PatientPageShell
      title="Scan & Digitize"
      currentTab="PATIENT_DOCUMENTS"
      onBack={() => setView("PATIENT_DOCUMENTS")}
    >
      {phase === "idle" && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary"
          >
            <ScanLine className="size-10" />
          </motion.div>
          <h2 className="mt-5 text-lg font-bold">Upload a document</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Upload a prescription, lab report or other medical document to extract its information.
          </p>

          <label className="mt-8 flex w-full max-w-xs cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8">
            <Upload className="size-8 text-primary" />
            <span className="text-sm font-medium text-primary">Choose file</span>
            <span className="text-xs text-muted-foreground">PDF, JPG or PNG</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={startScan}
            />
          </label>
          <button
            onClick={startScan}
            className="mt-4 text-sm font-medium text-primary"
          >
            Use a demo document instead
          </button>
        </div>
      )}

      {phase === "scanning" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative flex size-24 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full border-4 border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <span className="absolute inset-2 rounded-full border-4 border-primary/30 border-t-primary"
              style={{ animation: "spin 1s linear infinite" }}
            />
            <ScanLine className="size-9 text-primary" />
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={stepIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-6 font-medium"
            >
              {stepLabels[ocrSteps[stepIdx]]}
            </motion.p>
          </AnimatePresence>
          <div className="mt-4 flex gap-1.5">
            {ocrSteps.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1.5 w-8 rounded-full transition-colors",
                  i <= stepIdx ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <Timer onTick={setStepIdx} running={phase === "scanning"} />
        </div>
      )}

      {phase === "review" && result && (
        <div>
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
            <AlertTriangle className="size-4 shrink-0" />
            AI/OCR Extracted — not clinician verified. Please review before use.
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{result.title}</p>
                <p className="text-xs text-muted-foreground">{result.docType} · {result.date} · {result.hospital}</p>
              </div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {Math.round(result.confidenceOverall * 100)}%
              </span>
            </div>
            <div className="mt-3 space-y-1.5">
              {result.fields.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                  <div>
                    <p className="text-xs text-muted-foreground">{f.label}</p>
                    <p className="text-sm font-medium">{f.value}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span
                      className={cn(
                        "flex items-center gap-1 text-xs font-medium",
                        f.needsVerification ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {f.needsVerification ? <AlertTriangle className="size-3" /> : <CheckCircle2 className="size-3" />}
                      {Math.round(f.confidence * 100)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {f.needsVerification ? "Review" : "AI/OCR"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={save} size="lg" className="mt-4 h-13 w-full text-base" disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Save className="mr-1.5 size-4" />}
            Save to health record
          </Button>
          <button onClick={startScan} className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <RotateCcw className="size-3.5" /> Scan another
          </button>
        </div>
      )}

      {phase === "done" && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600"
          >
            <CheckCircle2 className="size-10" />
          </motion.div>
          <h2 className="mt-5 text-lg font-bold">Saved to your health record</h2>
          <p className="mt-1 text-sm text-muted-foreground">Found in Documents & Health Timeline.</p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setView("PATIENT_DOCUMENTS")}>View Documents</Button>
            <Button onClick={() => setView("PATIENT_TIMELINE")}>View Timeline</Button>
          </div>
        </div>
      )}
    </PatientPageShell>
  );
}

function Timer({ onTick, running }: { onTick: (i: number) => void; running: boolean }) {
  useEffect(() => {
    if (!running) return;
    const steps = ocrSteps.length;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      onTick(i);
      if (i >= steps - 1) clearInterval(iv);
    }, 900);
    return () => clearInterval(iv);
  }, [running, onTick]);
  return null;
}
