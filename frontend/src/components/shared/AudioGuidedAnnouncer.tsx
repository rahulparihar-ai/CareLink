"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import type { View } from "@/store";
import { useTranslation } from "@/i18n/useTranslation";
import { speakThor } from "@/features/thor/thorVoice";
import { buildThorNarration } from "@/features/thor/thorPageDetails";
import { useThorStore } from "@/features/thor/thorStore";

/**
 * Audio Guided Mode announcer.
 *
 * When the "audio guided mode" accessibility toggle is on, screens are read
 * aloud for visual assistance. Instead of the browser's raw default (often
 * female) voice, this reads through THOR's voice and speaks EXACTLY the same
 * text Thor writes in his guide bubble (`buildThorNarration`), so what the
 * user hears always matches what Thor says on screen.
 *
 * Coordination with ThorGuide: ThorGuide narrates fresh, non-first-run pages
 * on view change; this announcer covers the first-run screens (ROLE_SELECT)
 * and re-visits, so no page is spoken twice and none is missed.
 */
const FIRST_VIEWS = new Set<View>(["WELCOME", "ROLE_SELECT", "SPLASH"]);

export function AudioGuidedAnnouncer({ view }: { view: string }) {
  const { t, language } = useTranslation();
  const audioGuided = useAppStore((s) => s.audioGuided);
  const muted = useThorStore((s) => s.muted);
  const setBubble = useThorStore((s) => s.setBubble);
  const hasSpoken = useThorStore((s) => s.hasSpoken);
  const last = useRef<string>("");
  const prevAudioGuided = useRef<boolean>(audioGuided);

  useEffect(() => {
    const toggleOn = audioGuided && !prevAudioGuided.current;
    prevAudioGuided.current = audioGuided;
    if (toggleOn) last.current = "";

    if (!audioGuided || muted) return;
    const current = view as View;
    if (current === "SPLASH" || current === "WELCOME") return;

    // When the toggle is switched ON, always read the current page out
    // immediately (this is the "no voice" case the user reported). Otherwise
    // ThorGuide already narrates fresh non-first-run pages on view change.
    const handledByThor = !toggleOn && !FIRST_VIEWS.has(current) && !hasSpoken(current);
    if (handledByThor) return;

    const text = buildThorNarration(current, language, t("thor.askHelp"));
    if (!text || text === last.current) return;
    last.current = text;

    const id = window.setTimeout(() => {
      setBubble(text);
      speakThor(text, language);
    }, 150);
    return () => window.clearTimeout(id);
  }, [view, audioGuided, muted, language, t, hasSpoken, setBubble]);

  return null;
}