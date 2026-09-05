"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface ThorSpeechBubbleProps {
  /** Full narration text to display (already localized). */
  text: string;
  /** Callback when the bubble is dismissed (user tap or timeout). */
  onDismiss: () => void;
  /** How long to auto-hide after typing completes (ms). */
  ttl?: number;
}

/**
 * Typewriter-style guide bubble shown above the Thor character.
 * The parent renders this with a `key` derived from the text so each new
 * narration remounts cleanly (no imperative reset needed).
 */
export function ThorSpeechBubble({ text, onDismiss, ttl = 6000 }: ThorSpeechBubbleProps) {
  const [shown, setShown] = useState("");
  const [typing, setTyping] = useState(true);
  const timer = useRef<number | null>(null);

  // Type out the text character by character.
  useEffect(() => {
    let i = 0;
    const step = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        window.clearInterval(step);
        setTyping(false);
      }
    }, 18);
    return () => window.clearInterval(step);
  }, [text]);

  // Auto-dismiss once fully typed.
  useEffect(() => {
    if (typing) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(onDismiss, ttl);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [typing, onDismiss, ttl]);

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.92 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        onClick={onDismiss}
        className="pointer-events-auto absolute bottom-20 right-0 w-64 rounded-2xl rounded-br-sm bg-white p-3 text-left text-sm leading-snug text-slate-800 shadow-xl ring-1 ring-slate-900/10 dark:bg-slate-800 dark:text-slate-100 dark:ring-white/10"
        role="status"
        aria-live="polite"
      >
        <span className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
          <span aria-hidden>⚡</span> Thor says
        </span>
        <p className="min-h-[2.5rem]">
          {shown}
          {typing && <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-slate-400 align-middle" />}
        </p>
      </motion.button>
    </AnimatePresence>
  );
}