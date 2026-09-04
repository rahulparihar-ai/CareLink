"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, Keyboard, Hand, Clock, Globe, Shield,
  Leaf, AlertTriangle, Stethoscope,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";
import type { AyushInputMode } from "@/types/ayush";

export function AyushHistoryEntry() {
  const { t, language } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const startAyushSession = useAppStore((s) => s.startAyushSession);
  const ayushSession = useAppStore((s) => s.ayushSession);

  const [selectedMode, setSelectedMode] = useState<AyushInputMode>("voice");
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const hasCompletedSession = ayushSession?.phase === "complete";

  const modes = [
    { id: "voice" as AyushInputMode, icon: Mic, label: t("ayush.modeVoice"), desc: t("ayush.modeVoiceDesc") },
    { id: "text" as AyushInputMode, icon: Keyboard, label: t("ayush.modeText"), desc: t("ayush.modeTextDesc") },
    { id: "touch" as AyushInputMode, icon: Hand, label: t("ayush.modeTouch"), desc: t("ayush.modeTouchDesc") },
  ];

  const handleStart = () => {
    setShowConsent(true);
  };

  const handleConsent = () => {
    if (!consentChecked) return;
    startAyushSession({
      phase: "chief_complaint",
      inputMode: selectedMode,
      language,
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
    });
    setView("PATIENT_AYUSH_INTERVIEW");
  };

  if (showConsent) {
    return (
      <PatientPageShell title={t("ayush.title")} currentTab="PATIENT_AYUSH" onBack={() => setShowConsent(false)}>
        <div className="mx-auto max-w-lg space-y-5">
          {/* Consent Header */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center">
            <Shield className="mx-auto mb-3 size-10 text-primary" />
            <h2 className="text-lg font-bold">{t("ayush.consentTitle")}</h2>
          </div>

          {/* Consent Content */}
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("ayush.consentDescription")}
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {t("aiDisclaimer".includes("AI") ? "aiDisclaimer" : "ayush.consentAiAssists")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
                {t("ayush.consentNoDiagnosis")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-green-500" />
                {t("ayush.consentDoctorReview")}
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-blue-500" />
                {t("ayush.consentCanStop")}
              </li>
            </ul>
          </div>

          {/* Consent Checkbox */}
          <button
            onClick={() => setConsentChecked(!consentChecked)}
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left transition-colors hover:bg-muted/50"
          >
            <div className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors",
              consentChecked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
            )}>
              {consentChecked && <span className="text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm">{t("ayush.consentCheckbox")}</span>
          </button>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConsent(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              onClick={handleConsent}
              disabled={!consentChecked}
            >
              {t("ayush.consentStart")}
            </Button>
          </div>
        </div>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell title={t("ayush.title")} currentTab="PATIENT_AYUSH" onBack={() => setView("PATIENT_HOME")}>
      <div className="mx-auto max-w-lg space-y-5">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6"
        >
          <div className="absolute right-4 top-4 opacity-10">
            <Leaf className="size-20 text-primary" />
          </div>
          <div className="relative">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">{t("ayush.brand")}</p>
            <h1 className="text-xl font-bold leading-tight">{t("ayush.heroTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("ayush.heroSubtitle")}</p>
          </div>
        </motion.div>

        {/* Session Info */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
            <Globe className="size-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{t("ayush.infoLanguage")}</span>
            <span className="text-xs font-semibold">{language.toUpperCase()}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
            <Stethoscope className="size-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{t("ayush.infoInterview")}</span>
            <span className="text-xs font-semibold">{t("ayush.infoAyushOpd")}</span>
          </div>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-3">
            <Clock className="size-4 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">{t("ayush.infoTime")}</span>
            <span className="text-xs font-semibold">8-12 {t("ayush.minutes")}</span>
          </div>
        </div>

        {/* Input Mode Selection */}
        <div>
          <p className="mb-2.5 text-sm font-semibold">{t("ayush.selectMode")}</p>
          <div className="space-y-2">
            {modes.map((mode) => (
              <motion.button
                key={mode.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode(mode.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                  selectedMode === mode.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  selectedMode === mode.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <mode.icon className="size-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{mode.label}</p>
                  <p className="text-xs text-muted-foreground">{mode.desc}</p>
                </div>
                {selectedMode === mode.id && (
                  <div className="size-5 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center">✓</div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Previous Session */}
        {hasCompletedSession && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-3">
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <Shield className="size-4" />
              {t("ayush.previousSession")}
            </div>
          </div>
        )}

        {/* Start Button */}
        <Button className="w-full" size="lg" onClick={handleStart}>
          <Mic className="mr-2 size-5" />
          {t("ayush.startInterview")}
        </Button>

        {/* Safety Disclaimer */}
        <div className="flex items-start gap-2 rounded-xl bg-muted/50 p-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-relaxed text-muted-foreground">{t("ayush.safetyDisclaimer")}</p>
        </div>
      </div>
    </PatientPageShell>
  );
}
