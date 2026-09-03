"use client";

import { motion } from "framer-motion";
import { HeartPulse } from "lucide-react";
import { useEffect } from "react";
import { useAppStore } from "@/store";

export function SplashView() {
  const setView = useAppStore((s) => s.setView);
  const setHasSeenSplash = useAppStore((s) => s.setHasSeenSplash);
  const hasSeenStartupAssistant = useAppStore((s) => s.hasSeenStartupAssistant);

  useEffect(() => {
    const t = setTimeout(() => {
      setHasSeenSplash(true);
      // First run goes straight to language selection, which leads into the
      // startup AI assistant. Returning users skip onboarding straight to home.
      setView(hasSeenStartupAssistant ? "WELCOME" : "LANGUAGE");
    }, 3400);
    return () => clearTimeout(t);
  }, [setHasSeenSplash, setView, hasSeenStartupAssistant]);

  return (
    <div className="app-shell relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-card">
      {/* Flowing medical line background */}
      <div className="absolute inset-0 opacity-60">
        <svg className="h-full w-full" viewBox="0 0 400 800" preserveAspectRatio="none">
          <defs>
            <linearGradient id="flow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d="M-20,300 C100,200 300,450 420,280"
            fill="none"
            stroke="url(#flow)"
            strokeWidth="2"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          />
          <motion.path
            d="M-20,500 C150,650 250,420 420,560"
            fill="none"
            stroke="var(--primary)"
            strokeOpacity="0.12"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.8, delay: 0.4 }}
          />
        </svg>
      </div>

      {/* Logo */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        {/* Golden light sweep */}
        <motion.div
          className="absolute inset-0 overflow-hidden rounded-[2rem]"
          aria-hidden
        >
          <motion.div
            className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[var(--gold)]/40 to-transparent"
            initial={{ left: "-40%", opacity: 0 }}
            animate={{ left: ["-40%", "120%"], opacity: [0, 1, 0] }}
            transition={{ duration: 1.6, delay: 0.9, ease: "easeInOut" }}
          />
        </motion.div>
        <div className="flex size-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-primary to-primary/80 shadow-2xl shadow-primary/40">
          <HeartPulse className="size-16 text-primary-foreground" strokeWidth={2} />
        </div>
        {/* Glow / pulse */}
        <motion.div
          className="absolute inset-0 rounded-[2rem] ring-2 ring-primary/30"
          animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          aria-hidden
        />
      </motion.div>

      {/* Wordmark */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="mt-6 text-4xl font-bold tracking-tight"
      >
        Care<span className="text-primary">Link</span>
      </motion.h1>

      {/* Hospital name */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 0.5 }}
        className="mt-1 text-sm font-semibold tracking-wide text-primary"
      >
        Swasthya
      </motion.p>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="mt-2 text-sm text-muted-foreground"
      >
        Connecting Care, Enriching Lives
      </motion.p>

      {/* Loading indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-14 flex items-center gap-2"
      >
        <motion.span
          className="size-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.span
          className="size-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        />
        <motion.span
          className="size-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        />
      </motion.div>
    </div>
  );
}
