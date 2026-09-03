"use client";

import { motion } from "framer-motion";
import { Mic, MicOff, Volume2, VolumeX, Send, Sparkles, ArrowRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAppStore } from "@/store";
import { getLanguageDir } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";
import { useAiAssistant } from "@/hooks/useAiAssistant";

const AVATAR_TONES = ["#22c55e", "#0ea5e9", "#a78bfa", "#f59e0b", "#ec4899"];

export function AiAssistantView() {
  const setView = useAppStore((s) => s.setView);
  const { language, t } = useTranslation();
  const dir = getLanguageDir(language);
  const {
    messages,
    input,
    setInput,
    busy,
    listening,
    muted,
    error,
    sttAvailable,
    ttsAvailable,
    send,
    toggleListening,
    toggleMute,
    finish,
    retry,
  } = useAiAssistant();

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  const anySpeaking = messages.some((m) => m.speaking);

  return (
    <div dir={dir} className="app-shell flex min-h-dvh flex-col bg-gradient-to-b from-primary/5 via-card to-card">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-2">
        <Button variant="ghost" size="icon" onClick={() => setView("LANGUAGE")} aria-label={t("ai.backAria")}>
          <X />
        </Button>
        <CareLinkLogo size="sm" />
        <div className="ml-auto">
          {ttsAvailable && (
            <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={muted ? t("ai.unmuteAria") : t("ai.muteAria")}>
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
          )}
        </div>
      </div>

      {/* Avatar + intro */}
      <div className="relative flex flex-col items-center px-6 pt-2 pb-4 text-center">
        <div className="relative">
          <div
            className={cn(
              "relative flex size-28 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-2xl shadow-primary/30 transition-transform",
              (busy || anySpeaking) && "scale-105"
            )}
          >
            <Sparkles className="size-12 text-primary-foreground" />
          </div>
          {AVATAR_TONES.map((c, i) => (
            <motion.span
              key={c}
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: c }}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.3, 0.9, 0.3], scale: [1, 1.12, 1], rotate: 360 }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
              aria-hidden
            />
          ))}
          {/* Listening ring */}
          {listening && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 0.9, opacity: 1 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.4, repeat: Infinity }}
              aria-hidden
            />
          )}
        </div>

        <h1 className="mt-4 flex items-center gap-1.5 text-2xl font-bold">
          {t("ai.title")} <Sparkles className="size-5 text-primary" />
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("ai.subtitle")}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[calc(100dvh-420px)] min-h-40 flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm">
              <p>{t("ai.welcome")}</p>
            </div>
          </motion.div>
        )}
        {messages.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card"
              )}
            >
              <p>{m.text}</p>
            </div>
          </motion.div>
        ))}
        {busy && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-destructive/25 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
              <p>{error}</p>
              <button onClick={retry} className="mt-1 text-xs font-medium underline">
                {t("ai.tryAgain")}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Suggestions */}
      {messages.length === 0 && !error && (
        <div className="mb-3 flex flex-wrap justify-center gap-1.5 px-4">
          {[1, 2, 3].map((n) => (
            <button
              key={n}
              onClick={() => send(t(`ai.suggest.${n}`))}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {t(`ai.suggest.${n}`)}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 border-t border-border bg-card/80 p-4 pb-safe backdrop-blur">
        {sttAvailable && (
          <button
            onClick={toggleListening}
            disabled={busy}
            aria-label={t("ai.micAria")}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl border transition-colors",
              listening ? "border-red-400 bg-red-500/10 text-red-500" : "border-border bg-card text-muted-foreground"
            )}
          >
            {listening ? <MicOff className="size-5 animate-pulse" /> : <Mic className="size-5" />}
          </button>
        )}
        <div className="flex flex-1 items-center rounded-2xl border border-input bg-card px-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t("ai.inputPlaceholder")}
            aria-label={t("ai.inputPlaceholder")}
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <button
          onClick={() => send()}
          disabled={busy || !input.trim()}
          aria-label={t("ai.sendAria")}
          className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </div>

      {/* Continue */}
      <div className="border-t border-border bg-card p-4 pb-safe">
        <Button className="h-13 w-full text-base" size="lg" onClick={finish}>
          {t("ai.continue")}
          <ArrowRight className="ms-2 size-4" />
        </Button>
      </div>
    </div>
  );
}