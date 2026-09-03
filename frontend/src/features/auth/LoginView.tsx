"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ArrowRight, Smartphone, User, Lock, IdCard, KeyRound, Fingerprint, CheckCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import { useAppStore } from "@/store";
import { validateMobile } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/i18n/useTranslation";

export function LoginView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const setRole = useAppStore((s) => s.setRole);
  const setLoginMobile = useAppStore((s) => s.setLoginMobile);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const setPatientProfile = useAppStore((s) => s.setPatientProfile);
  const role = useAppStore((s) => s.role);
  const setAadhaarReference = useAppStore((s) => s.setAadhaarReference);
  const setAadhaarVerified = useAppStore((s) => s.setAadhaarVerified);
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");

  const isDoctor = role === "DOCTOR";

  // Returning-user quick login (patient only): sign in with Patient ID /
  // mobile number + password, bypassing the OTP chain.
  const [quickMode, setQuickMode] = useState(false);
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Aadhaar login (UI-only flow): collect a 12-digit Aadhaar number, then an
  // OTP. No live verification — it just marks the profile as linked.
  const [aadhaarMode, setAadhaarMode] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState(Array(6).fill(""));
  const [aadhaarLinked, setAadhaarLinked] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const maskAadhaar = (num: string) =>
    num ? `XXXX XXXX ${num.slice(8)}` : "";

  const sendAadhaarOtp = () => {
    if (!/^\d{12}$/.test(aadhaar)) {
      setError(t("auth.aadhaarInvalid"));
      return;
    }
    setError("");
    setAadhaarOtpSent(true);
  };

  const verifyAadhaarOtp = (_code: string) => {
    if (aadhaarLinked) return;
    setAadhaarLinked(true);
    setAadhaarVerified(true);
    setAadhaarReference(maskAadhaar(aadhaar));
    if (patientProfile) {
      setPatientProfile({ ...patientProfile, aadhaarVerified: true, abhaStatus: "Linked", abhaReference: maskAadhaar(aadhaar) });
      setRole("PATIENT");
      setView("PATIENT_HOME");
    } else {
      setRole("PATIENT");
      setView("REGISTER");
    }
  };

  const handleAadhaarOtpChange = (val: string, i: number) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...aadhaarOtp];
    next[i] = v;
    setAadhaarOtp(next);
    setError("");
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) {
      verifyAadhaarOtp(next.join(""));
    }
  };

  const submit = () => {
    if (!validateMobile(mobile)) {
      setError(t("auth.invalidMobile"));
      return;
    }
    setLoginMobile(mobile);
    setView("OTP");
  };

  const quickSubmit = () => {
    const id = uid.trim();
    if (!id) {
      setError(t("auth.patientIdRequired"));
      return;
    }
    if (!password) {
      setError(t("doc.login.passRequired"));
      return;
    }
    const profile = patientProfile;
    const matches =
      profile &&
      (profile.id === id || profile.mobileNumber === id) &&
      profile.password === password;
    if (!matches) {
      setError(t("auth.invalidCredentials"));
      return;
    }
    setRole("PATIENT");
    setLoginMobile(profile!.mobileNumber || "");
    setView("PATIENT_HOME");
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setQuickMode(false);
            setView(isDoctor ? "DOCTOR_LOGIN" : "WELCOME");
          }}
          aria-label="Back"
        >
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
            {isDoctor ? <User className="size-8" /> : quickMode ? <KeyRound className="size-8" /> : aadhaarMode ? <Fingerprint className="size-8" /> : <Smartphone className="size-8" />}
          </div>
          <h1 className="mt-5 text-2xl font-bold">
            {isDoctor ? t("auth.doctorLogin") : quickMode ? t("auth.returningLoginTitle") : aadhaarMode ? t("auth.aadhaar") : t("auth.patientLogin")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDoctor
              ? t("doc.login.hint")
              : quickMode
                ? t("auth.returningLoginHint")
                : aadhaarMode
                  ? t("auth.aadhaarHint")
                  : t("auth.mobileHint")}
          </p>
        </motion.div>

        {!isDoctor && !quickMode && aadhaarMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 space-y-4"
          >
            {!aadhaarOtpSent ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("auth.aadhaar")}</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    value={aadhaar}
                    onChange={(e) => {
                      setAadhaar(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    placeholder="XXXX XXXX XXXX"
                    className="w-full rounded-xl border border-input bg-card py-3.5 pl-12 pr-4 text-base tracking-widest outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </div>
                {error && <p className="mt-1.5 text-sm text-destructive">{error}</p>}
              </div>
            ) : aadhaarLinked ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <CheckCircle2 className="size-6 text-emerald-500" />
                <div>
                  <p className="text-sm font-semibold">{t("auth.aadhaarLinked")}</p>
                  <p className="text-xs text-muted-foreground">{maskAadhaar(aadhaar)}</p>
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium">{t("auth.otp")}</label>
                <p className="mb-3 text-xs text-muted-foreground">{t("auth.aadhaarOtpHint")}</p>
                <div className="flex justify-center gap-2">
                  {aadhaarOtp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={d}
                      onChange={(e) => handleAadhaarOtpChange(e.target.value, i)}
                      inputMode="numeric"
                      aria-label={`Digit ${i + 1}`}
                      maxLength={1}
                      className="h-14 w-11 rounded-xl border border-input bg-card text-center text-xl font-semibold outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
                    />
                  ))}
                </div>
                {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
              </div>
            )}
          </motion.div>
        )}

        {!isDoctor && !quickMode && !aadhaarMode && (
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
        )}

        {!isDoctor && quickMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("auth.patientIdOrMobile")}</label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={uid}
                  onChange={(e) => {
                    setUid(e.target.value);
                    setError("");
                  }}
                  placeholder={`CL-2026-XXXXXX / 987XX XXXXX`}
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
        )}
      </div>

      <div className="mt-auto p-6 pb-safe">
        <Button
          onClick={() => {
            if (!isDoctor && !quickMode) {
              if (aadhaarMode) {
                if (!aadhaarOtpSent) sendAadhaarOtp();
                else if (!aadhaarLinked) verifyAadhaarOtp(aadhaarOtp.join(""));
                return;
              }
              submit();
              return;
            }
            if (quickMode) quickSubmit();
          }}
          size="lg"
          className="h-14 w-full text-base"
        >
          {isDoctor ? t("auth.continue") : quickMode ? t("auth.login") : aadhaarMode ? (aadhaarOtpSent ? t("auth.verify") : t("auth.sendOtp")) : t("auth.continue")}{" "}
          <ArrowRight className="ml-1.5" />
        </Button>

        {!isDoctor && !quickMode && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setAadhaarMode(false);
                setError("");
              }}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                aadhaarMode ? "border-border text-muted-foreground" : "border-primary bg-primary/5 text-primary"
              }`}
            >
              <Smartphone className="size-4" />
              {t("auth.loginWithMobile")}
            </button>
            <button
              type="button"
              onClick={() => {
                setAadhaarMode(true);
                setError("");
              }}
              className={`flex h-11 items-center justify-center gap-1.5 rounded-xl border text-sm font-semibold transition-colors ${
                aadhaarMode ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              <Fingerprint className="size-4" />
              {t("auth.aadhaar")}
            </button>
          </div>
        )}

        {!isDoctor && (
          <button
            type="button"
            onClick={() => {
              setQuickMode((v) => !v);
              setError("");
            }}
            className="mt-3 flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-primary"
          >
            <Lock className="size-4" />
            {quickMode ? t("auth.otpLogin") : t("auth.returningUser")}
          </button>
        )}

        <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.termsHint")}</p>
      </div>
    </div>
  );
}