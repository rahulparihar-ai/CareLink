"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, FileText } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { askAi, type AiRecordContext } from "@/services/aiService";
import { AIDisclaimer } from "@/components/shared/primitive";
import { cn } from "@/utils";

interface Message {
  role: "user" | "ai";
  text: string;
  sources?: { label: string; value: string; sourceType: string; confidence?: number }[];
}

const suggestions = [
  "What medications are currently in my record?",
  "What did my last lab report say?",
  "When was my last appointment?",
  "What does CBC mean?",
];

export function PatientAiView() {
  const setView = useAppStore((s) => s.setView);
  const medications = useAppStore((s) => s.medications);
  const appointments = useAppStore((s) => s.appointments);
  const labReports = useAppStore((s) => s.labReports);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm CareLink AI. Ask me about your health records, documents, or anything about your care." },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showEvidence, setShowEvidence] = useState<NonNullable<Message["sources"]> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const send = async (text: string) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setTyping(true);
    const ctx: AiRecordContext = {
      medications: medications.map((m) => `${m.name} ${m.strength ?? ""}`.trim()),
      appointments: appointments.map((a) => ({ doctor: a.doctorName, date: a.date, time: a.time })),
      lastLab: labReports[0] ? { title: labReports[0].title, date: labReports[0].date, status: labReports[0].status } : null,
      bloodGroup: patientProfile?.bloodGroup ?? "",
      allergies: patientProfile?.allergies ? patientProfile.allergies.split(",").map((x) => x.trim()).filter(Boolean) : [],
    };
    const res = await askAi(text, ctx);
    setTyping(false);
    setMessages((m) => [...m, { role: "ai", text: res.text, sources: res.sources }]);
  };

  return (
    <PatientPageShell title="CareLink AI" currentTab="PATIENT_AI" onBack={() => setView("PATIENT_HOME")} noBottomNav>
      {/* Chat area */}
      <div ref={scrollRef} className="h-[calc(100dvh-230px)] space-y-3 overflow-y-auto pb-4">
        {messages.map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm", m.role === "user" ? "bg-primary text-primary-foreground" : "border border-border bg-card")}>
              <p>{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <button onClick={() => setShowEvidence(m.sources!)}
                  className="mt-2 flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                  <FileText className="size-3" /> View source evidence
                </button>
              )}
            </div>
          </motion.div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 rounded-2xl border border-border bg-card px-4 py-3">
              {[0, 1, 2].map((i) => (
                <motion.span key={i} className="size-1.5 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Suggestion chips */}
      {messages.length <= 1 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
              {s}
            </button>
          ))}
        </div>
      )}

      <AIDisclaimer className="mb-2" />

      {/* Input */}
      <div className="flex items-end gap-2 border-t border-border pt-3">
        <div className="flex flex-1 items-center rounded-2xl border border-input bg-card px-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder="Ask about your health records…"
            className="w-full bg-transparent py-3 text-sm outline-none"
          />
        </div>
        <button onClick={() => send(input)} disabled={!input.trim()}
          className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground disabled:opacity-40">
          <Send className="size-5" />
        </button>
      </div>

      {/* Evidence modal */}
      <AnimatePresence>
        {showEvidence && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowEvidence(null)}>
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-[640px] rounded-t-3xl bg-card p-5 pb-safe">
              <p className="font-bold">Source Evidence</p>
              <p className="mb-3 text-xs text-muted-foreground">Where this information came from</p>
              {showEvidence.map((s, i) => (
                <div key={i} className="mb-2 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{s.label}</p>
                    <span className="text-[10px] uppercase text-muted-foreground">{s.sourceType}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{s.value}</p>
                  {s.confidence !== undefined && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">Confidence</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded bg-muted">
                        <div className="h-full rounded bg-emerald-500" style={{ width: `${s.confidence * 100}%` }} />
                      </div>
                      <span className="text-[10px] font-medium">{Math.round(s.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => setShowEvidence(null)} className="mt-2 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PatientPageShell>
  );
}
