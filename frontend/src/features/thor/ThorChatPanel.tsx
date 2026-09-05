"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, Send, Volume2, VolumeX, X } from "lucide-react";
import { useAppStore } from "@/store";
import type { LanguageCode } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { speechToTextProvider } from "@/lib/ai/speech/speechToText";
import { askThor } from "./thorApi";
import { speakThor, stopThorSpeech, thorSpeechAvailable } from "./thorVoice";
import { useThorStore } from "./thorStore";
import { thorGuideKey } from "./thorContext";
import { buildThorNarration } from "./thorPageDetails";

/** Quick suggestion chips so users can start talking to Thor instantly. */
const SUGGESTIONS = ["thor.suggest.1", "thor.suggest.2", "thor.suggest.3"];

/** Safe unique id (crypto.randomUUID is unavailable in non-secure contexts). */
function uid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Full-screen AI chat with Thor: typed or spoken instructions, replies spoken too. */
export function ThorChatPanel() {
  const { t, language, dir } = useTranslation();
  const open = useThorStore((s) => s.open);
  const setOpen = useThorStore((s) => s.setOpen);
  const muted = useThorStore((s) => s.muted);
  const setMuted = useThorStore((s) => s.setMuted);
  const thinking = useThorStore((s) => s.thinking);
  const setThinking = useThorStore((s) => s.setThinking);
  const messages = useThorStore((s) => s.messages);
  const addMessage = useThorStore((s) => s.addMessage);

  const currentView = useAppStore((s) => s.currentView);
  const pageLabel = buildThorNarration(currentView, language, t("thor.askHelp"));
  const pageContext = t(thorGuideKey(currentView));

  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const [typedIndex, setTypedIndex] = useState<Record<string, number>>({});
  const stopListening = useRef<{ stop: () => void } | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const speechOk = thorSpeechAvailable();

  // Scroll to the latest message.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  // Typewriter reveal for Thor's replies (speaks after finishing).
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "thor") return;
    if ((typedIndex[last.id] ?? 0) >= last.text.length) return;

    const id = last.id;
    const timer = window.setInterval(() => {
      setTypedIndex((prev) => {
        const cur = prev[id] ?? 0;
        if (cur >= last.text.length) {
          window.clearInterval(timer);
          return prev;
        }
        return { ...prev, [id]: cur + 2 };
      });
    }, 16);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // Speak Thor's latest reply once, only when it is newly finished typing.
  const lastSpokenRef = useRef<string | null>(null);
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "thor") return;
    const done = (typedIndex[last.id] ?? 0) >= last.text.length;
    if (!done || muted || !speechOk) return;
    if (lastSpokenRef.current === last.id) return;
    lastSpokenRef.current = last.id;
    speakThor(last.text, language);
  }, [typedIndex, messages, muted, speechOk, language]);

  useEffect(() => {
    return () => {
      stopListening.current?.stop();
      stopThorSpeech();
    };
  }, []);

  async function send(text: string) {
    const value = text.trim();
    if (!value || thinking) return;
    setInput("");
    addMessage({ id: uid(), role: "user", text: value });
    setThinking(true);
    const res = await askThor(value, language, `${pageLabel} ${pageContext}`, currentView);
    setThinking(false);
    const reply =
      res?.reply ||
      t("thor.error");
    addMessage({ id: uid(), role: "thor", text: reply });
  }

  function toggleMic() {
    if (listening) {
      stopListening.current?.stop();
      stopListening.current = null;
      setListening(false);
      return;
    }
    if (!speechToTextProvider.available()) return;
    setListening(true);
    stopListening.current = speechToTextProvider.start({
      language: language as LanguageCode,
      onResult: (r) => {
        if (r.isFinal) {
          setInput((prev) => `${prev} ${r.transcript}`.trim());
        } else {
          setInput(r.transcript);
        }
      },
      onError: () => {
        setListening(false);
        stopListening.current = null;
      },
      onEnd: () => {
        setListening(false);
        stopListening.current = null;
      },
    });
  }

  function renderText(txt: string) {
    // highlight sections between **bold** like markdown bullets "•"
    return txt.split("\n").map((line, i) => (
      <span key={i} className={line.trim().startsWith("-") || line.trim().startsWith("•") ? "mt-1 block" : "block"}>
        {line.trim().startsWith("-") || line.trim().startsWith("•") ? "• " : ""}
        {line}
      </span>
    ));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          dir={dir}
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="pointer-events-auto fixed bottom-[9.5rem] right-3 z-[60] flex max-h-[72vh] w-[calc(100vw-1.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-slate-900/10 dark:bg-slate-900 dark:ring-white/10"
          role="dialog"
          aria-label={t("thor.title")}
        >
          {/* header */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-amber-500 via-amber-500 to-orange-500 px-4 py-3 text-white dark:border-white/10 dark:from-amber-600 dark:to-orange-600">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-lg" aria-hidden>
              ⚡
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{t("thor.title")}</p>
              <p className="truncate text-[11px] text-white/80">{t("thor.subtitle")}</p>
            </div>
            <button
              type="button"
              aria-label={muted ? t("thor.unmute") : t("thor.mute")}
              onClick={() => setMuted(!muted)}
              className="rounded-full p-2 transition hover:bg-white/20"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button
              type="button"
              aria-label={t("thor.close")}
              onClick={() => setOpen(false)}
              className="rounded-full p-2 transition hover:bg-white/20"
            >
              <X size={18} />
            </button>
          </div>

          {/* messages */}
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-3 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <p className="mb-2 font-semibold text-amber-600 dark:text-amber-400">⚡ {t("thor.hello")}</p>
                <p>{pageLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => send(t(key))}
                      className="rounded-full border border-amber-400/60 bg-white px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700"
                    >
                      {t(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => {
              if (m.role === "user") {
                return (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm text-white">
                      {m.text}
                    </div>
                  </div>
                );
              }
              const shown = (typedIndex[m.id] ?? 0) >= m.text.length ? m.text : m.text.slice(0, typedIndex[m.id] ?? 0);
              return (
                <div key={m.id} className="flex justify-start">
                  <div className="flex max-w-[92%] items-end gap-2">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-500/90 text-xs" aria-hidden>
                      ⚡
                    </span>
                    <div className="rounded-2xl rounded-tl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                      {renderText(shown)}
                      {(typedIndex[m.id] ?? 0) < m.text.length && (
                        <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-slate-400 align-middle" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {thinking && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-amber-500/90 text-xs text-white" aria-hidden>
                  ⚡
                </span>
                <span className="italic">{t("thor.thinking")}</span>
                <span className="flex gap-1">
                  <motion.span className="h-1.5 w-1.5 rounded-full bg-amber-500" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} />
                  <motion.span className="h-1.5 w-1.5 rounded-full bg-amber-500" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} />
                  <motion.span className="h-1.5 w-1.5 rounded-full bg-amber-500" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} />
                </span>
              </div>
            )}
          </div>

          {/* input */}
          <form
            className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-slate-900"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <button
              type="button"
              aria-label={listening ? "Stop listening" : t("thor.mic")}
              onClick={toggleMic}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${
                listening ? "animate-pulse bg-red-500 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              }`}
            >
              <Mic size={18} />
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("thor.placeholder")}
              className="h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-300/40 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
            />
            <button
              type="submit"
              aria-label={t("thor.send")}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600 disabled:opacity-40"
              disabled={!input.trim() || thinking}
            >
              <Send size={17} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}