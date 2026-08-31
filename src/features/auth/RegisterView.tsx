"use client";

import { motion } from "framer-motion";
import { ChevronLeft, User, Users } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { BRAND } from "@/lib/brand/constants";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { getLanguageDir } from "@/lib/i18n/translations";
import { useTranslation } from "@/lib/i18n/useTranslation";
import type { RegistrationMode } from "@/types";

export function RegisterView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const loginMobile = useAppStore((s) => s.loginMobile);
  const setPatientProfile = useAppStore((s) => s.setPatientProfile);
  const language = useAppStore((s) => s.language);
  const [mode, setMode] = useState<RegistrationMode>("self");
  const [isProxy, setIsProxy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    bloodGroup: "B+",
    emergencyName: "",
    emergencyPhone: "",
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const name = form.name.trim() || "Rahul Sharma";
    setPatientProfile({
      id: BRAND.demoPatientId,
      name,
      age: Number(form.age) || 34,
      gender: form.gender,
      mobileNumber: loginMobile,
      language: language,
      emergencyContact: form.emergencyName ? `${form.emergencyName} · ${form.emergencyPhone}` : "Priya Sharma · +91 9123456780",
      abhaStatus: isProxy ? "Not Linked" : "Linked",
      bloodGroup: form.bloodGroup || "B+",
      allergies: "Penicillin",
      currentMedicines: "Amlodipine 5mg",
      knownConditions: "Hypertension",
    });
    setView("PATIENT_HOME");
  };

  const dir = getLanguageDir(language);

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card" dir={dir}>
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("OTP")} aria-label="Back">
          <ChevronLeft />
        </Button>
        <div className="mx-auto">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <h1 className="text-2xl font-bold">{t("onb.create")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("onb.personalInfo")}</p>

        {/* Self vs family */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setMode("self");
              setIsProxy(false);
            }}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
              mode === "self" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <User className={`size-6 ${mode === "self" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">{t("onb.self")}</span>
          </button>
          <button
            onClick={() => {
              setMode("family");
              setIsProxy(true);
            }}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all ${
              mode === "family" ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <Users className={`size-6 ${mode === "family" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="text-sm font-medium">{t("onb.family")}</span>
          </button>
        </div>

        {isProxy && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
          >
            <p className="font-semibold">{t("intake.proxyActive")}</p>
            <p className="text-xs">{t("intake.proxyHint")}</p>
          </motion.div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              {isProxy ? t("onb.proxy.patientName") : t("onb.name")}
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Rahul Sharma"
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          {isProxy && (
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("onb.proxy.relation")}</label>
              <select
                value={form.gender === "proxy? " ? "family" : "family"}
                onChange={() => {}}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none"
              >
                <option value="family">{t("intake.familyMember")}</option>
                <option value="caregiver">{t("intake.caregiver")}</option>
                <option value="guardian">{t("intake.guardian")}</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("onb.age")}</label>
              <input
                inputMode="numeric"
                value={form.age}
                onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))}
                placeholder="34"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("onb.gender")}</label>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("onb.bloodGroup")}</label>
            <select
              value={form.bloodGroup}
              onChange={(e) => set("bloodGroup", e.target.value)}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none"
            >
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("onb.emergencyContact")}</label>
              <input
                value={form.emergencyName}
                onChange={(e) => set("emergencyName", e.target.value)}
                placeholder="Priya Sharma"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">&nbsp;</label>
              <input
                inputMode="tel"
                value={form.emergencyPhone}
                onChange={(e) => set("emergencyPhone", e.target.value.replace(/\D/g, ""))}
                placeholder="+91 9123456780"
                className="w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-border p-4 pb-safe">
        <Button onClick={submit} size="lg" className="h-14 w-full text-base">
          {t("onb.create")}
        </Button>
      </div>
    </div>
  );
}
