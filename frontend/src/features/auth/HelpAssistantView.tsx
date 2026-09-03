"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Send, Sparkles, LifeBuoy } from "lucide-react";
import { useAppStore } from "@/store";
import { useTranslation } from "@/i18n/useTranslation";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

interface Message {
  role: "user" | "ai";
  text: string;
}

// Pre-written script that describes every part of the CareLink app. The
// assistant answers purely from this script — it does not read any health
// data because the user has not signed in yet. All copy is translated via
// the i18n system so the Help Desk always follows the selected language.
const TOPICS = ["register", "doctor", "intake", "timeline", "documents", "language", "theme", "ai"] as const;

// English keyword set used to classify a free-typed question. Suggestion
// buttons pass their topic directly. Answers are pulled from the current
// language's translation dict (see t("help.answer.<topic>")).
const KEYWORDS: Record<(typeof TOPICS)[number], string[]> = {
  register: ["register", "sign up", "signup", "patient", "hoshiyar", "abha", "account"],
  doctor: ["doctor", "login", "id", "password", "hospital"],
  intake: ["intake", "terminal", "machine", "self", "case-taking"],
  timeline: ["timeline", "history", "record"],
  documents: ["document", "scan", "ocr", "upload", "prescription", "report"],
  language: ["language", "translate", "hindi", "urdu", "english"],
  theme: ["theme", "color", "accessibility", "dark", "change"],
  ai: ["ai", "assistant", "help", "guide", "what is", "does", "features", "works", "app"],
};

function topicForQuery(query: string): (typeof TOPICS)[number] {
  const q = query.toLowerCase();
  for (const topic of TOPICS) {
    if (KEYWORDS[topic].some((k) => q.includes(k))) return topic;
  }
  return "ai";
}

// Suggestion topic order matches the help.suggest.N keys 1..5.
const SUGGESTION_TOPICS: (typeof TOPICS)[number][] = ["ai", "register", "doctor", "intake", "documents"];

export function HelpAssistantView() {
  const setView = useAppStore((s) => s.setView);
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setTyping(false), 900);
    return () => clearTimeout(timer);
  }, [typing]);

  // Renders the translated opening message. Because it is derived at render
  // time (not stored in state), it always follows the selected language.
  const welcome = t("help.welcome");

  const send = (text: string, topicHint?: (typeof TOPICS)[number]) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    const topic = topicHint ?? topicForQuery(text);
    const answer = t(`help.answer.${topic}`);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: answer }]);
    }, 700);
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("WELCOME")} aria-label={t("help.backAria")}>
          <ChevronLeft />
        </Button>
        <div className="mx-auto flex items-center gap-2">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="flex items-center gap-3 px-6 pb-3">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LifeBuoy className="size-6" />
        </div>
        <div>
          <h1 className="flex items-center gap-1.5 text-xl font-bold">
            {t("help.title")} <Sparkles className="size-4 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("help.subtitle")}
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="h-[calc(100dvh-300px)] flex-1 space-y-3 overflow-y-auto px-4 pb-3">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl border border-border bg-card px-3.5 py-2.5 text-sm">
              <p>{welcome}</p>
            </div>
          </motion.div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card"
              )}
            >
              <p>{m.text}</p>
            </div>
          </motion.div>
        ))}
        {typing && (
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
      </div>

      {messages.length === 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5 px-4">
          {SUGGESTION_TOPICS.map((topic, idx) => {
            const label = t(`help.suggest.${idx + 1}`);
            return (
              <button
                key={topic}
                onClick={() => send(label, topic)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {label}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border p-4 pb-safe">
        <div className="flex flex-1 items-center rounded-2xl border border-input bg-card px-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={t("help.inputPlaceholder")}
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <button
          onClick={() => send(input)}
          disabled={!input.trim()}
          className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"
        >
          <Send className="size-5" />
        </button>
      </div>
    </div>
  );
}