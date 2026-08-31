"use client";

import { motion } from "framer-motion";
import { Globe, Accessibility, HelpCircle, ArrowRight, User, Stethoscope } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function WelcomeView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);

  return (
    <div className="app-shell relative flex min-h-dvh flex-col overflow-hidden bg-card">
      <div className="hero-glow absolute inset-0" aria-hidden />

      <div className="relative flex flex-1 flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <CareLinkLogo size="lg" withWordmark={false} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-3xl font-bold tracking-tight"
        >
          Care<span className="text-primary">Link</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-2 text-muted-foreground"
        >
          {t("app.tagline")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-10 flex w-full max-w-xs flex-col gap-3"
        >
          <button
            onClick={() => setView("LOGIN")}
            className="flex h-14 items-center justify-center gap-2.5 rounded-2xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
          >
            <User className="size-5" />
            {t("auth.patientLogin")}
          </button>
          <button
            onClick={() => setView("LOGIN")}
            className="flex h-14 items-center justify-center gap-2.5 rounded-2xl border border-border bg-card text-base font-semibold text-foreground transition-transform active:scale-[0.98]"
          >
            <Stethoscope className="size-5" />
            {t("auth.doctorLogin")}
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="relative mb-8 flex justify-center gap-2"
      >
        {[
          { icon: Globe, label: t("auth.language"), view: "LANGUAGE" as const },
          { icon: Accessibility, label: t("auth.accessibility"), view: "PATIENT_SETTINGS" as const },
          { icon: HelpCircle, label: t("auth.help"), view: "PATIENT_SETTINGS" as const },
        ].map(({ icon: Icon, label, view }) => (
          <button
            key={label}
            onClick={() => setView(view)}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </motion.div>
    </div>
  );
}
