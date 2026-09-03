"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User, Users, ShieldCheck, CheckCircle2, UserRound } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { generatePatientId } from "@/lib/brand/constants";
import { validateMobile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { getLanguageDir } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import type { RegistrationMode } from "@/types";

const STEPS = [
  { key: "mobile" },
  { key: "identity" },
  { key: "profile" },
  { key: "consent" },
  { key: "account" },
  { key: "complete" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

export function RegisterView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const loginMobile = useAppStore((s) => s.loginMobile);
  const setPatientProfile = useAppStore((s) => s.setPatientProfile);
  const language = useAppStore((s) => s.language);
  const addAuditEvent = useAppStore((s) => s.addAuditEvent);
  const aadhaarVerified = useAppStore((s) => s.aadhaarVerified);
  const aadhaarReference = useAppStore((s) => s.aadhaarReference);

  const [step, setStep] = useState<StepKey>("identity");
  const [mode, setMode] = useState<RegistrationMode>("self");
  const [isProxy, setIsProxy] = useState(false);
  const [relation, setRelation] = useState("family");

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Male",
    dob: "",
    email: "",
    address: "",
    bloodGroup: "",
    emergencyName: "",
    emergencyPhone: "",
    knownConditions: "",
    currentMeds: "",
    allergies: "",
    mobile: loginMobile,
  });
  const [abhaLink, setAbhaLink] = useState(true);
  const [shareRecords, setShareRecords] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [consentError, setConsentError] = useState("");

  const [account, setAccount] = useState({ password: "", confirm: "" });
  const setAcc = (k: keyof typeof account, v: string) => setAccount((a) => ({ ...a, [k]: v }));

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  const goBack = () => {
    setConsentError("");
    if (stepIndex === 0) {
      setView("OTP");
    } else {
      setStep(STEPS[stepIndex - 1].key);
    }
  };

  const goNext = () => {
    if (step === "mobile") {
      if (!validateMobile(form.mobile.trim())) {
        setConsentError(t("onb.mobileInvalid"));
        return;
      }
    }
    if (step === "identity") {
      const missing: string[] = [];
      if (!form.name.trim()) missing.push("name");
      if (!form.dob.trim()) missing.push("dob");
      if (!form.gender.trim()) missing.push("gender");
      if (!form.email.trim()) missing.push("email");
      if (!form.address.trim()) missing.push("address");
      if (missing.length > 0) {
        setConsentError(t("onb.completeRequired"));
        return;
      }
    }
    setConsentError("");
    if (step === "consent" && !termsAccepted) {
      setConsentError(t("onb.consent.requireCheck"));
      return;
    }
    if (step === "account") {
      if (!account.password || account.password.length < 6) {
        setConsentError(t("dreg.account.passShort"));
        return;
      }
      if (account.password !== account.confirm) {
        setConsentError(t("dreg.account.passMismatch"));
        return;
      }
      finalizeProfile();
      return;
    }
    if (stepIndex < STEPS.length - 1) {
      setStep(STEPS[stepIndex + 1].key);
    }
  };

  const finalizeProfile = () => {
    const name = form.name.trim();
    const patientId = generatePatientId();
    const dob = form.dob.trim();
    const ageFromDob = dob
      ? Math.max(0, Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))
      : Number(form.age) || 0;
    setPatientProfile({
      id: patientId,
      name,
      age: ageFromDob,
      gender: form.gender,
      dateOfBirth: dob || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      mobileNumber: form.mobile.trim() || loginMobile,
      password: account.password || undefined,
      language: language,
      emergencyContact: form.emergencyName
        ? `${form.emergencyName}${form.emergencyPhone ? ` · ${form.emergencyPhone}` : ""}`
        : undefined,
      abhaStatus: abhaLink || aadhaarVerified ? "Linked" : "Not Linked",
      abhaReference: aadhaarReference || undefined,
      aadhaarVerified: abhaLink || aadhaarVerified ? true : undefined,
      bloodGroup: form.bloodGroup || undefined,
      allergies: form.allergies || undefined,
      currentMedicines: form.currentMeds || undefined,
      knownConditions: form.knownConditions || undefined,
    });
    addAuditEvent({
      id: patientId + "-reg-" + Date.now(),
      timestamp: new Date().toISOString(),
      actor: name,
      role: "PATIENT",
      action: "PROFILE_CREATED",
      detail: `Registration completed · mode=${mode} · abha=${abhaLink ? "linked" : "skip"}`,
    });
    setStep("complete");
  };

  const getStarted = () => setView("PATIENT_HOME");

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

      {/* Stepper */}
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
              {t(`onb.step.${s.key}`)}
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
                <h1 className="text-2xl font-bold">{t("onb.step.identityTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("onb.step.identityHint")}</p>

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
                      {isProxy ? t("onb.proxy.patientName") : t("onb.name")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Your full name"
                      className={inputCls}
                    />
                  </div>

                  {isProxy && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">{t("onb.proxy.relation")}</label>
                      <select
                        value={relation}
                        onChange={(e) => setRelation(e.target.value)}
                        className={inputCls}
                      >
                        <option value="family">{t("intake.familyMember")}</option>
                        <option value="caregiver">{t("intake.caregiver")}</option>
                        <option value="guardian">{t("intake.guardian")}</option>
                      </select>
                      <p className="mt-1 text-xs text-muted-foreground">{t("onb.relationHint")}</p>
                    </div>
                  )}

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {isProxy ? t("onb.proxy.dob") : t("onb.dob")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => set("dob", e.target.value)}
                      max={new Date().toISOString().slice(0, 10)}
                      className={inputCls}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        {isProxy ? t("onb.proxy.age") : t("onb.age")}
                      </label>
                      <input
                        inputMode="numeric"
                        value={form.age}
                        onChange={(e) => set("age", e.target.value.replace(/\D/g, ""))}
                        placeholder="34"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        {isProxy ? t("onb.proxy.gender") : t("onb.gender")} <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => set("gender", e.target.value)}
                        className={inputCls}
                      >
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("onb.email")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="name@example.com"
                      autoComplete="email"
                      className={inputCls}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("onb.address")} <span className="text-destructive">*</span>
                    </label>
                    <input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder={t("onb.addressPlaceholder")}
                      autoComplete="street-address"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "mobile" && (
              <div className="flex flex-col pt-4">
                <h1 className="text-2xl font-bold">{t("onb.step.mobileTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("onb.step.mobileHint")}</p>

                <div className="mt-6">
                  <label className="mb-1.5 block text-sm font-medium">{t("auth.mobile")}</label>
                  <div className="flex items-center gap-2">
                    <span className="rounded-xl border border-input bg-muted px-3 py-3 text-base font-medium text-muted-foreground">
                      +91
                    </span>
                    <input
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={(e) => {
                        set("mobile", e.target.value.replace(/\D/g, ""));
                        setConsentError("");
                      }}
                      placeholder="98765 43210"
                      className={inputCls}
                    />
                  </div>
                  {consentError && <p className="mt-1.5 text-sm text-destructive">{consentError}</p>}
                </div>

                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold">{t("onb.mobileVerified")}</p>
                    <p className="text-xs text-muted-foreground">{t("auth.otp")} · verified</p>
                  </div>
                  <CheckCircle2 className="size-6 text-emerald-500" />
                </div>
              </div>
            )}

            {step === "profile" && (
              <div>
                <h1 className="text-2xl font-bold">{t("onb.step.profileTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("onb.step.profileHint")}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("onb.bloodGroup")}</label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => set("bloodGroup", e.target.value)}
                      className={inputCls}
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                        <option key={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        {t("onb.emergencyContact")} <span className="text-xs text-muted-foreground">({t("onb.optional")})</span>
                      </label>
                      <input
                        value={form.emergencyName}
                        onChange={(e) => set("emergencyName", e.target.value)}
                        placeholder="Emergency contact name"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">&nbsp;</label>
                      <input
                        inputMode="tel"
                        value={form.emergencyPhone}
                        onChange={(e) => set("emergencyPhone", e.target.value.replace(/\D/g, ""))}
                        placeholder="+91 9123456780"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("onb.knownConditions")} <span className="text-xs text-muted-foreground">({t("onb.optional")})</span>
                    </label>
                    <input
                      value={form.knownConditions}
                      onChange={(e) => set("knownConditions", e.target.value)}
                      placeholder="Hypertension"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("onb.currentMeds")} <span className="text-xs text-muted-foreground">({t("onb.optional")})</span>
                    </label>
                    <input
                      value={form.currentMeds}
                      onChange={(e) => set("currentMeds", e.target.value)}
                      placeholder="e.g. Medicine 50mg"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">
                      {t("onb.allergies")} <span className="text-xs text-muted-foreground">({t("onb.optional")})</span>
                    </label>
                    <input
                      value={form.allergies}
                      onChange={(e) => set("allergies", e.target.value)}
                      placeholder="Penicillin"
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === "consent" && (
              <div>
                <h1 className="text-2xl font-bold">{t("onb.step.consentTitle")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("onb.step.consentHint")}</p>

                <div className="mt-5 space-y-3">
                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                    <input
                      type="checkbox"
                      checked={abhaLink}
                      onChange={(e) => setAbhaLink(e.target.checked)}
                      className="mt-0.5 size-5 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{t("onb.consent.abha")}</span>
                      <span className="block text-xs text-muted-foreground">{t("onb.consent.abhaHint")}</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                    <input
                      type="checkbox"
                      checked={shareRecords}
                      onChange={(e) => setShareRecords(e.target.checked)}
                      className="mt-0.5 size-5 accent-primary"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{t("onb.consent.share")}</span>
                      <span className="block text-xs text-muted-foreground">{t("onb.consent.shareHint")}</span>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/5 p-4">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        setConsentError("");
                      }}
                      className="mt-0.5 size-5 accent-primary"
                    />
                    <span className="text-sm font-medium">{t("onb.consent.terms")}</span>
                  </label>
                  {consentError && <p className="text-sm text-destructive">{consentError}</p>}
                </div>
              </div>
            )}

            {step === "account" && (
              <div>
                <h1 className="text-2xl font-bold">{t("dreg.account.title")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("dreg.account.subtitle")}</p>

                <div className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.account.password")}</label>
                    <input
                      type="password"
                      value={account.password}
                      onChange={(e) => { setAcc("password", e.target.value); setConsentError(""); }}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium">{t("dreg.account.confirm")}</label>
                    <input
                      type="password"
                      value={account.confirm}
                      onChange={(e) => { setAcc("confirm", e.target.value); setConsentError(""); }}
                      placeholder="••••••••"
                      className={inputCls}
                    />
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
                <h1 className="mt-6 text-2xl font-bold">{t("onb.complete.success")}</h1>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">{t("onb.complete.subtitle")}</p>

                <div className="mt-6 w-full rounded-2xl border border-border bg-card p-4 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <UserRound className="size-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{form.name.trim() || "—"}</p>
                      <p className="text-xs text-muted-foreground">
                        {form.age ? `${form.age} y ·` : ""} {form.gender}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">{t("onb.previewMobile")}</p>
                      <p className="font-medium">+91 {form.mobile.trim() || loginMobile}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t("onb.previewAbha")}</p>
                      <p className="font-medium">{abhaLink ? t("onb.previewLinked") : t("onb.previewSkip")}</p>
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
            {step === "account" ? t("onb.create") : step === "identity" ? t("auth.continue") : t("onb.next")}{" "}
            <ChevronRight className="ml-1.5" />
          </Button>
        ) : (
          <Button onClick={getStarted} size="lg" className="h-14 w-full text-base">
            {t("onb.finish")} <ChevronRight className="ml-1.5" />
          </Button>
        )}
      </div>
    </div>
  );
}
