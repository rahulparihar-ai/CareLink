"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  FileText, Shield, ArrowRight, Clock, Eye,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";
import type { AssessmentField, EvidenceItem } from "@/types/ayush";

export function AyushSummaryView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const session = useAppStore((s) => s.ayushSession);

  const [expandedSection, setExpandedSection] = useState<string | null>("chief");
  const [showEvidence, setShowEvidence] = useState<EvidenceItem | null>(null);

  if (!session?.summary) {
    return (
      <PatientPageShell title={t("ayush.summaryTitle")} currentTab="PATIENT_AYUSH" onBack={() => setView("PATIENT_AYUSH")}>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText className="mb-4 size-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("ayush.noSummary")}</p>
          <Button className="mt-4" onClick={() => setView("PATIENT_AYUSH")}>{t("ayush.startNew")}</Button>
        </div>
      </PatientPageShell>
    );
  }

  const summary = session.summary;
  const history = summary.clinicalHistory;
  const assessment = summary.ayurvedicAssessment;
  const redFlags = summary.redFlags;

  const toggleSection = (s: string) => setExpandedSection(expandedSection === s ? null : s);

  const EvidenceButton = ({ item }: { item: AssessmentField }) => {
    if (!item.value || !item.evidence?.length) return null;
    return (
      <button
        onClick={() => setShowEvidence(item.evidence[0])}
        className="flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
      >
        <Eye className="size-2.5" />
        {t("ayush.viewEvidence")}
      </button>
    );
  };

  const FieldRow = ({ label, field }: { label: string; field: AssessmentField }) => (
    <div className="flex items-start justify-between gap-2 py-2 border-b border-border/50 last:border-0">
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm">{field.value || "—"}</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={cn("rounded-full px-1.5 py-0.5 text-[9px] font-semibold", CONFIDENCE_COLORS[field.confidence])}>
            {field.confidence}
          </span>
          <span className="text-[9px] text-muted-foreground">{STATUS_ICONS[field.status] || field.status}</span>
          <EvidenceButton item={field} />
        </div>
      </div>
    </div>
  );

  const sections = [
    {
      key: "chief",
      label: t("ayush.sectionChiefComplaint"),
      icon: "🎯",
      fields: [
        { label: t("ayush.fieldChiefComplaint"), field: history.chiefComplaint },
        { label: t("ayush.fieldDuration"), field: history.duration },
        { label: t("ayush.fieldSeverity"), field: history.severity },
        { label: t("ayush.fieldPattern"), field: history.pattern },
        { label: t("ayush.fieldAggravating"), field: history.aggravatingFactors },
        { label: t("ayush.fieldRelieving"), field: history.relievingFactors },
        { label: t("ayush.fieldAssociated"), field: history.associatedSymptoms },
      ],
    },
    {
      key: "medical",
      label: t("ayush.sectionMedicalHistory"),
      icon: "📋",
      fields: [
        { label: t("ayush.fieldPastMedical"), field: history.pastMedicalHistory },
        { label: t("ayush.fieldPastSurgical"), field: history.pastSurgicalHistory },
        { label: t("ayush.fieldMedications"), field: history.currentMedications },
        { label: t("ayush.fieldAllergies"), field: history.allergies },
        { label: t("ayush.fieldFamily"), field: history.familyHistory },
      ],
    },
    {
      key: "lifestyle",
      label: t("ayush.sectionLifestyle"),
      icon: "🏃",
      fields: [
        { label: t("ayush.fieldDiet"), field: history.dietHistory },
        { label: t("ayush.fieldSleep"), field: history.sleepHistory },
        { label: t("ayush.fieldBowel"), field: history.bowelHistory },
      ],
    },
    {
      key: "ayurvedic",
      label: t("ayush.sectionAyurvedic"),
      icon: "🌿",
      fields: [
        { label: t("ayush.fieldPrakriti"), field: assessment.dashavidha.prakriti },
        { label: t("ayush.fieldAgni"), field: assessment.agni },
        { label: t("ayush.fieldKoshtha"), field: assessment.koshtha },
        { label: t("ayush.fieldAharaVihara"), field: assessment.aharaVihara },
        { label: t("ayush.fieldNidana"), field: assessment.nidana },
        { label: t("ayush.fieldSattva"), field: assessment.dashavidha.sattva },
        { label: t("ayush.fieldVyayama"), field: assessment.dashavidha.vyayamaShakti },
      ],
    },
  ];

  return (
    <PatientPageShell title={t("ayush.summaryTitle")} currentTab="PATIENT_AYUSH" onBack={() => setView("PATIENT_AYUSH")}>
      <div className="mx-auto max-w-lg space-y-4">
        {/* Evidence Modal */}
        {showEvidence && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEvidence(null)}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm rounded-2xl border border-border bg-background p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="mb-3 text-sm font-bold">{t("ayush.evidenceTitle")}</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("ayush.evidenceSource")}</p>
                  <p className="text-xs">{showEvidence.sourceType}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("ayush.evidenceOriginal")}</p>
                  <p className="text-xs italic">&ldquo;{showEvidence.originalResponse}&rdquo;</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{t("ayush.evidenceStructured")}</p>
                  <p className="text-xs">{showEvidence.structuredInterpretation}</p>
                </div>
              </div>
              <Button className="mt-4 w-full" variant="outline" onClick={() => setShowEvidence(null)}>
                {t("common.close")}
              </Button>
            </motion.div>
          </div>
        )}

        {/* Completion Banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-green-500/30 bg-green-500/5 p-4 text-center"
        >
          <CheckCircle2 className="mx-auto mb-2 size-8 text-green-500" />
          <h2 className="font-bold">{t("ayush.historyComplete")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("ayush.historyCompleteDesc")}</p>
          <div className="mt-3 flex items-center justify-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {t("ayush.completion")}: {session.historyCompletion}%
            </span>
            <span className="flex items-center gap-1">
              <FileText className="size-3" />
              {summary.sourceEvidence.length} {t("ayush.evidenceItems")}
            </span>
          </div>
        </motion.div>

        {/* Red Flags */}
        {redFlags.length > 0 && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" />
              {t("ayush.redFlagsDetected")}: {redFlags.length}
            </div>
          </div>
        )}

        {/* AI Summary Text */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-4 text-primary" />
            <h3 className="text-sm font-bold">{t("ayush.aiSummary")}</h3>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{summary.aiSummaryText}</p>
        </div>

        {/* Sections */}
        {sections.map((section) => (
          <div key={section.key} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              onClick={() => toggleSection(section.key)}
              className="flex w-full items-center gap-2 p-3 text-left"
            >
              <span className="text-lg">{section.icon}</span>
              <span className="flex-1 text-sm font-semibold">{section.label}</span>
              {expandedSection === section.key ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </button>
            {expandedSection === section.key && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: "auto" }}
                className="border-t border-border px-3 pb-3"
              >
                {section.fields.map(({ label, field }) => (
                  <FieldRow key={label} label={label} field={field} />
                ))}
              </motion.div>
            )}
          </div>
        ))}

        {/* Next Steps */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
          <p className="text-sm font-semibold">{t("ayush.nextSteps")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("ayush.nextStepsDesc")}</p>
          <Button className="mt-3" onClick={() => setView("PATIENT_HOME")}>
            {t("ayush.returnHome")}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    </PatientPageShell>
  );
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-green-600 bg-green-500/10",
  medium: "text-amber-600 bg-amber-500/10",
  low: "text-red-500 bg-red-500/10",
};

const STATUS_ICONS: Record<string, string> = {
  ai_extracted: "AI Structured",
  doctor_verified: "Doctor Verified",
  doctor_edited: "Edited",
  doctor_rejected: "Rejected",
  pending: "Pending",
  requires_clinician: "Requires Verification",
};
