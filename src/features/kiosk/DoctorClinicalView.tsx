"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ShieldAlert, Stethoscope, FileText, Pill, Users, Info,
  Sparkles, Check, Pencil, RotateCcw, CheckCircle2, ScrollText,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { cn } from "@/lib/utils";

export function DoctorClinicalView() {
  const setView = useAppStore((s) => s.setView);
  const kiosk = useAppStore((s) => s.kioskSession);
  const summary = kiosk?.summary;
  const setPhysicianSummary = useAppStore((s) => s.setPhysicianSummary);
  const [editing, setEditing] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState<"pending" | "accepted" | "edited" | "rejected">(
    summary?.verificationStatus ?? "pending"
  );

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

  const handleEdit = () => setEditing(true);

  return (
    <DoctorPageShell title="Clinical History" currentTab="DOCTOR_CASES">
      {!summary ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ScrollText className="size-7" />
          </span>
          <p className="text-sm font-semibold">No clinical history yet</p>
          <p className="text-xs text-muted-foreground">Patient history will appear here once captured via MediKiosk.</p>
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
            <EditableText editing={editing} value={summary.hpi} />
          </ClinicalCard>

          {/* Past history */}
          <ClinicalCard icon={FileText} iconTone="text-violet-600 bg-violet-500/10" title="Past Medical History">
            <EditableText editing={editing} value={summary.pastMedicalHistory} />
          </ClinicalCard>
          <ClinicalCard icon={FileText} iconTone="text-violet-600 bg-violet-500/10" title="Past Surgical History">
            <EditableText editing={editing} value={summary.pastSurgicalHistory} />
          </ClinicalCard>

          {/* Meds / allergies */}
          <ClinicalCard icon={Pill} iconTone="text-emerald-600 bg-emerald-500/10" title="Current Medications">
            <EditableText editing={editing} value={summary.currentMedications} />
          </ClinicalCard>
          <ClinicalCard icon={Pill} iconTone="text-red-600 bg-red-500/10" title="Allergies">
            <EditableText editing={editing} value={summary.allergies} />
          </ClinicalCard>

          {/* Family / personal */}
          <ClinicalCard icon={Users} iconTone="text-amber-600 bg-amber-500/10" title="Family History">
            <EditableText editing={editing} value={summary.familyHistory} />
          </ClinicalCard>
          <ClinicalCard icon={Users} iconTone="text-amber-600 bg-amber-500/10" title="Personal & Social History">
            <EditableText editing={editing} value={summary.personalHistory} />
          </ClinicalCard>

          {/* Documents / investigations */}
          <ClinicalCard icon={FileText} iconTone="text-sky-600 bg-sky-500/10" title="Prior Documents">
            <EditableText editing={editing} value={summary.documentSummary} />
          </ClinicalCard>
          <ClinicalCard icon={Sparkles} iconTone="text-amber-600 bg-amber-500/10" title="Investigation Highlights">
            <EditableText editing={editing} value={summary.investigationHighlights} />
          </ClinicalCard>

          {/* ROS */}
          <ClinicalCard icon={Info} iconTone="text-sky-600 bg-sky-500/10" title="Review of Systems">
            <EditableText editing={editing} value={summary.reviewOfSystems} />
          </ClinicalCard>

          {editing && (
            <Button className="w-full" onClick={() => setEditing(false)}>
              <Check className="size-4" /> Save Edits
            </Button>
          )}

          {summary.ayushSummary && (
            <ClinicalCard icon={Sparkles} iconTone="text-amber-600 bg-amber-500/10" title="AYUSH (Dashavidha Pariksha)">
              <p className="text-sm">{summary.ayushSummary}</p>
            </ClinicalCard>
          )}
        </div>
      )}
    </DoctorPageShell>
  );
}

function EditableText({ editing, value }: { editing: boolean; value: string }) {
  const [val, setVal] = useState(value);
  if (!editing) return <p className="text-sm">{val}</p>;
  return (
    <textarea
      value={val}
      onChange={(e) => setVal(e.target.value)}
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
