"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Building2, CloudUpload, ShieldCheck, FileStack, Loader2,
  ArrowRight, Lock,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { CONSENT_SERVICE } from "@/services";
import { useTranslation } from "@/i18n/useTranslation";

export function IntakeComplete() {
  const setView = useAppStore((s) => s.setView);
  const intake = useAppStore((s) => s.intakeSession);
  const completeIntakeSession = useAppStore((s) => s.completeIntakeSession);
  const resetIntakeSession = useAppStore((s) => s.resetIntakeSession);
  const addCompletedCase = useAppStore((s) => s.addCompletedCase);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(true);
  const [reference, setReference] = useState("");
  const [step, setStep] = useState(0);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      completeIntakeSession();
      // Step 1: push to HIS
      setStep(1);
      const his = await CONSENT_SERVICE.pushToHis(intake?.summary?.id ?? "", true);
      // Step 2: link ABHA (simulated)
      await new Promise((r) => setTimeout(r, 800));
      setStep(2);
      // Step 3: clear session data
      await CONSENT_SERVICE.clearSessionData();
      setStep(3);
      if (mounted) {
        setReference(his.reference);
        setSubmitting(false);
      }
    };
    run();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

const steps = [
    { label: t("clinical.pushHis"), done: step >= 1 },
    { label: t("clinical.linkAbha"), done: step >= 2 },
    { label: t("clinical.clearData"), done: step >= 3 },
  ];

const handleDone = () => {
    // Enqueue the completed case for the doctor dashboard before clearing.
    if (intake) {
      const level = intake.redFlags.some((r) => r.triggered && r.level === "URGENT")
        ? ("URGENT" as const)
        : intake.redFlags.some((r) => r.triggered)
          ? ("NEEDS_REVIEW" as const)
          : ("NORMAL" as const);
      addCompletedCase({
        id: intake.id,
        patientId: intake.patientId ?? patientProfile?.id ?? `PT-${Date.now()}`,
        name: patientProfile?.name ?? "Walk-in patient",
        age: patientProfile?.age ?? 0,
        gender: patientProfile?.gender ?? "—",
        chiefComplaint: intake.summary?.chiefComplaint ?? (intake.clinicalHistory?.chiefComplaint || "History captured"),
        status: level === "URGENT" ? "URGENT" : "WAITING",
        redFlagLevel: level,
        language: intake.language,
        source: "intake",
        historyCompletion: 100,
        summaryStatus: "pending",
        consent: intake.consentRecords.length > 0,
        aiSummary: intake.summary
          ? {
              chiefComplaint: intake.summary.chiefComplaint,
              hpi: intake.summary.hpi,
              allergies: intake.summary.allergies,
              medications: intake.summary.currentMedications,
              familyHistory: intake.summary.familyHistory,
              redFlags: intake.summary.redFlags,
              generatedAt: intake.summary.generatedAt,
            }
          : undefined,
      });
    }
    resetIntakeSession();
    setView("HOSPITAL_HOME");
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card px-5 pb-8 pt-16">
      {submitting ? (
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative">
            <div className="flex size-24 items-center justify-center rounded-2xl bg-primary/10">
              <span className="size-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </div>
          <p className="mt-6 text-lg font-bold">{t("clinical.completing")}</p>
          <div className="mt-6 w-full max-w-xs space-y-3">
            {steps.map((s) => (
              <div key={s.label} className={s.done ? "opacity-100" : s.label === steps[Math.min(step, 2)].label ? "opacity-100" : "opacity-40"}>
                <div className="flex items-center gap-2.5 rounded-xl bg-muted/60 p-3 text-sm">
                  {s.done ? <CheckCircle2 className="size-4 text-emerald-600" /> :
                    s.label === steps[Math.min(step, 2)].label && !s.done ? <Loader2 className="size-4 animate-spin text-primary" /> :
                    <span className="size-4" />}
                  <span className="text-muted-foreground">{s.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-1 flex-col items-center justify-center text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="flex size-24 items-center justify-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-14 text-emerald-600" />
          </motion.div>
<h1 className="mt-6 text-2xl font-bold">{t("clinical.allSet")}</h1>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            {t("clinical.allSetBody")}
          </p>

          {/* Reference */}
          <div className="mt-6 w-full rounded-2xl border border-border bg-background p-4 card-soft">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Building2 className="size-4 text-primary" /> {t("clinical.reference")}
            </div>
            <p className="mt-1 text-lg font-bold text-primary">{reference}</p>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <CloudUpload className="size-4 text-emerald-600" /> {t("clinical.pushedHis")}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-600" /> {t("clinical.linkedAbha")}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="size-4 text-primary" /> {t("clinical.sessionCleared")}
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
              <FileStack className="size-4 text-violet-600" /> {intake?.documents?.length ?? 0} {t("clinical.documentsDigitized")}
            </div>
          </div>

          {intake?.redFlags?.some((r) => r.triggered && r.level === "URGENT") && (
            <div className="mt-4 w-full rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-left card-soft">
              <p className="text-xs font-bold text-red-700">⚠ {t("clinical.priorityFlag")}</p>
              <p className="mt-0.5 text-xs text-red-600/80">{t("clinical.priorityBody")}</p>
            </div>
          )}

          <Button className="mt-8 h-12 w-full rounded-xl" onClick={handleDone}>
            {t("clinical.returnHospital")} <ArrowRight className="size-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}

