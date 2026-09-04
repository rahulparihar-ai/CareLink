"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Edit3, Eye, AlertTriangle,
  ChevronDown, ChevronRight, ArrowLeft, Shield, FileText,
  Clock, Leaf,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";
import type { AssessmentField, EvidenceItem } from "@/types/ayush";

type VerifyAction = "verify" | "edit" | "reject";

export function DoctorAyushReview() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const selectedPatientId = useAppStore((s) => s.selectedPatientId);
  const ayushDoctorQueue = useAppStore((s) => s.ayushDoctorQueue);
  const updateAyushQueueEntry = useAppStore((s) => s.updateAyushQueueEntry);
  const addAyushVisitEntry = useAppStore((s) => s.addAyushVisitEntry);

  const [expandedSection, setExpandedSection] = useState<string | null>("chief");
  const [fieldVerifications, setFieldVerifications] = useState<Record<string, VerifyAction>>({});
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showEvidence, setShowEvidence] = useState<EvidenceItem | null>(null);
  const [activeTab, setActiveTab] = useState<"history" | "ayurvedic" | "redflags" | "summary">("history");

  // Find the queue entry for the selected patient
  const queueEntry = ayushDoctorQueue.find((e) => e.patientId === selectedPatientId) || ayushDoctorQueue[0];
  const summary = queueEntry?.summary;

  if (!summary || !queueEntry) {
    return (
      <div className="min-h-dvh bg-background pb-safe-nav">
        <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-md">
          <Button variant="ghost" size="icon" onClick={() => setView("DOCTOR_HOME")} className="-ml-1">
            <ArrowLeft className="size-5" />
          </Button>
          <h1 className="text-base font-semibold">{t("ayush.doctorReviewTitle")}</h1>
        </header>
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <Leaf className="mb-4 size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("ayush.noAysuhData")}</p>
          <Button className="mt-4" onClick={() => setView("DOCTOR_HOME")}>{t("common.back")}</Button>
        </div>
      </div>
    );
  }

  const history = summary.clinicalHistory;
  const assessment = summary.ayurvedicAssessment;
  const redFlags = summary.redFlags;

  const toggleVerify = (fieldKey: string, action: VerifyAction) => {
    setFieldVerifications((prev) => ({
      ...prev,
      [fieldKey]: prev[fieldKey] === action ? undefined! : action,
    }));
  };

  const handleEdit = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditValue(currentValue);
  };

  const getFieldValue = (fieldKey: string): string => {
    const hist = history as unknown as Record<string, unknown>;
    const ayurved = assessment as unknown as Record<string, unknown>;
    const dash = assessment.dashavidha as unknown as Record<string, unknown>;
    if (hist[fieldKey] && typeof hist[fieldKey] === "object" && hist[fieldKey] !== null && "value" in (hist[fieldKey] as Record<string, unknown>)) {
      return ((hist[fieldKey] as Record<string, unknown>).value as string) || "";
    }
    if (dash[fieldKey] && typeof dash[fieldKey] === "object" && dash[fieldKey] !== null && "value" in (dash[fieldKey] as Record<string, unknown>)) {
      return ((dash[fieldKey] as Record<string, unknown>).value as string) || "";
    }
    if (ayurved[fieldKey] && typeof ayurved[fieldKey] === "object" && ayurved[fieldKey] !== null && "value" in (ayurved[fieldKey] as Record<string, unknown>)) {
      return ((ayurved[fieldKey] as Record<string, unknown>).value as string) || "";
    }
    return "";
  };

  const saveEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleVerifyAll = () => {
    updateAyushQueueEntry(queueEntry.id, {
      status: "COMPLETED",
      summary: { ...summary, verificationStatus: "doctor_verified", verifiedBy: "current-doctor", verifiedAt: new Date().toISOString() },
    });
    addAyushVisitEntry({
      id: `visit-${Date.now()}`,
      visitDate: new Date().toISOString(),
      visitNumber: 1,
      chiefComplaint: history.chiefComplaint.value,
      prakritiVerified: fieldVerifications["prakriti"] === "verify",
      vikritiValue: assessment.dashavidha.vikriti.value,
      agniValue: assessment.agni.value,
      koshthaValue: assessment.koshtha.value,
      symptoms: history.associatedSymptoms.value ? [history.associatedSymptoms.value] : [],
      summary: summary.aiSummaryText,
      sessionId: queueEntry.sessionId,
    });
    setView("DOCTOR_HOME");
  };

  const tabs = [
    { id: "history" as const, label: t("ayush.tabHistory"), icon: FileText },
    { id: "ayurvedic" as const, label: t("ayush.tabAyurvedic"), icon: Leaf },
    { id: "redflags" as const, label: t("ayush.tabRedFlags"), icon: AlertTriangle, count: redFlags.length },
    { id: "summary" as const, label: t("ayush.tabSummary"), icon: Shield },
  ];

  const f = (fieldKey: string): Omit<FieldCardProps, "label" | "field" | "fieldKey"> => ({
    verification: fieldVerifications[fieldKey],
    editing: editingField === fieldKey,
    editValue,
    onEditValue: setEditValue,
    onSaveEdit: saveEdit,
    onEdit: handleEdit,
    onVerify: toggleVerify,
    onShowEvidence: setShowEvidence,
    getCurrentValue: getFieldValue,
    t,
  });

  return (
    <div className="min-h-dvh bg-background pb-safe-nav">
      {/* Evidence Modal */}
      <AnimatePresence>
        {showEvidence && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowEvidence(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-3 text-sm font-bold">{t("ayush.evidenceTitle")}</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t("ayush.evidenceSource")}</p>
                  <p className="text-xs">{showEvidence.sourceType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t("ayush.evidenceOriginal")}</p>
                  <p className="text-xs italic border-l-2 border-primary pl-2">&ldquo;{showEvidence.originalResponse}&rdquo;</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-muted-foreground">{t("ayush.evidenceStructured")}</p>
                  <p className="text-xs">{showEvidence.structuredInterpretation}</p>
                </div>
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => setShowEvidence(null)}>
                {t("common.close")}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => setView("DOCTOR_HOME")} className="-ml-1">
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-semibold">{t("ayush.doctorReviewTitle")}</h1>
          <p className="text-[10px] text-muted-foreground">{t("ayush.doctorReviewSubtitle")}</p>
        </div>
        <Button size="sm" onClick={handleVerifyAll}>
          <CheckCircle2 className="mr-1 size-3.5" />
          {t("ayush.verifyAll")}
        </Button>
      </header>

      {/* Patient Info Bar */}
      <div className="border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
            {queueEntry.patientName.charAt(0)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold">{queueEntry.patientName}</p>
            <p className="text-xs text-muted-foreground">
              {queueEntry.age}y {queueEntry.gender} &middot; {queueEntry.chiefComplaint}
            </p>
          </div>
          <div className="text-right">
            <span className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              queueEntry.redFlagLevel === "URGENT" ? "bg-red-500/10 text-red-600" :
              queueEntry.redFlagLevel === "NEEDS_REVIEW" ? "bg-amber-500/10 text-amber-600" :
              "bg-green-500/10 text-green-600"
            )}>
              {queueEntry.redFlagLevel}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <tab.icon className="size-3.5" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        <div className="mx-auto max-w-lg space-y-3">
          {/* History Tab */}
          {activeTab === "history" && (
            <>
              <SectionCard title={t("ayush.sectionChiefComplaint")} icon="🎯" expanded={expandedSection === "chief"} onToggle={() => setExpandedSection(expandedSection === "chief" ? null : "chief")}>
                <FieldCard label={t("ayush.fieldChiefComplaint")} field={history.chiefComplaint} fieldKey="chiefComplaint" {...f("chiefComplaint")} />
                <FieldCard label={t("ayush.fieldDuration")} field={history.duration} fieldKey="duration" {...f("duration")} />
                <FieldCard label={t("ayush.fieldSeverity")} field={history.severity} fieldKey="severity" {...f("severity")} />
                <FieldCard label={t("ayush.fieldPattern")} field={history.pattern} fieldKey="pattern" {...f("pattern")} />
                <FieldCard label={t("ayush.fieldAggravating")} field={history.aggravatingFactors} fieldKey="aggravatingFactors" {...f("aggravatingFactors")} />
                <FieldCard label={t("ayush.fieldRelieving")} field={history.relievingFactors} fieldKey="relievingFactors" {...f("relievingFactors")} />
                <FieldCard label={t("ayush.fieldAssociated")} field={history.associatedSymptoms} fieldKey="associatedSymptoms" {...f("associatedSymptoms")} />
              </SectionCard>
              <SectionCard title={t("ayush.sectionMedicalHistory")} icon="📋" expanded={expandedSection === "medical"} onToggle={() => setExpandedSection(expandedSection === "medical" ? null : "medical")}>
                <FieldCard label={t("ayush.fieldPastMedical")} field={history.pastMedicalHistory} fieldKey="pastMedicalHistory" {...f("pastMedicalHistory")} />
                <FieldCard label={t("ayush.fieldMedications")} field={history.currentMedications} fieldKey="currentMedications" {...f("currentMedications")} />
                <FieldCard label={t("ayush.fieldAllergies")} field={history.allergies} fieldKey="allergies" {...f("allergies")} />
                <FieldCard label={t("ayush.fieldFamily")} field={history.familyHistory} fieldKey="familyHistory" {...f("familyHistory")} />
              </SectionCard>
              <SectionCard title={t("ayush.sectionLifestyle")} icon="🏃" expanded={expandedSection === "lifestyle"} onToggle={() => setExpandedSection(expandedSection === "lifestyle" ? null : "lifestyle")}>
                <FieldCard label={t("ayush.fieldDiet")} field={history.dietHistory} fieldKey="dietHistory" {...f("dietHistory")} />
                <FieldCard label={t("ayush.fieldSleep")} field={history.sleepHistory} fieldKey="sleepHistory" {...f("sleepHistory")} />
                <FieldCard label={t("ayush.fieldBowel")} field={history.bowelHistory} fieldKey="bowelHistory" {...f("bowelHistory")} />
              </SectionCard>
            </>
          )}

          {/* Ayurvedic Tab */}
          {activeTab === "ayurvedic" && (
            <>
              <SectionCard title={t("ayush.sectionDashavidha")} icon="🔮" expanded={expandedSection === "dashavidha"} onToggle={() => setExpandedSection(expandedSection === "dashavidha" ? null : "dashavidha")}>
                <FieldCard label={t("ayush.fieldPrakriti")} field={assessment.dashavidha.prakriti} fieldKey="prakriti" {...f("prakriti")} />
                <FieldCard label={t("ayush.fieldVikriti")} field={assessment.dashavidha.vikriti} fieldKey="vikriti" {...f("vikriti")} />
                <FieldCard label={t("ayush.fieldSara")} field={assessment.dashavidha.sara} fieldKey="sara" {...f("sara")} />
                <FieldCard label={t("ayush.fieldSamhanana")} field={assessment.dashavidha.samhanana} fieldKey="samhanana" {...f("samhanana")} />
                <FieldCard label={t("ayush.fieldSattva")} field={assessment.dashavidha.sattva} fieldKey="sattva" {...f("sattva")} />
                <FieldCard label={t("ayush.fieldVyayama")} field={assessment.dashavidha.vyayamaShakti} fieldKey="vyayamaShakti" {...f("vyayamaShakti")} />
              </SectionCard>
              <SectionCard title={t("ayush.sectionAyurvedicClinical")} icon="🌿" expanded={expandedSection === "ayClinical"} onToggle={() => setExpandedSection(expandedSection === "ayClinical" ? null : "ayClinical")}>
                <FieldCard label={t("ayush.fieldAgni")} field={assessment.agni} fieldKey="agni" {...f("agni")} />
                <FieldCard label={t("ayush.fieldKoshtha")} field={assessment.koshtha} fieldKey="koshtha" {...f("koshtha")} />
                <FieldCard label={t("ayush.fieldAharaVihara")} field={assessment.aharaVihara} fieldKey="aharaVihara" {...f("aharaVihara")} />
                <FieldCard label={t("ayush.fieldNidana")} field={assessment.nidana} fieldKey="nidana" {...f("nidana")} />
                <FieldCard label={t("ayush.fieldSamprapti")} field={assessment.sampraptiContext} fieldKey="sampraptiContext" {...f("sampraptiContext")} />
              </SectionCard>
            </>
          )}

          {/* Red Flags Tab */}
          {activeTab === "redflags" && (
            <>
              {redFlags.length === 0 ? (
                <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 text-center">
                  <CheckCircle2 className="mx-auto mb-2 size-8 text-green-500" />
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">{t("ayush.noRedFlags")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("ayush.noRedFlagsDesc")}</p>
                </div>
              ) : (
                redFlags.map((rf) => (
                  <div key={rf.id} className="rounded-xl border border-red-500/30 bg-red-500/5 p-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-red-500" />
                      <span className="text-sm font-bold text-red-600">{rf.rule}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{rf.reason}</p>
                    {rf.patientResponse && (
                      <p className="mt-1 text-xs italic text-muted-foreground">&ldquo;{rf.patientResponse}&rdquo;</p>
                    )}
                    <span className="mt-2 inline-block rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                      {rf.level}
                    </span>
                  </div>
                ))
              )}
            </>
          )}

          {/* AI Summary Tab */}
          {activeTab === "summary" && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="size-4 text-primary" />
                <h3 className="text-sm font-bold">{t("ayush.aiGeneratedSummary")}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{summary.aiSummaryText}</p>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Clock className="size-3" />
                {new Date(summary.generatedAt).toLocaleString()}
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                {summary.sourceEvidence.length} {t("ayush.sourceEvidenceItems")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title, icon, expanded, onToggle, children,
}: {
  title: string; icon: string; expanded: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button onClick={onToggle} className="flex w-full items-center gap-2 p-3 text-left">
        <span className="text-lg">{icon}</span>
        <span className="flex-1 text-sm font-semibold">{title}</span>
        {expanded ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
      </button>
      {expanded && <div className="space-y-2 border-t border-border px-3 pb-3 pt-2">{children}</div>}
    </div>
  );
}

interface FieldCardProps {
  label: string;
  field: AssessmentField;
  fieldKey: string;
  verification?: VerifyAction;
  editing: boolean;
  editValue: string;
  onEditValue: (v: string) => void;
  onSaveEdit: () => void;
  onEdit: (fieldKey: string, currentValue: string) => void;
  onVerify: (fieldKey: string, action: VerifyAction) => void;
  onShowEvidence: (e: EvidenceItem | null) => void;
  getCurrentValue: (fieldKey: string) => string;
  t: (key: string) => string;
}

function VerifyButtons({
  fieldKey, verification, onVerify, onEdit, getCurrentValue, t,
}: {
  fieldKey: string;
  verification?: VerifyAction;
  onVerify: FieldCardProps["onVerify"];
  onEdit: FieldCardProps["onEdit"];
  getCurrentValue: (fieldKey: string) => string;
  t: FieldCardProps["t"];
}) {
  return (
    <div className="flex gap-1 mt-1.5">
      <button
        onClick={() => onVerify(fieldKey, "verify")}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
          verification === "verify"
            ? "bg-green-500/15 text-green-600"
            : "bg-muted text-muted-foreground hover:bg-green-500/10 hover:text-green-600"
        )}
      >
        <CheckCircle2 className="size-3" />
        {t("ayush.verify")}
      </button>
      <button
        onClick={() => onEdit(fieldKey, getCurrentValue(fieldKey))}
        className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 transition-colors"
      >
        <Edit3 className="size-3" />
        {t("ayush.edit")}
      </button>
      <button
        onClick={() => onVerify(fieldKey, "reject")}
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
          verification === "reject"
            ? "bg-red-500/15 text-red-600"
            : "bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
        )}
      >
        <XCircle className="size-3" />
        {t("ayush.reject")}
      </button>
    </div>
  );
}

