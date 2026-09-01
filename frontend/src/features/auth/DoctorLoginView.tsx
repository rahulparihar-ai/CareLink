"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ArrowRight, Stethoscope, IdCard, Lock, ShieldCheck, Info } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { doctorLoginDestination } from "@/lib/routing";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";

const DEMO_DOCTOR_ID = "DOC-001";
const DEMO_PASSWORD = "hospital123";

export function DoctorLoginView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const setRole = useAppStore((s) => s.setRole);
  const setLoginDoctorId = useAppStore((s) => s.setLoginDoctorId);
  const doctorProfile = useAppStore((s) => s.doctorProfile);

  const [doctorId, setDoctorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const confirmLogin = () => {
    const id = doctorId.trim();
    if (!id) {
      setError(t("doc.login.idRequired"));
      return;
    }
    if (!password) {
      setError(t("doc.login.passRequired"));
      return;
    }

    // Hospital-issued credentials. In a demo, a returning doctor may use their
    // saved credentials, otherwise fall back to the sample hospital-issued pair.
    const matchesStored =
      doctorProfile && doctorProfile.doctorId === id && doctorProfile.password === password;
    if (!matchesStored && !(id === DEMO_DOCTOR_ID && password === DEMO_PASSWORD)) {
      setError(t("doc.login.invalid"));
      return;
    }

    setRole("DOCTOR");
    setLoginDoctorId(id);
    setView(doctorLoginDestination(doctorProfile != null));
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("WELCOME")} aria-label="Back">
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
            <Stethoscope className="size-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">{t("doc.login.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("doc.login.hint")}</p>
        </motion.div>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-primary">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            {t("doc.login.demoPrefix")} {DEMO_DOCTOR_ID} · {DEMO_PASSWORD}
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("doc.login.doctorId")}</label>
            <div className="relative">
              <IdCard className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={doctorId}
                onChange={(e) => {
                  setDoctorId(e.target.value);
                  setError("");
                }}
                placeholder="DOC-001"
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("doc.login.password")}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-12 text-base outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-primary"
                aria-label={showPassword ? t("doc.login.hide") : t("doc.login.show")}
              >
                {showPassword ? t("doc.login.hide") : t("doc.login.show")}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </motion.div>
      </div>

      <div className="mt-auto p-6 pb-safe">
        <Button onClick={confirmLogin} size="lg" className="h-14 w-full text-base">
          {t("doc.login.continue")} <ArrowRight className="ml-1.5" />
        </Button>
        <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" /> {t("doc.login.secureHint")}
        </p>
      </div>
    </div>
  );
}