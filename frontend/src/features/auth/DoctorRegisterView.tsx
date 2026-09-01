"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Stethoscope, Phone, ShieldCheck, CheckCircle2, UserRound, IdCard, Lock } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { generatePatientId } from "@/lib/brand/constants";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { getLanguageDir } from "@/lib/i18n/translations";
import { useTranslation } from "@/lib/i18n/useTranslation";

const STEPS = [
  { key: "identity" },
  { key: "credentials" },
  { key: "professional" },
  { key: "consent" },
  { key: "complete" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const SPECIALIZATIONS = [
  "General Medicine",
  "Ayurveda",
  "Cardiology",
  "Dermatology",
  "Gastroenterology",
  "Gynecology",
  "Neurology",
  "Ophthalmology",
  "Orthopedics",
  "Pediatrics",
  "Psychiatry",
  "ENT",
];

export function DoctorRegisterView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const loginMobile = useAppStore((s) => s.loginMobile);
  const loginDoctorId = useAppStore((s) => s.loginDoctorId);
  const setDoctorProfile = useAppStore((s) => s.setDoctorProfile);
  const addAuditEvent = useAppStore((s) => s.addAuditEvent);
  const language = useAppStore((s) => s.language);

  const [step, setStep] = useState<StepKey>("identity");
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    facility: "",
    professionalId: "",
    languages: "",
    experience: "",
    doctorId: loginDoctorId,
    password: "",
  });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [consentError, setConsentError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const goBack = () => {
    setConsentError("");
    if (stepIndex === 0) {
      setView("DOCTOR_LOGIN");
    } else {
      setStep(STEPS[stepIndex - 1].key);
    }
  };

  const goNext = () => {
    if (step === "identity" && !form.name.trim()) {
      setConsentError(t("onb.nameRequired"));
      return;
    }
    if (step === "credentials" && !form.doctorId.trim()) {
      setConsentError(t("doc.login.idRequired"));
      return;
    }
    if (step === "credentials" && !form.password) {
      setConsentError(t("doc.login.passRequired"));
      return;
    }
    if (step === "professional" && !form.specialization) {
      setConsentError(t("doc.reg.specRequired"));
      return;
    }
    setConsentError("");
    if (step === "consent" && !consentAccepted) {
      setConsentError(t("onb.consent.requireCheck"));
      return;
    }
    if (step === "consent") {
      finalize();
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].key);
    }
  };

  const finalize = () => {
    const doctorId = generatePatientId().replace("CL", "DR");
    const name = form.name.trim();
    const langs = form.languages.split(",").map((l) => l.trim()).filter(Boolean);
    setDoctorProfile({
      id: doctorId,
      name: name.startsWith("Dr") ? name : `Dr. ${name}`,
      specialization: form.specialization,
      facility: form.facility.trim(),
      mobileNumber: loginMobile,
      professionalId: form.professionalId.trim() || undefined,
      doctorId: form.doctorId.trim() || undefined,
      password: form.password || undefined,
      languages: langs,
      experience: form.experience.trim() || undefined,
    });
    addAuditEvent({
      id: doctorId + "-reg-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: name,
      role: "DOCTOR",
      action: "PROFILE_CREATED",
      detail: `Doctor registration completed · specialization=${form.specialization}`,
    });
    setStep("complete");
  };

  const finish = () => setView("DOCTOR_HOME");

  const dir = getLanguageDir(language);

  const inputCls =
    "w-full rounded-xl border border-input bg-card px-4 py-3 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card" dir={dir}>
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={goBack} aria-label="Back">
          <ChevronLeft />
        </Button>
        <div className="mx-auto">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6">
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => {
            const active = i <= stepIndex;
            const isCurrent = i === stepIndex;
            return (
              <div key={s.key} className="flex flex-1 items-center gap-1">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : active
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded-full ${i < stepIndex ? "bg-primary/40" : "bg-muted"}`} />
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-center">
          {STEPS.map((s) => (
            <span
              key={s.key}
              className={`flex-1 text-[10px] font-medium ${
                STEPS.indexOf(s) === stepIndex ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {t(`doc.reg.step.${s.key}`)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
          >
            {step === "identity" && (
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Stethoscope className="size-7" />
                </div>
                <h1 className="mt-4 text-2xl font-bold">{t("doc.reg.identityTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("doc.reg.identityHint")}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("doc.reg.name")}</label>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="e.g. Dr. Kavita Rao"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("doc.reg.specialization")}</label>
                    <select
                      value={form.specialization}
                      onChange={(e) => set("specialization", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">{t("doc.reg.specPlaceholder")}</option>
                      {SPECIALIZATIONS.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("doc.reg.facility")} <span className="text-xs text-muted-foreground">({t("onb.optional")})</span>
                    </label>
                    <input
                      value={form.facility}
                      onChange={(e) => set("facility", e.target.value)}
                      placeholder={t("doc.reg.facilityPlaceholder")}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "credentials" && (
              <div>
                <h1 className="text-2xl font-bold">{t("doc.reg.credentialsTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("doc.reg.credentialsHint")}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("doc.login.doctorId")}</label>
                    <div className="relative">
                      <IdCard className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={form.doctorId}
                        onChange={(e) => {
                          set("doctorId", e.target.value);
                          setConsentError("");
                        }}
                        placeholder="DOC-001"
                        className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("doc.login.password")}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => {
                          set("password", e.target.value);
                          setConsentError("");
                        }}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-12 text-base outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-primary"
                      >
                        {showPassword ? t("doc.login.hide") : t("doc.login.show")}
                      </button>
                    </div>
                  </div>
                  {consentError && <p className="text-sm text-destructive">{consentError}</p>}
                </div>
              </div>
            )}

            {step === "professional" && (
              <div>
                <h1 className="text-2xl font-bold">{t("doc.reg.professionalTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("doc.reg.professionalHint")}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("doc.reg.professionalId")}</label>
                    <input
                      value={form.professionalId}
                      onChange={(e) => set("professionalId", e.target.value)}
                      placeholder="Registration / council ID"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("doc.reg.experience")}</label>
                    <input
                      value={form.experience}
                      onChange={(e) => set("experience", e.target.value)}
                      placeholder="e.g. 8 years"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("doc.reg.languages")} <span className="text-xs text-muted-foreground">({t("onb.optional")})</span>
                    </label>
                    <input
                      value={form.languages}
                      onChange={(e) => set("languages", e.target.value)}
                      placeholder="English, Hindi, Urdu"
                      className={inputCls}
                    />
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                      <Phone className="size-5" />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold">+91 {loginMobile}</p>
                      <p className="text-xs text-muted-foreground">{t("auth.otp")} · verified</p>
                    </div>
                    <CheckCircle2 className="size-6 text-emerald-500" />
                  </div>
                </div>
              </div>
            )}

            {step === "consent" && (
              <div>
                <h1 className="text-2xl font-bold">{t("doc.reg.consentTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("doc.reg.consentHint")}</p>

                <div className="mt-5 space-y-3">
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                    <input
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => {
                        setConsentAccepted(e.target.checked);
                        setConsentError("");
                      }}
                      className="mt-0.5 size-5 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{t("doc.reg.consent.role")}</span>
                      <span className="block text-xs text-muted-foreground">{t("doc.reg.consent.roleHint")}</span>
                    </span>
                  </label>

                  <div className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                    <span className="w-full">
                      <span className="block text-sm font-medium">{t("doc.reg.consent.regDetails")}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {form.name.trim()} · {form.specialization}
                        {form.professionalId ? ` · ${form.professionalId}` : ""}
                      </span>
                    </span>
                  </div>
                  {consentError && <p className="text-sm text-destructive">{consentError}</p>}
                </div>
              </div>
            )}

            {step === "complete" && (
              <div className="flex flex-col items-center pt-6 text-center">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 14 }}
                  className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2 className="size-11" />
                </motion.div>
                <h1 className="mt-6 text-2xl font-bold">{t("doc.reg.complete.success")}</h1>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("doc.reg.complete.subtitle")}</p>

                <div className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="size-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{form.name.trim() || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.specialization} · {form.experience || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("doc.reg.previewFacility")}</p>
                      <p className="font-medium">{form.facility.trim() || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("doc.reg.previewMobile")}</p>
                      <p className="font-medium">+91 {loginMobile}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-border p-4 pb-safe">
        {step !== "complete" ? (
          <Button onClick={goNext} size="lg" className="h-14 w-full text-base">
            {step === "consent" ? t("doc.reg.create") : t("auth.continue")} <ChevronRight className="ml-1.5" />
          </Button>
        ) : (
          <Button onClick={finish} size="lg" className="h-14 w-full text-base">
            {t("doc.reg.finish")} <ChevronRight className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}