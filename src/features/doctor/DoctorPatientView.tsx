"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RotateCcw, FileSearch, Check, X, Pencil, FileText,
  Pill, AlertTriangle, MessageSquare, BadgeCheck, ShieldCheck, Sparkles,
  User,
} from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import { LiveVitalsCard } from "@/components/shared/LiveVitalsCard";
import { demoPatients } from "@/data/demo";
import { cn } from "@/lib/utils";

type Tab = "summary" | "notes" | "rx" | "redflags";

const summaryFields: { key: string; label: string }[] = [
  { key: "chiefComplaint", label: "Chief Complaint" },
  { key: "hpi", label: "History of Present Illness" },
  { key: "pastMedicalHistory", label: "Past Medical History" },
  { key: "medications", label: "Current Medications" },
  { key: "allergies", label: "Allergies" },
  { key: "familyHistory", label: "Family History" },
  { key: "investigations", label: "Investigations" },
  { key: "timeline", label: "Timeline" },
  { key: "redFlags", label: "Red Flags" },
];

export function DoctorPatientView() {
  const setView = useAppStore((s) => s.setView);
  const selectedPatientId = useAppStore((s) => s.selectedPatientId);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const currentTab = useAppStore((s) => s.currentView as never);

  const patient = demoPatients.find((p) => p.id === selectedPatientId) ?? demoPatients[0];

  const [tab, setTab] = useState<Tab>("summary");
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [verdict, setVerdict] = useState<"none" | "accepted" | "edited" | "rejected">(patient.aiSummary?.verified ? "accepted" : "none");
  const [note, setNote] = useState("");
  const [savedNotes, setSavedNotes] = useState<{ id: string; content: string; type: string; ts: string }[]>(
    (patient.notes ?? []).map((n) => ({ id: n.id, content: n.content, type: n.type, ts: n.timestamp }))
  );
  const [rx, setRx] = useState([{ name: "", dose: "", freq: "", dur: "" }]);
  const [confirmRf, setConfirmRf] = useState<Record<string, boolean>>({});
  const [escalated, setEscalated] = useState<Record<string, boolean>>({});
  const [rejectOpen, setRejectOpen] = useState(false);

  const addRxRow = () => setRx((r) => [...r, { name: "", dose: "", freq: "", dur: "" }]);

  const evidence = {
    chiefComplaint: [{ field: "Intake response #1", text: "Patient reported pain in the chest area with radiation to the left arm." }],
    ["pastMedicalHistory" as string]: [{ field: "Historical record", text: "Hypertension (since 2019). No prior cardiac events." }],
    medications: [{ field: "Active medication list", text: "Aspirin 75 mg once daily — from Cardiology." }],
  };

  const openNotes = savedNotes.filter((n) => n.type !== "follow-up");
  const followups = savedNotes.filter((n) => n.type === "follow-up");

  const summon = (id: string) => {
    setSelectedPatientId(id);
    setTab("summary");
  };

  return (
    <DoctorPageShell title={patient.name} currentTab={currentTab as string} sub={`${patient.age} · ${patient.gender} · ${patient.patientId}`}
      onBack={() => setView("DOCTOR_QUEUE")}
      right={<StatusBadge variant={statusVariant(patient.redFlagLevel ?? "NORMAL")} dot>{patient.redFlagLevel?.replace("_", " ")}</StatusBadge>}>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-muted/70 p-1">
        {([
          ["summary", "AI Summary"],
          ["notes", "Notes"],
          ["rx", "Prescription"],
          ["redflags", "Red Flags"],
        ] as [Tab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("flex-1 shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition-colors", tab === k ? "bg-card shadow-sm" : "text-muted-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {/* ============ AI SUMMARY ============ */}
      {tab === "summary" && (
        <div>
          <LiveVitalsCard compact />

          <div className="mt-4 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold">
              <Sparkles className="size-4 text-primary" /> AI Draft Summary
            </h2>
            <button onClick={() => setEvidenceOpen(!evidenceOpen)}
              className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
              <FileSearch className="size-3.5" /> {evidenceOpen ? "Hide" : "View"} Evidence
            </button>
          </div>

          {/* Verification banner */}
          {patient.summaryStatus === "pending" && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-300/50 bg-amber-50 p-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <AlertTriangle className="size-4" /> This AI summary is a draft and has not been verified by a clinician.
            </div>
          )}

          <div className="mt-3 space-y-2.5">
            {summaryFields.map((f) => {
              const val = patient.aiSummary?.[f.key as keyof typeof patient.aiSummary];
              return (
                <div key={f.key} className="rounded-xl border border-border bg-card p-3 card-soft">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{f.label}</p>
                  {typeof val === "string" && val ? (
                    <p className="mt-1 text-sm">{val}</p>
                  ) : (
                    <p className="mt-1 text-sm italic text-muted-foreground">Not provided</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Source evidence button / drawer */}
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>AI-generated draft for clinician review. Verify or edit before accepting into the record.</p>
          </div>

          {evidenceOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 overflow-hidden">
              <div className="rounded-2xl border border-border bg-card p-3 card-soft">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold"><FileSearch className="size-4 text-primary" /> Source Evidence</p>
                {Object.entries(evidence).map(([k, v]) => (
                  <div key={k} className="mb-2 rounded-lg bg-muted/40 p-2.5">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{k}</p>
                    {v.map((s, i) => (
                      <p key={i} className="mt-0.5 text-xs">{s.field}: <span className="italic">{s.text}</span></p>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Verdict buttons */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <VerdictBtn icon={Check} label="Accept" active={verdict === "accepted"} tone="emerald" onClick={() => setVerdict("accepted")} />
            <VerdictBtn icon={Pencil} label="Edit" active={verdict === "edited"} tone="sky" onClick={() => setVerdict("edited")} />
            <VerdictBtn icon={X} label="Reject" active={verdict === "rejected"} tone="red" onClick={() => setRejectOpen(true)} />
          </div>

          <AnimatePresence>
            {rejectOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="mt-3 rounded-2xl border border-red-300/60 bg-red-50 p-3 dark:border-red-500/40 dark:bg-red-500/10">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Reject AI summary?</p>
                <p className="mt-1 text-xs text-red-700/80 dark:text-red-300/80">The draft will be discarded and flagged for manual review.</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setRejectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" className="flex-1" onClick={() => { setVerdict("rejected"); setRejectOpen(false); }}>Confirm reject</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {verdict === "accepted" && <VerifiedBanner text="Summary verified and accepted by Dr. Mehta" />}
          {verdict === "edited" && <VerifiedBanner text="Summary captured with clinician edits" />}
          {verdict === "rejected" && (
            <div className="mt-3 rounded-xl border border-red-300/50 bg-red-50 p-3 text-xs text-red-800 dark:bg-red-500/10 dark:text-red-300">
              Summary rejected and flagged for manual clinician review.
            </div>
          )}
        </div>
      )}

      {/* ============ NOTES ============ */}
      {tab === "notes" && (
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold"><MessageSquare className="size-4 text-primary" /> Clinical Notes</h2>
          <div className="mt-3 rounded-2xl border border-border bg-card p-3 card-soft">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Add note</p>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
              placeholder="Assessment, plan, follow-up…"
              className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <div className="mt-2 flex gap-2">
              <Button className="flex-1" onClick={() => {
                if (!note.trim()) return;
                setSavedNotes((s) => [{ id: String(Date.now()), content: note, type: "note", ts: new Date().toISOString() }, ...s]);
                setNote("");
              }}>Save note</Button>
              <Button variant="outline" onClick={() => {
                if (!note.trim()) return;
                setSavedNotes((s) => [{ id: String(Date.now()), content: note, type: "follow-up", ts: new Date().toISOString() }, ...s]);
                setNote("");
              }}>Add follow-up</Button>
            </div>
          </div>

          {openNotes.length > 0 && <NoteList title="Assessment / Plan" items={openNotes} />}
          {followups.length > 0 && <NoteList title="Follow-ups" items={followups} />}
        </div>
      )}

      {/* ============ PRESCRIPTIONS ============ */}
      {tab === "rx" && (
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold"><Pill className="size-4 text-primary" /> Prescription Draft</h2>
          <div className="mt-3 space-y-2.5">
            {rx.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-3 card-soft">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Medicine {i + 1}</span>
                  {i > 0 && (
                    <button onClick={() => setRx((arr) => arr.filter((_, j) => j !== i))} className="text-red-500"><X className="size-4" /></button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={r.name} onChange={(e) => setRx((arr) => arr.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                    placeholder="Medicine name" className="col-span-2 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <input value={r.dose} onChange={(e) => setRx((arr) => arr.map((x, j) => j === i ? { ...x, dose: e.target.value } : x))}
                    placeholder="Dose (e.g. 5 mg)" className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <input value={r.freq} onChange={(e) => setRx((arr) => arr.map((x, j) => j === i ? { ...x, freq: e.target.value } : x))}
                    placeholder="Frequency" className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <input value={r.dur} onChange={(e) => setRx((arr) => arr.map((x, j) => j === i ? { ...x, dur: e.target.value } : x))}
                    placeholder="Duration" className="col-span-2 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={addRxRow}>+ Add medicine</Button>
            <Button className="flex items-center gap-1.5" onClick={() => setView("DOCTOR_PRESCRIPTIONS")}>
              <FileText className="size-4" /> Finalize script
            </Button>
          </div>
        </div>
      )}

      {/* ============ RED FLAGS ============ */}
      {tab === "redflags" && (
        <div>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold"><AlertTriangle className="size-4 text-primary" /> Red Flags</h2>
          <div className="mt-3 space-y-2.5">
            {(patient.redFlags?.length ? patient.redFlags : []).map((rf) => (
              <div key={rf.id} className={cn("rounded-2xl border p-3.5 card-soft",
                rf.level === "URGENT" ? "border-red-300/60 bg-red-50 dark:bg-red-500/10" : "border-amber-300/60 bg-amber-50 dark:bg-amber-500/10")}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold uppercase tracking-wide">{rf.rule}</span>
                  <StatusBadge variant={statusVariant(rf.level)} dot>{rf.level.replace("_", " ")}</StatusBadge>
                </div>
                <p className="mt-1.5 text-sm">{rf.reason}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">Detected: {rf.timestamp}</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/60 pt-2.5">
                  <button onClick={() => setConfirmRf((m) => ({ ...m, [rf.id]: !m[rf.id] }))}
                    className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", confirmRf[rf.id] ? "bg-emerald-500 text-white" : "bg-muted")}>
                    {confirmRf[rf.id] ? "Confirmed" : "Confirm"}
                  </button>
                  <button onClick={() => setEscalated((m) => ({ ...m, [rf.id]: !m[rf.id] }))}
                    className={cn("rounded-lg px-2.5 py-1.5 text-xs font-medium", escalated[rf.id] ? "bg-red-500 text-white" : "bg-muted")}>
                    {escalated[rf.id] ? "Escalated" : "Escalate"}
                  </button>
                </div>
              </div>
            ))}
            {(!patient.redFlags || patient.redFlags.length === 0) && (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                <BadgeCheck className="size-5 text-emerald-500" /> No red flags detected for this patient.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom summary actions when relevant */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-3.5 card-soft">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold">Patient: {patient.name}</p>
          <StatusBadge variant={statusVariant(patient.status)} dot>{patient.status.replace("_", " ")}</StatusBadge>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <Button variant="outline" className="flex items-center gap-1.5"><RotateCcw className="size-4" /> Regenerate AI</Button>
          <Button className="flex items-center gap-1.5"><Check className="size-4" /> Start Consultation</Button>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Other patients</p>
        <div className="flex flex-wrap gap-1.5">
          {demoPatients.filter((p) => p.id !== patient.id).slice(0, 4).map((p) => (
            <button key={p.id} onClick={() => summon(p.id)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium">
              <User className="size-3 text-muted-foreground" /> {p.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
    </DoctorPageShell>
  );
}

function VerdictBtn({ icon: Icon, label, active, tone, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; active: boolean; tone: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={cn("flex flex-col items-center gap-1 rounded-xl border py-3 text-xs font-semibold transition-colors",
        active
          ? tone === "emerald" ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10" : tone === "sky" ? "border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-500/10" : "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10"
          : "border-border bg-card text-muted-foreground")}>
      <Icon className="size-5" />
      {label}
    </button>
  );
}

function VerifiedBanner({ text }: { text: string }) {
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-300/50 bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
      <BadgeCheck className="size-4" /> {text}
    </div>
  );
}

function NoteList({ title, items }: { title: string; items: { id: string; content: string; type: string; ts: string }[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="rounded-xl border border-border bg-card p-3">
            <p className="text-sm">{n.content}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.ts).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
