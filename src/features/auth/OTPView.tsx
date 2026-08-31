"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import { verifyOtp } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function OTPView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const role = useAppStore((s) => s.role);
  const loginMobile = useAppStore((s) => s.loginMobile);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const i = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(i);
  }, [timer]);

  const handleChange = (val: string, i: number) => {
    const v = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError("");
    if (v && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) submit(next.join(""));
  };

  const handleKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  async function submit(code: string) {
    setLoading(true);
    const res = await verifyOtp(code);
    setLoading(false);
    if (!res.ok) {
      setError(t("auth.invalidOtp"));
      setDigits(Array(6).fill(""));
      refs.current[0]?.focus();
      return;
    }
    if (role === "DOCTOR") {
      setView("DOCTOR_HOME");
    } else {
      setView("REGISTER");
    }
  }

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("LOGIN")} aria-label="Back">
          <ChevronLeft />
        </Button>
        <div className="mx-auto">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6 pt-6">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <ShieldCheck className="size-8" />
        </div>
        <h1 className="mt-5 text-2xl font-bold">{t("auth.otp")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("auth.otpSent")} +91 {loginMobile}
        </p>
        <span className="mt-1 inline-block rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
          {t("auth.demoOtpHint")}
        </span>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 flex justify-center gap-2 px-6"
      >
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKey(e, i)}
            inputMode="numeric"
            aria-label={`Digit ${i + 1}`}
            className="h-14 w-11 rounded-xl border border-input bg-card text-center text-xl font-semibold outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            maxLength={1}
          />
        ))}
      </motion.div>
      {error && <p className="mt-3 text-center text-sm text-destructive">{error}</p>}
      {loading && <p className="mt-3 text-center text-sm text-muted-foreground">{t("common.loading")}</p>}

      <div className="mt-auto p-6 pb-safe text-center">
        <button
          disabled={timer > 0}
          onClick={() => setTimer(30)}
          className="text-sm font-medium text-primary disabled:text-muted-foreground"
        >
          {timer > 0 ? `${t("auth.resend")} (${timer}s)` : t("auth.resend")}
        </button>
      </div>
    </div>
  );
}
