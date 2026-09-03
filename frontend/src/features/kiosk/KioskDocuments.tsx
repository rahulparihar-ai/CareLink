"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, FileText, Pill, FlaskConical, Film, FileStack, Camera,
  Check, AlertTriangle, Loader2, ChevronRight, Sparkles, Clock,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { KioskProgress } from "./KioskProgress";
import { DOCUMENT_INTELLIGENCE, type ScanSource } from "@/services";
import { cn } from "@/utils";
import { useTranslation } from "@/i18n/useTranslation";
import type { DocumentIntelligence } from "@/types";

type Phase = "idle" | "scanning" | "review" | "done" | "error";

const SCAN_TYPES: { type: ScanSource; label: string; icon: React.ComponentType<{ className?: string }>; tone: string }[] = [
  { type: "prescription", label: "Prescription", icon: Pill, tone: "bg-primary/10 text-primary" },
  { type: "lab_report", label: "Lab Report", icon: FlaskConical, tone: "bg-violet-500/10 text-violet-600" },
  { type: "discharge_summary", label: "Discharge Summary", icon: FileText, tone: "bg-emerald-500/10 text-emerald-600" },
  { type: "imaging", label: "Imaging", icon: Film, tone: "bg-amber-500/10 text-amber-600" },
];

const PIPELINE_STEPS = ["Capturing document", "Running OCR", "Extracting medical entities", "Organising into timeline"];

