"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { getGuidance } from "@/services/healthAssistantService";
import { AIDisclaimer } from "@/components/shared/primitive";

const topics = [
  { key: "routine", label: "What should my daily routine look like?" },
  { key: "sleep", label: "What habits can support better sleep?" },
  { key: "doctor", label: "What should I discuss with my doctor?" },
];

export function PatientGuidanceView() {
  const setView = useAppStore((s) => s.setView);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; points: string[] } | null>(null);

  const ask = async (key: string) => {
    setLoading(true);
    setResult(null);
    const r = await getGuidance(key);
    setResult(r);
    setLoading(false);
  };

  return (
    <PatientPageShell title="Health Guidance" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_WELLNESS")}>
      <AIDisclaimer className="mb-4" />
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Ask a question</h2>
      <div className="space-y-2">
        {topics.map((t) => (
          <button key={t.key} onClick={() => ask(t.key)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left text-sm font-medium card-soft">
            {t.label}
            <Sparkles className="ml-2 size-4 text-primary" />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-6 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Generating guidance…
          </motion.div>
        )}
        {result && !loading && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-6 rounded-2xl border border-primary/20 bg-card p-4 card-soft">
            <p className="flex items-center gap-2 font-semibold text-primary"><CheckCircle2 className="size-5" /> {result.title}</p>
            <ul className="mt-3 space-y-2">
              {result.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <p>Educational guidance — not a diagnosis or personalized prescription.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PatientPageShell>
  );
}
