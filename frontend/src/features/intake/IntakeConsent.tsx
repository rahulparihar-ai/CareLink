"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2, Check, X, ShieldCheck, ArrowLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { IntakeProgress } from "./IntakeProgress";
import { CONSENT_OPTIONS, CONSENT_SERVICE, type ConsentType } from "@/services";
import { cn } from "@/utils";
import { useTranslation } from "@/i18n/useTranslation";

export function IntakeConsent() {
  const setView = useAppStore((s) => s.setView);
  const intake = useAppStore((s) => s.intakeSession);
  const addConsentRecord = useAppStore((s) => s.addConsentRecord);
  const setIntakePhase = useAppStore((s) => s.setIntakePhase);
  const { t } = useTranslation();
  const [grants, setGrants] = useState<Record<string, boolean>>(
    Object.fromEntries(CONSENT_OPTIONS.map((c) => [c.type, c.defaultGranted]))
  );
  const [audioPlaying, setAudioPlaying] = useState<string | null>(null);

  const toggle = (type: ConsentType) => {
    if (type === "data_capture" || type === "document_scan" || type === "ai_analysis" || type === "his_share") return;
    setGrants((g) => ({ ...g, [type]: !g[type] }));
  };

  const playAudio = async (type: ConsentType) => {
    const opt = CONSENT_OPTIONS.find((c) => c.type === type);
    if (!opt) return;
    setAudioPlaying(type);
    await CONSENT_SERVICE.playAudio(opt.audio);
    setAudioPlaying(null);
  };

  const handleBack = () => {
    setIntakePhase("welcome");
    setView("INTAKE_HOME");
  };

  const handleContinue = () => {
    // Record consent for granted items
    CONSENT_OPTIONS.forEach((opt) => {
      if (grants[opt.type]) {
        addConsentRecord(
          CONSENT_SERVICE.createRecord(opt.type, intake?.patientId ?? "", true, intake?.language ?? "en")
        );
      }
    });
    setIntakePhase("history");
    setView("INTAKE_HISTORY");
  };

  return (
    <div className="app-shell min-h-dvh bg-card">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={handleBack} aria-label="Back" className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
            <ArrowLeft className="size-5" />
          </button>
<div>
            <p className="text-sm font-bold">{t("clinical.consentHeader")}</p>
            <p className="text-xs text-muted-foreground">{t("clinical.identifyStep")}</p>
          </div>
          <div className="ml-auto flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
        </div>
        <IntakeProgress phase="consent" />
      </header>

      <div className="px-4 py-4">
        {/* Security banner */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 card-soft">
<div className="flex items-center gap-2 text-emerald-600">
            <ShieldCheck className="size-5" />
            <p className="text-sm font-semibold">{t("clinical.consentProtected")}</p>
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {t("clinical.consentBodyLong")}
          </p>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
          className="mb-3 text-sm font-semibold">
          {t("clinical.consentReview")}
        </motion.p>

        <div className="space-y-2.5">
          {CONSENT_OPTIONS.map((opt, i) => {
            const granted = grants[opt.type];
            const locked = opt.type === "data_capture" || opt.type === "document_scan" || opt.type === "ai_analysis" || opt.type === "his_share";
            return (
              <motion.div key={opt.type} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-background p-3.5 card-soft">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggle(opt.type)}
                    disabled={locked}
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
                      granted ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      locked && "opacity-90"
                    )}
                    aria-label={`Toggle consent for ${opt.title}`}
                  >
                    {granted && <Check className="size-4" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{opt.title}</p>
                      {opt.required && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-semibold uppercase text-primary">{t("clinical.consentRequired")}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                  </div>
                  <button
                    onClick={() => playAudio(opt.type)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                    aria-label={t("clinical.consentListen")}
                  >
                    {audioPlaying === opt.type ? (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((b) => <motion.span key={b} className="w-0.5 bg-primary" animate={{ height: [4, 10, 4] }} transition={{ duration: 0.6, repeat: Infinity, delay: b * 0.15 }} />)}
                      </div>
                    ) : (
                      <Volume2 className="size-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

<div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
          <X className="size-3" /> {t("clinical.consentRevoke")}
        </div>
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <Button className="h-12 w-full rounded-xl text-sm font-semibold" onClick={handleContinue}>
          {t("clinical.accept")} <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