export function KioskDocuments() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const kiosk = useAppStore((s) => s.kioskSession);
  const setKioskPhase = useAppStore((s) => s.setKioskPhase);
  const addKioskDocument = useAppStore((s) => s.addKioskDocument);

  const [phase, setPhase] = useState<Phase>("idle");
  const [currentDoc, setCurrentDoc] = useState<DocumentIntelligence | null>(null);
  const [docs, setDocs] = useState<DocumentIntelligence[]>(kiosk?.documents ?? []);
  const [stepIdx, setStepIdx] = useState(0);
  const [scanType, setScanType] = useState<ScanSource>("prescription");
  const [verifySet, setVerifySet] = useState<Set<number>>(new Set());

  const toggleVerify = (idx: number) => {
    setVerifySet((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleScan = async (type: ScanSource) => {
    setScanType(type);
    setPhase("scanning");
    setStepIdx(0);
    setVerifySet(new Set());
    try {
      for (let i = 0; i < PIPELINE_STEPS.length; i++) {
        await new Promise((r) => setTimeout(r, 600));
        setStepIdx(i + 1);
      }
      const res = await DOCUMENT_INTELLIGENCE.process(type);
      setCurrentDoc(res.document);
      setPhase("review");
    } catch {
      setPhase("error");
    }
  };

  const handleAdd = () => {
    if (!currentDoc) return;
    const stamped: DocumentIntelligence = {
      ...currentDoc,
      entities: currentDoc.entities.map((e, i) => ({
        ...e,
        needsVerification: verifySet.has(i) ? true : e.needsVerification,
      })),
    };
    addKioskDocument(stamped);
    const next = [...docs, stamped];
    setDocs(next);
    setVerifySet(new Set());
    setCurrentDoc(null);
    setPhase("idle");
  };

  const handleContinue = () => {
    setKioskPhase("summary");
    setView("KIOSK_SUMMARY");
  };

  const handleBack = () => {
    setKioskPhase("history");
    setView("KIOSK_HISTORY");
  };

  return (
    <div className="app-shell min-h-dvh bg-card">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={handleBack} aria-label="Back" className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("kiosk.docsHeader")}</p>
            <p className="text-xs text-muted-foreground">{t("kiosk.docsStep")}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileStack className="size-5" />
          </div>
        </div>
        <KioskProgress phase="documents" />
      </header>

      <div className="px-4 py-4">
        {/* Scan type selector */}
        {phase === "idle" && (
          <>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-3 text-sm font-semibold">
              Upload your previous medical documents
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
              className="mb-3 text-xs text-muted-foreground">
              Scan prescriptions, lab reports and discharge summaries. AI digitizes, structures and orders them chronologically for your doctor.
            </motion.p>
            <div className="grid grid-cols-2 gap-2.5">
              {SCAN_TYPES.map((s, i) => (
                <motion.button key={s.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  whileTap={{ scale: 0.97 }} onClick={() => handleScan(s.type)}
                  className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-background p-4 card-soft">
                  <span className={cn("flex size-11 items-center justify-center rounded-xl", s.tone)}>
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-sm font-semibold">{s.label}</span>
                  <span className="text-[11px] text-muted-foreground">Tap to scan</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              <Camera className="mt-0.5 size-4 shrink-0 text-primary" />
              Documents are scanned and processed securely within this platform. You&apos;ve granted consent for digitization.
            </div>
          </>
        )}

        {/* Scanning pipeline */}
        {phase === "scanning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
            <div className="flex flex-col items-center">
              <div className="relative flex size-24 items-center justify-center rounded-2xl bg-primary/10">
                <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
                <Camera className="size-10 text-primary" />
              </div>
              <p className="mt-4 text-sm font-semibold">Scanning {scanType.replace("_", " ")}...</p>
              <div className="mt-4 w-full space-y-2">
                {PIPELINE_STEPS.map((s, i) => (
                  <div key={s} className={cn("flex items-center gap-2 rounded-xl p-2.5 text-xs transition-colors",
                    i < stepIdx ? "bg-emerald-500/5 text-emerald-700" : i === stepIdx ? "bg-primary/5 text-primary" : "text-muted-foreground")}>
                    {i < stepIdx ? <Check className="size-4 text-emerald-600" /> :
                      i === stepIdx ? <Loader2 className="size-4 animate-spin" /> : <span className="size-4" />}
                    <span className="flex items-center gap-1.5"><Sparkles className="size-3 opacity-60" />{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Scan error */}
        {phase === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <AlertTriangle className="size-8" />
            </div>
            <p className="mt-4 text-sm font-semibold">Scan could not be processed</p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              The document could not be read. Please adjust the document and try again, or skip digitization.
            </p>
            <Button variant="outline" className="mt-5 h-11 w-full" onClick={() => setPhase("idle")}>
              Retry
            </Button>
          </motion.div>
        )}

        {/* Review extracted */}
        {phase === "review" && currentDoc && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Extracted Information</p>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3.5 text-primary" /> AI Extracted
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-background card-soft overflow-hidden">
              <div className="border-b border-border bg-muted/40 px-4 py-2.5">
                <p className="text-sm font-semibold">{currentDoc.originalName}</p>
                <p className="text-xs text-muted-foreground">Confidence {Math.round(currentDoc.ocrConfidence * 100)}%</p>
              </div>
              <div className="divide-y divide-border/60">
                {currentDoc.entities.map((e, i) => {
                  const needsVerify = verifySet.has(i);
                  return (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between gap-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <span className="mr-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-semibold uppercase text-muted-foreground">{e.type}</span>
                        <span className="text-sm">{e.value}</span>
                        <span className="ml-1.5 text-[10px] text-muted-foreground">({Math.round(e.confidence * 100)}%)</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {e.flag && (
                          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            e.flag === "high" || e.flag === "critical" ? "bg-red-500/15 text-red-600" :
                            e.flag === "low" ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700")}>
                            {e.flag}
                          </span>
                        )}
                        <button
                          onClick={() => toggleVerify(i)}
                          className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors",
                            needsVerify
                              ? "bg-amber-500/20 text-amber-700"
                              : "bg-muted text-muted-foreground hover:bg-amber-500/10 hover:text-amber-700")}
                          aria-pressed={needsVerify}
                        >
                          {needsVerify ? "Needs check" : "Verify"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Abnormalities */}
            {currentDoc.abnormalities.length > 0 && (
              <div className="mt-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-amber-700">
                  <AlertTriangle className="size-3.5" /> Abnormal values flagged
                </p>
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs text-amber-700/80">
                  {currentDoc.abnormalities.map((a) => <li key={a}>{a}</li>)}
                </ul>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button variant="outline" className="h-12 flex-1" onClick={() => { setCurrentDoc(null); setVerifySet(new Set()); setPhase("idle"); }}>
                Rescan
              </Button>
              <Button className="h-12 flex-1" onClick={handleAdd}>
                <Check className="size-4" /> Save
              </Button>
            </div>
          </motion.div>
        )}

        {(phase === "idle" || phase === "review") && (
          <>
            {docs.length > 0 && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold">Digitized documents</p>
                <div className="space-y-2">
                  {docs.map((d) => (
                    <div key={d.id} className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5">
                      <CheckCircle className="size-4 shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{d.originalName}</p>
                        <p className="flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="size-3" /> {d.chronologicalDate} · {Math.round(d.ocrConfidence * 100)}% confidence</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="sticky bottom-0 mt-5 bg-card pb-3 pt-2">
              <Button className="h-12 w-full rounded-xl" onClick={handleContinue}>
                {docs.length > 0 ? <>Generate Clinical Summary <ChevronRight className="size-4" /></> : <>Skip &amp; Generate Summary <ChevronRight className="size-4" /></>}
              </Button>
            </div>
          </>
        )}

        <AnimatePresence />
      </div>
    </div>
  );
}

function CheckCircle({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;
}

