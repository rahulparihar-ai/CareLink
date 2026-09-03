"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, Stethoscope, FileText, Pill, Users, Info,
  Sparkles, Check, Pencil, RotateCcw, CheckCircle2, ScrollText,
  ChevronDown, MessageSquareText,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { cn } from "@/utils";

export function DoctorClinicalView() {
  const setView = useAppStore((s) => s.setView);
  const kiosk = useAppStore((s) => s.kioskSession);
  const summary = kiosk?.summary;
  const setPhysicianSummary = useAppStore((s) => s.setPhysicianSummary);
  const [editing, setEditing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [showTranscript, setShowTranscript] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "edited" | "rejected">(
    summary?.verificationStatus ?? "pending"
  );

  const field = (key: string, fallback: string) =>
    editing ? (draft[key] ?? fallback) : fallback;

  const setField = (key: string, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleAccept = () => {
    if (!summary) return;
    setAccepted(true);
    setStatus("accepted");
    setPhysicianSummary({ ...summary, verified: true, verificationStatus: "accepted" });
    setTimeout(() => setAccepted(false), 2000);
  };

  const handleReject = () => {
    if (!summary) return;
    setStatus("rejected");
    setPhysicianSummary({ ...summary, verificationStatus: "rejected" });
  };

  const handleSaveEdits = () => {
    if (!summary) return;
    setPhysicianSummary({ ...summary, ...draft, verificationStatus: "edited", verified: true });
    setEditing(false);
    setDraft({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleEdit = () => setEditing(true);

  return (
    <DoctorPageShell title="Clinical History" currentTab="DOCTOR_HOME">
      {!summary ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ScrollText className="size-7" />
          </span>
          <p className="text-sm font-semibold">No clinical history yet</p>
          <p className="text-xs text-muted-foreground">Patient history will appear here once captured via the Care Link kiosk.</p>
          <Button variant="outline" onClick={() => setView("DOCTOR_HOME")}>Back to Dashboard</Button>
        </div>
      ) : (
        <div className="space-y-3 pb-24">
          {/* Verification status card */}
          <div className={cn("rounded-2xl border p-4 card-soft",
            status === "accepted" ? "border-emerald-500/30 bg-emerald-500/5" :
            status === "rejected" ? "border-red-500/30 bg-red-500/10" :
            "border-amber-500/30 bg-amber-500/5")}>
            <div className="flex items-center gap-2 text-sm font-bold">
              {status === "accepted" ? <CheckCircle2 className="size-5 text-emerald-600" /> :
               status === "rejected" ? <ShieldAlert className="size-5 text-red-600" /> :
               <Sparkles className="size-5 text-amber-600" />}
              {status === "accepted" ? "Accepted & Verified" :
               status === "rejected" ? "Marked for manual re-elicitation" :
               "AI-Generated Draft — Review Required"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {status === "pending"
                ? "This is a draft. Verify before finalizing. Never an independent diagnosis."
                : status === "accepted"
                ? "Verified and saved to the patient's record."
                : "Flagged for the clinician to re-verify during consultation."}
            </p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="outline" onClick={handleEdit} disabled={accepted}>
                <Pencil className="size-3.5" /> Edit
              </Button>
              <Button size="sm" variant="outline" onClick={handleReject} disabled={accepted} className="text-red-600">
                <RotateCcw className="size-3.5" /> Reject
              </Button>
              <Button size="sm" onClick={handleAccept} className="ml-auto">
                {accepted ? <><Check className="size-4" /> Verified</> : <><Check className="size-4" /> Verify & Confirm</>}
              </Button>
            </div>
          </div>

          {/* Red flags */}
          <ClinicalCard icon={ShieldAlert} iconTone="text-red-600 bg-red-500/10" title="Red Flags / Triage">
            <p className="text-sm font-medium text-red-700">{summary.redFlags}</p>
          </ClinicalCard>

          {/* Chief complaint + HPI */}
          <ClinicalCard icon={Stethoscope} iconTone="text-primary bg-primary/10" title="Chief Complaint">
            <p className="text-sm font-semibold">{summary.chiefComplaint}</p>
          </ClinicalCard>
          <ClinicalCard icon={Info} iconTone="text-sky-600 bg-sky-500/10" title="History of Present Illness">
            <EditableText editing={editing} value={field("hpi", summary.hpi)} onChange={(v) => setField("hpi", v)} />
          </ClinicalCard>

          {/* Past history */}
          <ClinicalCard icon={FileText} iconTone="text-violet-600 bg-violet-500/10" title="Past Medical History">
            <EditableText editing={editing} value={field("pastMedicalHistory", summary.pastMedicalHistory)} onChange={(v) => setField("pastMedicalHistory", v)} />
          </ClinicalCard>
          <ClinicalCard icon={FileText} iconTone="text-violet-600 bg-violet-500/10" title="Past Surgical History">
            <EditableText editing={editing} value={field("pastSurgicalHistory", summary.pastSurgicalHistory)} onChange={(v) => setField("pastSurgicalHistory", v)} />
          </ClinicalCard>

          {/* Meds / allergies */}
          <ClinicalCard icon={Pill} iconTone="text-emerald-600 bg-emerald-500/10" title="Current Medications">
            <EditableText editing={editing} value={field("currentMedications", summary.currentMedications)} onChange={(v) => setField("currentMedications", v)} />
          </ClinicalCard>
          <ClinicalCard icon={Pill} iconTone="text-red-600 bg-red-500/10" title="Allergies">
            <EditableText editing={editing} value={field("allergies", summary.allergies)} onChange={(v) => setField("allergies", v)} />
          </ClinicalCard>

          {/* Family / personal */}
          <ClinicalCard icon={Users} iconTone="text-amber-600 bg-amber-500/10" title="Family History">
            <EditableText editing={editing} value={field("familyHistory", summary.familyHistory)} onChange={(v) => setField("familyHistory", v)} />
          </ClinicalCard>
          <ClinicalCard icon={Users} iconTone="text-amber-600 bg-amber-500/10" title="Personal & Social History">
            <EditableText editing={editing} value={field("personalHistory", summary.personalHistory)} onChange={(v) => setField("personalHistory", v)} />
          </ClinicalCard>

          {/* AYUSH — moved before documents for clinical ordering */}
          {summary.ayushSummary && (
            <ClinicalCard icon={Sparkles} iconTone="text-amber-600 bg-amber-500/10" title="AYUSH (Dashavidha Pariksha)">
              <p className="text-sm">{summary.ayushSummary}</p>
            </ClinicalCard>
          )}

          {/* Documents / investigations */}
          <ClinicalCard icon={FileText} iconTone="text-sky-600 bg-sky-500/10" title="Prior Documents">
            <EditableText editing={editing} value={field("documentSummary", summary.documentSummary)} onChange={(v) => setField("documentSummary", v)} />
          </ClinicalCard>
          <ClinicalCard icon={Sparkles} iconTone="text-amber-600 bg-amber-500/10" title="Investigation Highlights">
            <EditableText editing={editing} value={field("investigationHighlights", summary.investigationHighlights)} onChange={(v) => setField("investigationHighlights", v)} />
          </ClinicalCard>

          {/* ROS */}
          <ClinicalCard icon={Info} iconTone="text-sky-600 bg-sky-500/10" title="Review of Systems">
            <EditableText editing={editing} value={field("reviewOfSystems", summary.reviewOfSystems)} onChange={(v) => setField("reviewOfSystems", v)} />
          </ClinicalCard>

          {/* Source evidence / traceability */}
          {(summary.sourceEvidence?.length ?? 0) > 0 && (
            <ClinicalCard icon={FileText} iconTone="text-emerald-600 bg-emerald-500/10" title="Source Evidence & Traceability">
              <div className="space-y-2">
                {summary.sourceEvidence.map((ev, i) => (
                  <div key={i} className="flex items-start gap-2 border-t border-border/60 pt-2 first:border-0 first:pt-0">
                    <span
                      className={cn(
                        "mt-0.5 inline-block shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase",
                        ev.status === "needs-verification"
                          ? "bg-amber-500/15 text-amber-700"
                          : "bg-emerald-500/15 text-emerald-700"
                      )}
                    >
                      {ev.status}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold">{ev.field}</p>
                      <p className="text-xs text-foreground/90">{ev.value}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ev.source}
                        {typeof ev.confidence === "number" ? ` · ${Math.round(ev.confidence * 100)}% conf` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ClinicalCard>
          )}

          {saved && (
            <div className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 py-2 text-xs font-medium text-emerald-700">
              <Check className="size-4" /> Edits saved to clinical history
            </div>
          )}

          {editing && (
            <Button className="w-full" onClick={handleSaveEdits}>
              <Check className="size-4" /> Save Edits
            </Button>
          )}

          {/* Interview transcript */}
          {(kiosk?.conversationTurns?.length ?? 0) > 0 && (
            <ClinicalCard icon={MessageSquareText} iconTone="text-sky-600 bg-sky-500/10" title="Interview Transcript">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="flex w-full items-center justify-between text-xs font-medium text-muted-foreground"
              >
                {showTranscript ? "Hide transcript" : `View original conversation (${kiosk?.conversationTurns?.length ?? 0} turns)`}
                <ChevronDown className={cn("size-4 transition-transform", showTranscript && "rotate-180")} />
              </button>
              {showTranscript && (
                <div className="mt-3 max-h-72 space-y-2 overflow-y-auto">
                  {kiosk?.conversationTurns.map((turn) => (
                    <div key={turn.id} className={cn("rounded-lg px-2.5 py-2 text-xs", turn.role === "system" ? "bg-muted" : "ml-4 bg-primary/5")}>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{turn.role}</p>
                      <p className="mt-0.5">{turn.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </ClinicalCard>
          )}
        </div>
      )}
    </DoctorPageShell>
  );
}

function EditableText({ editing, value, onChange }: { editing: boolean; value: string; onChange: (v: string) => void }) {
  if (!editing) return <p className="text-sm">{value}</p>;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function ClinicalCard({ icon: Icon, iconTone, title, children }: {
  icon: React.ComponentType<{ className?: string }>;
  iconTone: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-background p-3.5 card-soft">
      <div className="mb-1.5 flex items-center gap-2">
        <span className={cn("flex size-7 items-center justify-center rounded-lg", iconTone)}>
          <Icon className="size-4" />
        </span>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      {children}
    </motion.div>
  );
}
