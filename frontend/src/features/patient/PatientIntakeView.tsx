"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Keyboard,
  Hand,
  Mic as MicIcon,
  RotateCcw,
  Pencil,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { Button } from "@/components/ui/button";
import { symptomChips, bodyAreas } from "@/data/demo";
import { transcribeDemo } from "@/services/voiceService";
import { cn } from "@/utils";

type InputMode = "voice" | "text" | "touch";

export function PatientIntakeView() {
  const setView = useAppStore((s) => s.setView);
  const [mode, setMode] = useState<InputMode | null>(null);
  const [step, setStep] = useState(0);
  const [isProxy, setIsProxy] = useState(false);
  const [proxyRelation, setProxyRelation] = useState("Family Member");
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "done">("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [severity, setSeverity] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const startVoice = async () => {
    setVoiceState("listening");
    setResponse("");
    const t = await transcribeDemo();
    setTimeout(() => {
      setVoiceState("done");
      setTranscript(t);
      setResponse("I have been experiencing stomach pain for the last three days. It is mild to moderate, worse after eating.");
    }, 2400);
  };

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  if (done) {
    return (
      <PatientPageShell title="Health Intake" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HOME")}>
        <div className="flex flex-col items-center py-16 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
            className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Check className="size-10" />
          </motion.div>
          <h2 className="mt-5 text-lg font-bold">Health intake completed</h2>
          <p className="mt-1 text-sm text-muted-foreground">Your answers have been saved to your health record.</p>
          <div className="mt-6 w-full max-w-xs rounded-2xl border border-border bg-card p-4 text-left text-sm card-soft">
            <p className="font-semibold">Chief complaint</p>
            <p className="mt-1 text-muted-foreground">{response || "I have been experiencing stomach pain…"}</p>
            {severity && <p className="mt-2">Severity: <span className="font-medium">{severity}</span></p>}
            {duration && <p>Duration: <span className="font-medium">{duration}</span></p>}
            {symptoms.length > 0 && <p className="mt-1">Symptoms: <span className="font-medium">{symptoms.join(", ")}</span></p>}
          </div>
          <button onClick={() => setView("PATIENT_TIMELINE")} className="mt-6 text-sm font-medium text-primary">View timeline</button>
        </div>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell title="Health Check-in" currentTab="PATIENT_HISTORY" onBack={() => setView("PATIENT_HOME")}>
      {/* Proxy toggle */}
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 card-soft">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-primary" />
          <div>
            <p className="text-sm font-semibold">Someone else is helping me</p>
            <p className="text-xs text-muted-foreground">Proxy mode</p>
          </div>
        </div>
        <button
          onClick={() => setIsProxy(!isProxy)}
          className={cn("relative h-6 w-11 rounded-full transition-colors", isProxy ? "bg-primary" : "bg-muted-foreground/30")}
          role="switch" aria-checked={isProxy}
        >
          <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", isProxy ? "left-[22px]" : "left-0.5")} />
        </button>
      </div>

      <AnimatePresence>
        {isProxy && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden">
            <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
              <p className="font-semibold">Proxy Mode Active</p>
              <p className="mt-0.5">You are assisting the patient. Your identity is separate from the patient&apos;s.</p>
              <select value={proxyRelation} onChange={(e) => setProxyRelation(e.target.value)}
                className="mt-2 w-full rounded-lg border border-amber-300/50 bg-amber-50 px-2 py-1.5 text-xs dark:bg-amber-500/10">
                <option>Family Member</option>
                <option>Caregiver</option>
                <option>Guardian</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI chat bubble */}
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold-foreground)]">
          <ShieldCheck className="size-5" />
        </span>
        <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3"
          style={{ fontSize: "1.05rem", fontFamily: "var(--font-sans)" }}>
          {step === 0 ? "What brings you here today?" : step === 1 ? "How severe is the pain?" : step === 2 ? "How long have you had this?" : step === 3 ? "Where is the discomfort?" : "Any other symptoms?"} 
        </div>
      </div>

      {/* Mode selector if none chosen */}
      {!mode && (
        <div className="grid grid-cols-3 gap-2.5">
          <ModeButton icon={MicIcon} label="Voice" onClick={() => { setMode("voice"); startVoice(); }} highlighted />
          <ModeButton icon={Keyboard} label="Text" onClick={() => setMode("text")} />
          <ModeButton icon={Hand} label="Touch" onClick={() => setMode("touch")} />
        </div>
      )}

      {/* VOICE */}
      {mode === "voice" && (
        <div className="mt-4 flex flex-col items-center rounded-2xl border border-border bg-card p-6 card-soft">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {voiceState === "listening" ? "Listening…" : voiceState === "done" ? "Recorded" : "Tap to speak"}
          </p>
          <div className="mt-4 flex h-20 items-center justify-center gap-1">
            {voiceState === "listening" ? (
              Array.from({ length: 24 }).map((_, i) => (
                <motion.span key={i} className="w-1 rounded-full bg-primary"
                  animate={{ height: [8, 10 + ((i * 7) % 50), 8] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.05 }} />
              ))
            ) : (
              <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MicIcon className="size-7" />
              </span>
            )}
          </div>
          {voiceState === "done" && transcript && (
            <div className="mt-4 w-full rounded-xl bg-muted/50 p-3">
              <p className="text-sm italic">{transcript}</p>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setVoiceState("idle")} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"><RotateCcw className="size-3" /> Replay</button>
                <button onClick={() => setMode("text")} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs"><Pencil className="size-3" /> Edit</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TEXT */}
      {mode === "text" && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={3}
            placeholder="Describe your symptoms…"
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-base outline-none focus:border-ring"
          />
        </div>
      )}

      {/* TOUCH */}
      {mode === "touch" && (
        <div className="mt-4 space-y-4">
          {step === 1 && (
            <SeveritySelect value={severity} onChange={setSeverity} />
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-2">
              {["Less than a day", "2–3 days", "1 week", "2–4 weeks", "1–3 months", "Over 3 months"].map((d) => (
                <button key={d} onClick={() => setDuration(d)}
                  className={cn("rounded-xl border py-3 text-sm font-medium", duration === d ? "border-primary bg-primary/5 text-primary" : "border-border bg-card")}>
                  {d}
                </button>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="flex flex-wrap gap-2">
              {bodyAreas.map((a) => (
                <button key={a} onClick={() => setArea(a)}
                  className={cn("rounded-full border px-3.5 py-2 text-sm", area === a ? "border-primary bg-primary/5 text-primary" : "border-border bg-card")}>
                  {a}
                </button>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="flex flex-wrap gap-2">
              {symptomChips.map((s) => (
                <button key={s} onClick={() => toggleSymptom(s)}
                  className={cn("rounded-full border px-3.5 py-2 text-sm", symptoms.includes(s) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      {mode && (
        <div className="mt-6 flex gap-2">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
          )}
          <Button className="flex-[2]" onClick={() => step >= 4 ? setDone(true) : setStep(step + 1)}>
            {step >= 4 ? "Complete" : "Continue"}
          </Button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {step === 0 ? "Choose how you'd like to answer. No typing needed." : ""}
      </p>
    </PatientPageShell>
  );
}

function ModeButton({ icon: Icon, label, onClick, highlighted }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; highlighted?: boolean }) {
  return (
    <motion.button whileTap={{ scale: 0.96 }} onClick={onClick}
      className={cn("flex flex-col items-center gap-2 rounded-2xl border p-5 transition-colors", highlighted ? "border-primary bg-primary/5" : "border-border bg-card")}>
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-6" /></span>
      <span className="text-sm font-semibold">{label}</span>
    </motion.button>
  );
}

function SeveritySelect({ value, onChange }: { value: string | null; onChange: (v: string) => void }) {
  const opts = [
    { label: "Mild", color: "emerald" },
    { label: "Moderate", color: "amber" },
    { label: "Severe", color: "red" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {opts.map((o) => (
        <motion.button key={o.label} whileTap={{ scale: 0.96 }} onClick={() => onChange(o.label)}
          className={cn("rounded-2xl border py-8 text-center text-lg font-bold transition-colors",
            value === o.label
              ? o.color === "emerald" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : o.color === "amber" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-red-500 bg-red-50 text-red-700"
              : "border-border bg-card text-muted-foreground")}>
          {o.label}
        </motion.button>
      ))}
    </div>
  );
}
