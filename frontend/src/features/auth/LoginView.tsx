"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ArrowRight, Smartphone, User } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { validateMobile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function LoginView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const setLoginMobile = useAppStore((s) => s.setLoginMobile);
  const role = useAppStore((s) => s.role);
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const isDoctor = role === "DOCTOR";

  const submit = () => {
    if (!validateMobile(mobile)) {
      setError(t("auth.invalidMobile"));
      return;
    }
    setLoginMobile(mobile);
    setView("OTP");
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("ROLE_SELECT")} aria-label="Back">
          <ChevronLeft />
        </Button>
        <div className="mx-auto">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {isDoctor ? <User className="size-8" /> : <Smartphone className="size-8" />}
          </div>
          <h1 className="mt-5 text-2xl font-bold">
            {isDoctor ? t("auth.doctorLogin") : t("auth.patientLogin")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("auth.mobileHint")}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-8"
        >
          <label className="mb-1.5 block text-sm font-medium">{t("auth.mobile")}</label>
          <input
            inputMode="numeric"
            autoComplete="tel"
            maxLength={10}
            value={mobile}
            onChange={(e) => {
              setMobile(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            placeholder="98765 43210"
            className="w-full rounded-xl border border-input bg-card px-4 py-3.5 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-invalid={!!error}
          />
          {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
        </motion.div>
      </div>

      <div className="mt-auto p-6 pb-safe">
        <Button onClick={submit} size="lg" className="h-14 w-full text-base">
          {t("auth.continue")} <ArrowRight className="ml-1.5" />
        </Button>
        <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.termsHint")}</p>
      </div>
    </div>
  );
}
