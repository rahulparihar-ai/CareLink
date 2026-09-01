"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ScanLine, Sparkles, CheckCircle2, AlertTriangle, FileText,
  Pill, Stethoscope, Users, Info, ShieldAlert, Lock, ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { KioskProgress } from "./KioskProgress";
import { SUMMARY_SERVICE } from "@/services";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { PhysicianSummary } from "@/types";

export function KioskSummary() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const kiosk = useAppStore((s) => s.kioskSession);
  const setKioskPhase = useAppStore((s) => s.setKioskPhase);
  const setPhysicianSummary = useAppStore((s) => s.setPhysicianSummary);
  const [generating, setGenerating] = useState(true);
  const [error, setError] = useState(false);
  const [summary, setSummary] = useState<PhysicianSummary | null>(null);

  useEffect(() => {
    let mounted = true;
    const gen = async () => {
      try {
        const res = await SUMMARY_SERVICE.generate(
          kiosk?.patientId ?? "CL-2026-000124",
          kiosk?.clinicalHistory ?? null,
          kiosk?.documents ?? [],
          kiosk?.redFlags ?? [],
          kiosk?.historyMode ?? "allopathic",
          kiosk?.conversationTurns ?? []
        );
        setPhysicianSummary(res);
        if (mounted) {
          setSummary(res);
          setGenerating(false);
        }
      } catch {
        if (mounted) {
          setError(true);
          setGenerating(false);
        }
      }
    };
    gen();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    setKioskPhase("documents");
    setView("KIOSK_DOCUMENTS");
  };

  const handleConfirm = () => {
    setKioskPhase("complete");
    setView("KIOSK_COMPLETE");
  };

  return (
    <div className="app-shell min-h-dvh bg-card">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={handleBack} aria-label="Back" className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("kiosk.summaryHeader")}</p>
            <p className="text-xs text-muted-foreground">{t("kiosk.summaryStep")}</p>
          </div>
          <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ScanLine className="size-5" />
          </div>
        </div>
        <KioskProgress phase="summary" />
      </header>

      <div className="px-4 py-4 pb-28">
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <AlertTriangle className="size-9" />
            </div>
            <p className="mt-5 text-sm font-semibold">Could not generate the summary</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Something went wrong while synthesizing your history. Your data is safe.
            </p>
            <Button
              className="mt-6 h-12 w-full rounded-xl"
              onClick={() => {
                setError(false);
                setGenerating(true);
                setSummary(null);
                const gen = async () => {
                  try {
                    const res = await SUMMARY_SERVICE.generate(
                      kiosk?.patientId ?? "CL-2026-000124",
                      kiosk?.clinicalHistory ?? null,
                      kiosk?.documents ?? [],
                      kiosk?.redFlags ?? [],
                      kiosk?.historyMode ?? "allopathic",
                      kiosk?.conversationTurns ?? []
                    );
                    setPhysicianSummary(res);
                    setSummary(res);
                    setGenerating(false);
                  } catch {
                    setError(true);
                    setGenerating(false);
                  }
                };
                gen();
              }}
            >
              Try Again
            </Button>
          </div>
        ) : generating || !summary ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="flex size-20 items-center justify-center rounded-2xl bg-primary/10">
                <span className="size-9 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            </div>
            <p className="mt-5 text-sm font-semibold">Generating your clinical summary...</p>
            <p className="mt-1 text-xs text-muted-foreground">Synthesizing history, documents &amp; flags for your doctor</p>
            <div className="mt-4 flex gap-2">
              {["History", "Documents", "Red Flags", "Timeline"].map((s, i) => (
                <motion.span key={s} className="rounded-full bg-muted px-2.5 py-1 text-[10px] text-muted-foreground"
                  animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}>
                  {s}
                </motion.span>
              ))}
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Confirmation banner */}
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 card-soft">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Sparkles className="size-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-700">AI-Generated Draft</p>
                <p className="text-xs text-muted-foreground">
                  This is a draft for your doctor. The physician reviews, edits and confirms it — it is never an independent diagnosis.
                </p>
              </div>
            </div>

            {/* Red flags */}
            <SummarySection icon={ShieldAlert} iconTone="text-red-600 bg-red-500/10" title="Red Flags / Triage">
              <p className="font-medium text-red-700">{summary.redFlags}</p>
              {summary.redFlags.includes("URGENT") && (
                <p className="mt-1 text-xs text-red-600">This patient should be prioritized in the queue.</p>
              )}
            </SummarySection>

            {/* Chief complaint */}
            <SummarySection icon={Stethoscope} iconTone="text-primary bg-primary/10" title="Chief Complaint">
              <p className="text-sm font-medium">{summary.chiefComplaint}</p>
            </SummarySection>

            {/* HPI */}
            <SummarySection icon={Info} iconTone="text-sky-600 bg-sky-500/10" title="History of Present Illness">
              <p className="text-sm">{summary.hpi}</p>
            </SummarySection>

            {/* Past history */}
            <SummarySection icon={FileText} iconTone="text-violet-600 bg-violet-500/10" title="Past Medical History">
              <p className="text-sm">{summary.pastMedicalHistory}</p>
            </SummarySection>

            <SummarySection icon={FileText} iconTone="text-violet-600 bg-violet-500/10" title="Past Surgical History">
              <p className="text-sm">{summary.pastSurgicalHistory}</p>
            </SummarySection>

            {/* Meds & allergies */}
            <SummarySection icon={Pill} iconTone="text-emerald-600 bg-emerald-500/10" title="Current Medications">
              <p className="text-sm">{summary.currentMedications}</p>
            </SummarySection>
            <SummarySection icon={Pill} iconTone="text-red-600 bg-red-500/10" title="Allergies">
              <p className="text-sm">{summary.allergies}</p>
            </SummarySection>

            {/* Family & personal */}
            <SummarySection icon={Users} iconTone="text-amber-600 bg-amber-500/10" title="Family History">
              <p className="text-sm">{summary.familyHistory}</p>
            </SummarySection>
            <SummarySection icon={Users} iconTone="text-amber-600 bg-amber-500/10" title="Personal & Social History">
              <p className="text-sm">{summary.personalHistory}</p>
            </SummarySection>

            {/* Documents */}
            <SummarySection icon={FileText} iconTone="text-sky-600 bg-sky-500/10" title="Prior Documents">
              <p className="text-sm">{summary.documentSummary}</p>
            </SummarySection>
            <SummarySection icon={AlertTriangle} iconTone="text-amber-600 bg-amber-500/10" title="Investigation Highlights">
              <p className="text-sm">{summary.investigationHighlights}</p>
            </SummarySection>

            {/* AYUSH summary */}
            {summary.ayushSummary && (
              <SummarySection icon={Sparkles} iconTone="text-amber-600 bg-amber-500/10" title="AYUSH (Dashavidha Pariksha)">
                <p className="text-sm">{summary.ayushSummary}</p>
              </SummarySection>
            )}

            {/* Review of systems */}
            <SummarySection icon={Info} iconTone="text-sky-600 bg-sky-500/10" title="Review of Systems">
              <p className="text-sm">{summary.reviewOfSystems}</p>
            </SummarySection>

            {/* Source evidence / traceability */}
            {(summary.sourceEvidence?.length ?? 0) > 0 && (
              <SummarySection icon={FileText} iconTone="text-emerald-600 bg-emerald-500/10" title="Source Evidence & Traceability">
                <div className="space-y-2">
                  {summary.sourceEvidence.map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 border-t border-border/60 pt-2 first:border-0 first:pt-0">
                      <span
                        className={cn(
                          "mt-0.5 inline-block shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                          ev.status === "needs-verification"
                            ? "bg-amber-500/15 text-amber-700"
                            : "bg-emerald-500/15 text-emerald-700"
                        )}
                      >
                        {ev.status}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{ev.field}</p>
                        <p className="text-xs text-foreground/90">{ev.value}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {ev.source}
                          {typeof ev.confidence === "number" ? ` · ${Math.round(ev.confidence * 100)}% conf` : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </SummarySection>
            )}
          </motion.div>
        )}
      </div>

      {!generating && summary && (
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[640px] px-4 py-3">
          <div className="rounded-2xl border border-border bg-card/95 p-3 shadow-lg backdrop-blur-md">
            <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
              <Lock className="size-3.5 text-primary" />
              This summary will be shared with your doctor at this hospital. GDPR/DPDP compliant consent received.
            </div>
            <Button className="h-12 w-full rounded-xl" onClick={handleConfirm}>
              <CheckCircle2 className="size-4" /> Confirm &amp; Proceed to Consultation <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function SummarySection({ icon: Icon, iconTone, title, children }: {
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2.5 rounded-2xl border border-border bg-background p-3.5 card-soft">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", iconTone)}>
          <Icon className="size-4" />
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <div className="pl-[2.25rem]">{children}</div>
    </div>
  );
}

