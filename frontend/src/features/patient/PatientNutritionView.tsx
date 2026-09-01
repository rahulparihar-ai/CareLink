"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Salad, Loader2, CheckCircle2, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { getNutritionGuidance } from "@/services/healthAssistantService";
import { AIDisclaimer } from "@/components/shared/primitive";

const questions = [
  { key: "food", label: "What type of food should I discuss with my doctor?" },
  { key: "principles", label: "What are general healthy eating principles?" },
  { key: "report", label: "Explain this food-related report." },
];

export function PatientNutritionView() {
  const setView = useAppStore((s) => s.setView);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ title: string; points: string[] } | null>(null);
  const [age, setAge] = useState("34");
  const [activity, setActivity] = useState("Moderate");
  const [goal, setGoal] = useState("Maintain health");
  const [diet, setDiet] = useState("No preference");

  const ask = async () => {
    setLoading(true);
    setResult(null);
    const r = await getNutritionGuidance();
    setResult(r);
    setLoading(false);
  };

  return (
    <PatientPageShell title="Ask AI About Nutrition" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_WELLNESS")}>
      <AIDisclaimer className="mb-4" />

      <div className="rounded-2xl border border-border bg-card p-4 card-soft">
        <p className="mb-3 flex items-center gap-2 font-semibold"><Salad className="size-5 text-pink-500" /> Your context</p>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Age" value={age} onChange={setAge} />
          <Field label="Activity" value={activity} onChange={setActivity} />
          <Field label="Goal" value={goal} onChange={setGoal} />
          <Field label="Diet pref." value={diet} onChange={setDiet} />
        </div>
        <button onClick={ask} className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground">
          Ask about nutrition
        </button>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">Or ask directly</h2>
      <div className="space-y-2">
        {questions.map((q) => (
          <button key={q.key} onClick={ask}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left text-sm font-medium card-soft">
            {q.label}
            <Info className="ml-2 size-4 text-muted-foreground" />
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="load" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="mt-5 flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin text-primary" /> Preparing nutrition guidance…
          </motion.div>
        )}
        {result && !loading && (
          <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 rounded-2xl border border-primary/20 bg-card p-4 card-soft">
            <p className="flex items-center gap-2 font-semibold text-primary"><CheckCircle2 className="size-5" /> {result.title}</p>
            <ul className="mt-3 space-y-2">
              {result.points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-3 rounded-xl bg-muted/50 p-2.5 text-xs text-muted-foreground">
              Educational only. For personalized nutrition, discuss with your doctor or a registered dietitian.
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PatientPageShell>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
    </div>
  );
}
