"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/store";
import type { View } from "@/store";
import { useTranslation } from "@/i18n/useTranslation";
import { buildThorNarration } from "./thorPageDetails";
import { speakThor, stopThorSpeech, thorSpeechAvailable } from "./thorVoice";
import { useThorStore } from "./thorStore";
import { ThorCharacter } from "./ThorCharacter";
import { ThorSpeechBubble } from "./ThorSpeechBubble";
import { ThorChatPanel } from "./ThorChatPanel";

/**
 * The animated Thor guide. Rendered at the app root so he travels with the
 * user across the whole app. Behaviours:
 *  - Welcomes the user once on first run.
 *  - When the current view changes, he pops a bubble + narrates (if audio
 *    guided is enabled) a proper guide for that page — not just its name.
 *  - Tap him to open the full AI chat (instructions / questions answered).
 */
const FIRST_VIEWS = new Set<View>([
  "WELCOME",
  "ROLE_SELECT",
  "SPLASH",
]);

export function ThorGuide() {
  const { t, language, dir } = useTranslation();
  const currentView = useAppStore((s) => s.currentView);
  const audioGuided = useAppStore((s) => s.audioGuided);

  const open = useThorStore((s) => s.open);
  const setOpen = useThorStore((s) => s.setOpen);
  const muted = useThorStore((s) => s.muted);
  const bubbleText = useThorStore((s) => s.bubble);
  const setBubble = useThorStore((s) => s.setBubble);
  const hasSpoken = useThorStore((s) => s.hasSpoken);
  const markSpoken = useThorStore((s) => s.markSpoken);

  const [talking, setTalking] = useState(false);
  const prevView = useRef<View>(currentView);
  const welcomeDone = useRef(false);

  const speechOk = thorSpeechAvailable();
  const shouldSpeak = audioGuided && !muted && speechOk;

  // On mount: unique welcome from Thor.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (welcomeDone.current) return;
      welcomeDone.current = true;
      const text = t("thor.welcome");
      setBubble(text);
      if (shouldSpeak) speakThor(text, language);
    }, 900);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On every view change, Thor narrates a proper guide for the page.
  useEffect(() => {
    if (currentView === prevView.current) return;
    prevView.current = currentView;

    // Don't speak the same page twice in a row / on first run.
    if (hasSpoken(currentView) || FIRST_VIEWS.has(currentView)) return;

    const text = buildThorNarration(currentView, language, t("thor.askHelp"));
    setBubble(text);
    markSpoken(currentView);
    if (shouldSpeak) {
      const id = window.setTimeout(() => {
        setTalking(true);
        speakThor(text, language, () => setTalking(false));
      }, 250);
      return () => window.clearTimeout(id);
    }
  }, [currentView, language, shouldSpeak, hasSpoken, markSpoken, setBubble, t]);

  // Stop narration when the user taps the character.
  function handleTap() {
    stopThorSpeech();
    setTalking(false);
    setBubble(null);
    setOpen(!open);
  }

  if (currentView === "SPLASH") return null;

  return (
    <div dir={dir} className="pointer-events-none fixed bottom-20 right-3 z-[50] flex flex-col items-end">
      {/* guide bubble */}
      {!open && bubbleText && (
        <ThorSpeechBubble
          key={bubbleText}
          text={bubbleText}
          onDismiss={() => setBubble(null)}
        />
      )}

      {/* character button (pointer events re-enabled only here) */}
      <div className="pointer-events-auto">
        <ThorCharacter
          size={64}
          talking={talking}
          active={open}
          onClick={handleTap}
        />
      </div>

      {/* chat panel */}
      <ThorChatPanel />
    </div>
  );
}