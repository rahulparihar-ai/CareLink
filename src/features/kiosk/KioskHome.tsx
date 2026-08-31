"use client";

import { motion } from "framer-motion";
import {
  ScanFace, Building2, Mic, Hand, MessageSquareText,
  ArrowLeft, Sparkles, ShieldCheck,
} from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { SUPPORTED_LANGUAGES } from "@/lib/i18n/translations";

export function KioskHome() {
  const setView = useAppStore((s) => s.setView);
  const startKioskSession = useAppStore((s) => s.startKioskSession);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const beginFlow = () => {
    startKioskSession({ phase: "consent" });
    setView("KIOSK_IDENTIFY");
  };

  return (
    <div className="app-shell min-h-dvh bg-card">
      <div className="flex min-h-dvh flex-col px-5 pb-10 pt-12">
        {/* Back to hospital */}
        <button onClick={() => setView("HOSPITAL_HOME")} className="mb-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <ArrowLeft className="size-4" /> Back to Hospital Hub
        </button>

        <CareLinkLogo size="md" />

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-3xl font-bold leading-tight"
        >
          MediKiosk
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mt-1.5 flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <Sparkles className="size-4 text-primary" />
          AI-powered clinical history &amp; document digitization
        </motion.p>

        {/* Feature badges */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="mt-4 flex flex-wrap gap-2">
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Mic className="size-3" /> Voice
          </span>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Hand className="size-3" /> Touch
          </span>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <MessageSquareText className="size-3" /> 13 Languages
          </span>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
            <ShieldCheck className="size-3" /> ABDM Ready
          </span>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl border border-border bg-background p-4 card-soft">
          <p className="mb-3 text-sm font-semibold">Complete your history before the doctor&apos;s consultation</p>
          <div className="space-y-2.5 text-[13px] text-muted-foreground">
            <StepRow n="1" text="Answer a few questions by voice or touch" />
            <StepRow n="2" text="Scan your prescriptions & lab reports" />
            <StepRow n="3" text="AI organizes a summary for your doctor" />
            <StepRow n="4" text="Your doctor reviews it in seconds" />
          </div>
        </motion.div>

        {/* Start */}
        <div className="mt-6">
          <Button className="h-14 w-full rounded-xl text-base font-semibold" onClick={beginFlow}>
            <ScanFace className="size-5" /> Start AI History Capture
          </Button>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3.5" /> Uses ABHA / Aadhaar or new registration · consent-first
          </div>
        </div>

        {/* Language select */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold">Select language</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {SUPPORTED_LANGUAGES.slice(0, 8).map((l) => (
              <button key={l.code} onClick={() => setLanguage(l.code)} dir={l.dir}
                className="shrink-0 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary">
                {l.nativeName}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Building2 className="size-3.5" /> CareLink Health Network · ABDM
        </div>
      </div>
    </div>
  );
}

function StepRow({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{n}</span>
      <span>{text}</span>
    </div>
  );
}

