"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Send, Sparkles, LifeBuoy } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  text: string;
}

// Pre-written script that describes every part of the CareLink app. The
// assistant answers purely from this script — it does not read any health
// data because the user has not signed in yet.
const APP_GUIDE: { keywords: string[]; answer: string }[] = [
  {
    keywords: ["register", "sign up", "signup", "patient", "hoshiyar", "abha", "account"],
    answer:
      "CareLink is a patient case-taking app. To get started, a patient enters their mobile number, verifies it with a 6-digit OTP, then registers by entering their name, basic health details and consent. Once registered, they get a private health record with a profile, timeline, documents and more.",
  },
  {
    keywords: ["doctor", "login", "id", "password", "hospital"],
    answer:
      "Doctors sign in with the Doctor ID and password issued by their hospital — not by mobile OTP. First-time doctors complete a short registration (identity, hospital credentials, professional details, consent) before entering the doctor dashboard. There they can review patient cases, the priority queue and clinical notes.",
  },
  {
    keywords: ["kiosk", "terminal", "machine", "self", "case-taking"],
    answer:
      "The MediKiosk is a self-service terminal in the hospital. A patient identifies themselves, gives consent, then answers a guided clinical-history questionnaire (voice, text or typing). Documents can be scanned/OCRed. The AI drafts a source-traceable clinical summary with red-flag alerts, which the doctor then verifies.",
  },
  {
    keywords: ["timeline", "history", "record"],
    answer:
      "The Health Timeline shows a patient's visits, documents, medications, lab reports and vaccines in one scroll, grouped by year. Filters let you narrow by Visit, Document, Medication, Report or Vaccine.",
  },
  {
    keywords: ["document", "scan", "ocr", "upload", "prescription", "report"],
    answer:
      "Patients can upload or scan prescription images, lab reports and discharge summaries. OCR reads the text and CareLink extracts fields like medicine name, dosage, date and the hospital, adding them to the health record.",
  },
  {
    keywords: ["language", "translate", "hindi", "urdu", "english"],
    answer:
      "CareLink supports multiple languages including English, Hindi and Urdu. Urdu also switches the layout to right-to-left (RTL). You can change the language anytime from the Language screen on the welcome page.",
  },
  {
    keywords: ["theme", "color", "accessibility", "dark", "change"],
    answer:
      "The Accessibility screen lets you pick a theme colour — White, Blue, Green, Pink, Golden Yellow or Black. The whole app updates instantly. You can reach it from the Accessibility button on the welcome page.",
  },
  {
    keywords: ["ai", "assistant", "help", "guide", "what is", "does", "features", "works", "app"],
    answer:
      "I am the CareLink assistant. CareLink is an AI-assisted, source-traceable clinical history and case-taking app for hospitals and clinics. Its main parts are: Patient registration & profile, Doctor login with hospital-issued credentials, the MediKiosk self-service case-taking terminal, AI-drafted clinical summaries with red-flag detection, document OCR, a health timeline, language/accessibility themes and an ABDM/consent-ready design. Ask me about any of these and I'll explain them.",
  },
];

const SUGGESTIONS = [
  "What does the app do?",
  "How do patients register?",
  "How does a doctor login?",
  "What is the MediKiosk?",
  "How does document scanning work?",
];

const WELCOME =
  "Hello! I'm the CareLink guide. I can explain how the app works — patient registration, doctor login, the MediKiosk, document scanning, the AI summary, languages and themes. Just ask me anything like \"What does the app do?\".";

function scriptedReply(query: string): string {
  const q = query.toLowerCase();
  for (const entry of APP_GUIDE) {
    if (entry.keywords.some((k) => q.includes(k))) {
      return entry.answer;
    }
  }
  return APP_GUIDE[APP_GUIDE.length - 1].answer;
}

export function HelpAssistantView() {
  const setView = useAppStore((s) => s.setView);
  const [messages, setMessages] = useState<Message[]>([{ role: "ai", text: WELCOME }]);
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

  const send = (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    const answer = scriptedReply(text);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: answer }]);
    }, 700);
  };

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("WELCOME")} aria-label="Back">
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
            Help Assistant <Sparkles className="size-4 text-primary" />
          </h1>
          <p className="text-xs text-muted-foreground">
            Tells you what every part of CareLink does
          </p>
        </div>
      </div>

      <div ref={scrollRef} className="h-[calc(100dvh-300px)] flex-1 space-y-3 overflow-y-auto px-4 pb-3">
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

      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5 px-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 border-t border-border p-4 pb-safe">
        <div className="flex flex-1 items-center rounded-2xl border border-input bg-card px-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask how CareLink works…"
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