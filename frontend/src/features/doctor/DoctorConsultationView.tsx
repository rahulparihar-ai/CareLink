"use client";

import { useState } from "react";
import {
  Stethoscope, Pill, FlaskConical,
  CalendarPlus, FileUp, Check, CheckCircle2, Plus, Trash2, ArrowRight,
} from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { Button } from "@/components/ui/button";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import { cn } from "@/utils";
import { uid } from "@/lib/brand/constants";
import type { StructuredNote, PrescriptionDraft, InvestigationRequest } from "@/types";

type SectionTab = "notes" | "prescription" | "investigations" | "followup";

const NOTE_SECTIONS: { key: StructuredNote["section"]; label: string }[] = [
  { key: "chief-complaint", label: "Chief Complaint" },
  { key: "history", label: "History" },
  { key: "examination", label: "Examination" },
  { key: "assessment", label: "Assessment" },
  { key: "plan", label: "Plan" },
  { key: "advice", label: "Advice" },
  { key: "follow-up", label: "Follow-up" },
];

export function DoctorConsultationView() {
  const setView = useAppStore((s) => s.setView);
  const selectedPatientId = useAppStore((s) => s.selectedPatientId);
  const currentTab = useAppStore((s) => s.currentView as never);
  const caseQueue = useAppStore((s) => s.caseQueue);
  const updateCaseRecord = useAppStore((s) => s.updateCaseRecord);
  const doctor = useAppStore((s) => s.doctorProfile);

  const patient = caseQueue.find((p) => p.id === selectedPatientId) ?? caseQueue[0];

  const [tab, setTab] = useState<SectionTab>("notes");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const rxDrafts: PrescriptionDraft[] = (patient?.prescriptions?.length ? patient.prescriptions : [{ medicine: "", dose: "", frequency: "", duration: "", confirmed: false }]);
  const [investigation, setInvestigation] = useState("");
  const [invReason, setInvReason] = useState("");
  const [invNote, setInvNote] = useState("");
  const [invPriority, setInvPriority] = useState<"routine" | "urgent">("routine");
  const [followNote, setFollowNote] = useState("");
  const [followReason, setFollowReason] = useState("");
  const [docRequest, setDocRequest] = useState("");
  const [savedFlash, setSavedFlash] = useState("");

  const addAudit = (action: string, detail?: string) => {
    useAppStore.getState().addAuditEvent({
      id: uid("audit"),
      actor: doctor?.name ?? "Doctor",
      role: "DOCTOR",
      action,
      targetType: "DoctorPatientRecord",
      targetId: patient?.id ?? "",
      detail: detail ?? `${patient?.name ?? ""}`,
      timestamp: new Date().toISOString(),
    });
  };

  if (!patient) {
    return (
      <DoctorPageShell title="Consultation" currentTab={currentTab as string} onBack={() => setView("DOCTOR_QUEUE")}>
        <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">No patient selected</p>
          <p className="mt-1 text-xs text-muted-foreground">Choose a patient from the queue.</p>
        </div>
      </DoctorPageShell>
    );
  }

  const flash = (msg: string) => {
    setSavedFlash(msg);
    setTimeout(() => setSavedFlash(""), 2200);
  };

  const saveNoteSection = (section: StructuredNote["section"]) => {
    const content = drafts[section]?.trim();
    if (!content) return;
    const existing: StructuredNote[] = patient?.consultNotes ?? [];
    const others = existing.filter((n) => n.section !== section);
    updateCaseRecord(patient.id, {
      consultNotes: [...others, { id: uid("note"), section, content, updatedAt: new Date().toISOString() }],
    });
    setDrafts((d) => ({ ...d, [section]: "" }));
    addAudit("NOTE_SAVED", section);
    flash("Note saved");
  };

  const setRx = (arr: PrescriptionDraft[]) => updateCaseRecord(patient.id, { prescriptions: arr });
  const addRxRow = () => setRx([...rxDrafts, { medicine: "", dose: "", frequency: "", duration: "", confirmed: false }]);
  const finalizeRx = () => {
    setRx(rxDrafts.map((r) => ({ ...r, confirmed: true })));
    addAudit("PRESCRIPTION_FINALIZED");
    flash("Prescription finalized");
  };

  const addInvestigation = () => {
    if (!investigation.trim() || !invReason.trim()) return;
    const inv: InvestigationRequest = {
      id: uid("inv"),
      investigation: investigation.trim(),
      reason: invReason.trim(),
      priority: invPriority,
      notes: invNote.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    updateCaseRecord(patient.id, { investigationRequests: [...(patient?.investigationRequests ?? []), inv] });
    setInvestigation(""); setInvReason(""); setInvNote("");
    addAudit("INVESTIGATION_REQUESTED", inv.investigation);
    flash("Investigation added");
  };

  const addFollowUp = () => {
    if (!followNote.trim()) return;
    const n = { id: uid("note"), type: "follow-up" as const, content: `${followReason.trim() ? followReason.trim() + " — " : ""}${followNote.trim()}`, timestamp: new Date().toISOString(), status: "saved" as const };
    updateCaseRecord(patient.id, { notes: [...(patient?.notes ?? []), n] });
    setFollowNote(""); setFollowReason("");
    addAudit("FOLLOWUP_CREATED", followReason.trim());
    flash("Follow-up scheduled");
  };

  const addDocRequest = () => {
    if (!docRequest.trim()) return;
    updateCaseRecord(patient.id, {
      documentRequests: [...(patient?.documentRequests ?? []), {
        id: uid("req"), title: docRequest.trim(), detail: docRequest.trim(),
        status: "pending", createdAt: new Date().toISOString(),
      }],
    });
    setDocRequest("");
    addAudit("DOCUMENT_REQUESTED", docRequest.trim());
    flash("Document requested from patient");
  };

  const consultNotes = patient?.consultNotes ?? [];
  const investigationRequests = patient?.investigationRequests ?? [];
  const documentRequests = patient?.documentRequests ?? [];

  return (
    <DoctorPageShell
      title={`Consultation · ${patient.name}`}
      currentTab={currentTab as string}
      sub={`${patient.age} · ${patient.gender} · ${patient.patientId}`}
      onBack={() => setView("DOCTOR_PATIENT")}
      right={<StatusBadge variant={statusVariant(patient.status)} dot>{patient.status.replace("_", " ")}</StatusBadge>}
    >
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700 dark:text-emerald-300">
        <p className="flex items-center gap-1.5"><Stethoscope className="size-4" /> Clinical consultation workspace. All notes require your review before saving.</p>
      </div>

      {savedFlash && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700"><CheckCircle2 className="size-4" /> {savedFlash}</div>
      )}

      {/* Section tabs */}
      <div className="mb-4 mt-4 flex gap-1 overflow-x-auto no-scrollbar rounded-xl bg-muted/70 p-1">
        {([
          ["notes", "Notes"],
          ["prescription", "Prescription"],
          ["investigations", "Investigations"],
          ["followup", "Follow-up"],
        ] as [SectionTab, string][]).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cn("flex-1 shrink-0 rounded-lg px-2 py-2 text-xs font-semibold transition-colors", tab === k ? "bg-card shadow-sm" : "text-muted-foreground")}>
            {label}
          </button>
        ))}
      </div>

      {/* ============ STRUCTURED NOTES ============ */}
      {tab === "notes" && (
        <div>
          <div className="space-y-3">
            {NOTE_SECTIONS.map((s) => {
              const saved = consultNotes.find((n) => n.section === s.key);
              return (
                <div key={s.key} className="rounded-2xl border border-border bg-card p-3.5 card-soft">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{s.label}</p>
                    {saved && <StatusBadge variant="success" dot>Saved</StatusBadge>}
                  </div>
                  {saved && <p className="mt-2 rounded-lg bg-muted/40 p-2.5 text-sm">{saved.content}</p>}
                  <textarea value={drafts[s.key] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))} rows={2}
                    placeholder={`Add ${s.label.toLowerCase()}…`}
                    className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <Button size="sm" variant="outline" className="mt-2" disabled={!drafts[s.key]?.trim()} onClick={() => saveNoteSection(s.key)}>
                    <Check className="size-4 mr-1" /> Save note
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ PRESCRIPTION BUILDER ============ */}
      {tab === "prescription" && (
        <div>
          <div className="space-y-2.5">
            {rxDrafts.map((r, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-3 card-soft">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Medicine {i + 1}</span>
                  {i > 0 && <button onClick={() => setRx(rxDrafts.filter((_, j) => j !== i))} className="text-red-500"><Trash2 className="size-4" /></button>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={r.medicine} onChange={(e) => setRx(rxDrafts.map((x, j) => j === i ? { ...x, medicine: e.target.value } : x))} placeholder="Medicine" className="col-span-2 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <input value={r.dose} onChange={(e) => setRx(rxDrafts.map((x, j) => j === i ? { ...x, dose: e.target.value } : x))} placeholder="Dose (e.g. 5 mg)" className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <input value={r.frequency} onChange={(e) => setRx(rxDrafts.map((x, j) => j === i ? { ...x, frequency: e.target.value } : x))} placeholder="Frequency" className="rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                  <input value={r.duration} onChange={(e) => setRx(rxDrafts.map((x, j) => j === i ? { ...x, duration: e.target.value } : x))} placeholder="Duration" className="col-span-2 rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={addRxRow}><Plus className="size-4 mr-1" /> Add medicine</Button>
            <Button onClick={finalizeRx}><Pill className="size-4 mr-1" /> Finalize script</Button>
          </div>
        </div>
      )}

      {/* ============ INVESTIGATIONS ============ */}
      {tab === "investigations" && (
        <div>
          <div className="rounded-2xl border border-border bg-card p-3.5 card-soft">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><FlaskConical className="size-4 text-primary" /> New investigation request</p>
            <input value={investigation} onChange={(e) => setInvestigation(e.target.value)} placeholder="Investigation (e.g. HbA1c)" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <input value={invReason} onChange={(e) => setInvReason(e.target.value)} placeholder="Reason" className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <input value={invNote} onChange={(e) => setInvNote(e.target.value)} placeholder="Notes (optional)" className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <div className="mt-2 flex gap-2">
              <button onClick={() => setInvPriority("routine")} className={cn("flex-1 rounded-lg px-3 py-2 text-xs font-medium", invPriority === "routine" ? "bg-primary text-primary-foreground" : "bg-muted")}>Routine</button>
              <button onClick={() => setInvPriority("urgent")} className={cn("flex-1 rounded-lg px-3 py-2 text-xs font-medium", invPriority === "urgent" ? "bg-red-500 text-white" : "bg-muted")}>Urgent</button>
            </div>
            <Button className="mt-3 w-full" disabled={!investigation.trim() || !invReason.trim()} onClick={addInvestigation}>Add investigation</Button>
          </div>

          {investigationRequests.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Requested</p>
              {investigationRequests.map((inv) => (
                <div key={inv.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <p className="flex-1 text-sm font-semibold">{inv.investigation}</p>
                    <StatusBadge variant={inv.priority === "urgent" ? "danger" : "muted"} dot>{inv.priority}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{inv.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ FOLLOW-UP + DOCUMENT REQUEST ============ */}
      {tab === "followup" && (
        <div>
          <div className="rounded-2xl border border-border bg-card p-3.5 card-soft">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><CalendarPlus className="size-4 text-primary" /> Schedule follow-up</p>
            <input value={followReason} onChange={(e) => setFollowReason(e.target.value)} placeholder="Follow-up reason" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <textarea value={followNote} onChange={(e) => setFollowNote(e.target.value)} rows={2} placeholder="Instructions / notes" className="mt-2 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <Button className="mt-3 w-full" disabled={!followNote.trim()} onClick={addFollowUp}>Create follow-up</Button>
          </div>

          <div className="mt-4 rounded-2xl border border-border bg-card p-3.5 card-soft">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><FileUp className="size-4 text-primary" /> Request document from patient</p>
            <input value={docRequest} onChange={(e) => setDocRequest(e.target.value)} placeholder='e.g. Previous blood test report' className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <Button className="mt-3 w-full" variant="outline" disabled={!docRequest.trim()} onClick={addDocRequest}>Send request</Button>
          </div>

          {documentRequests.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Open requests</p>
              {documentRequests.map((rq) => (
                <div key={rq.id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-3">
                  <p className="flex-1 text-sm">{rq.title}</p>
                  <StatusBadge variant={rq.status === "fulfilled" ? "success" : "warning"} dot>{rq.status}</StatusBadge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Complete consultation */}
      <div className="mt-6">
        <Button size="lg" className="h-13 w-full text-base" onClick={() => {
          updateCaseRecord(patient.id, { status: "COMPLETED" });
          addAudit("CONSULTATION_COMPLETED");
          flash("Consultation completed. Patient record updated.");
          setTimeout(() => {
            setView("DOCTOR_HOME");
          }, 900);
        }}>
          Complete Consultation <ArrowRight className="ml-1.5" />
        </Button>
      </div>
    </DoctorPageShell>
  );
}