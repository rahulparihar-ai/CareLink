"use client";

import { motion } from "framer-motion";
import { User, Stethoscope } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function RoleSelectView() {
  const { t } = useTranslation();
  const setRole = useAppStore((s) => s.setRole);
  const setView = useAppStore((s) => s.setView);

  const choose = (role: "PATIENT" | "DOCTOR") => {
    setRole(role);
    // Route based on role - straight into the right experience after login
    setView("LOGIN");
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center justify-between p-6">
        <CareLinkLogo size="sm" />
      </div>

      <div className="px-6 pt-4">
        <h1 className="text-2xl font-bold">{t("auth.roleSelect")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("auth.roleHint")}</p>
      </div>

      <div className="mt-8 flex flex-1 flex-col gap-4 px-6">
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => choose("PATIENT")}
          className="elevate group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 text-left card-soft"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-active:scale-95">
            <User className="size-7" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{t("auth.patient")}</p>
            <p className="text-sm text-muted-foreground">
              Access your health records, appointments, documents and AI health.
            </p>
          </div>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => choose("DOCTOR")}
          className="elevate group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 text-left card-soft"
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 transition-transform group-active:scale-95 dark:text-emerald-400">
            <Stethoscope className="size-7" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-semibold">{t("auth.doctor")}</p>
            <p className="text-sm text-muted-foreground">
              Manage your patient queue, clinical reviews, notes and prescriptions.
            </p>
          </div>
        </motion.button>

      </div>

      <div className="p-6 pb-safe">
        <button
          onClick={() => setView("LANGUAGE")}
          className="w-full text-center text-sm font-medium text-primary"
        >
          {t("auth.language")}
        </button>
      </div>
    </div>
  );
}