function FieldCard({
  label, field, fieldKey, verification, editing, editValue, onEditValue, onSaveEdit, onEdit, onVerify, onShowEvidence, getCurrentValue, t,
}: FieldCardProps) {
  return (
    <div className={cn(
      "rounded-xl border bg-card p-3 transition-colors",
      verification === "verify" && "border-green-500/30 bg-green-500/5",
      verification === "reject" && "border-red-500/30 bg-red-500/5",
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground">{label}</p>
          {editing ? (
            <div className="mt-1 flex gap-1">
              <input
                value={editValue}
                onChange={(e) => onEditValue(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-background px-2 py-1 text-xs"
                autoFocus
              />
              <Button size="xs" onClick={onSaveEdit}>{t("common.save")}</Button>
            </div>
          ) : (
            <p className="mt-0.5 text-sm font-medium">{field.value || "—"}</p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", CONFIDENCE_COLORS[field.confidence])}>
              {field.confidence}
            </span>
            <span className="text-[9px] text-muted-foreground">{STATUS_LABELS[field.status] || field.status}</span>
            {field.evidence?.length ? (
              <button onClick={() => onShowEvidence(field.evidence![0])} className="flex items-center gap-0.5 text-[9px] text-primary hover:underline">
                <Eye className="size-2.5" />
                {t("ayush.evidence")}
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <VerifyButtons
        fieldKey={fieldKey}
        verification={verification}
        onVerify={onVerify}
        onEdit={onEdit}
        getCurrentValue={getCurrentValue}
        t={t}
      />
    </div>
  );
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-green-600 bg-green-500/10",
  medium: "text-amber-600 bg-amber-500/10",
  low: "text-red-500 bg-red-500/10",
};

const STATUS_LABELS: Record<string, string> = {
  ai_extracted: "AI Structured",
  doctor_verified: "Verified",
  doctor_edited: "Edited",
  doctor_rejected: "Rejected",
  pending: "Pending",
  requires_clinician: "Needs Review",
};
