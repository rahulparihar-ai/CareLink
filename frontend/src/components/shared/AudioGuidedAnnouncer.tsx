"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n/useTranslation";

/**
 * Audio Guided Mode announcer.
 *
 * When the "audio guided mode" accessibility toggle is on, this quietly voices
 * the name of each screen as the user navigates, helping visually impaired
 * users understand where they are. It uses the browser's built-in
 * speechSynthesis API so no additional voices/dependencies are required.
 */
export function AudioGuidedAnnouncer({ view }: { view: string }) {
  const { t } = useTranslation();
  const audioGuided = useAppStore((s) => s.audioGuided);
  const last = useRef<string>("");
  const lang = useAppStore((s) => s.language);

  useEffect(() => {
    if (!audioGuided) return;
    // Derive a human-friendly label for the current screen.
    const title =
      view === "PATIENT_HOME"
        ? t("auth.patientLogin")
        : view === "DOCTOR_HOME"
          ? t("auth.doctorLogin")
          : view === "WELCOME"
            ? t("app.tagline")
            : view
              .toLowerCase()
              .replace(/_/g, " ");

    if (!title || title === last.current) return;
    last.current = title;

    const say = () => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(title);
      u.lang = lang || "en";
      u.rate = 1;
      window.speechSynthesis.speak(u);
    };
    const id = window.setTimeout(say, 150);
    return () => window.clearTimeout(id);
  }, [view, audioGuided, t, lang]);

  return null;
}