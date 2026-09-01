import type { ClinicalHistory, ConversationTurn, DocumentIntelligence, PhysicianSummary, RedFlagAlert, SourceEvidence } from "@/types";
import { uid } from "@/lib/brand/constants";

// ------------------------------------------------------------------
// MEDIKIOSK - Structured Clinical History Summary Generator
// Synthesizes conversational history + digitized documents into a
// single physician-ready clinical summary in standard format.
// ------------------------------------------------------------------

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const SUMMARY_SERVICE = {
  /**
   * Generate a structured, physician-ready clinical summary from the
   * conversational history, digitized documents, and red flags.
   */
  async generate(
    patientId: string,
    history: ClinicalHistory | null,
    documents: DocumentIntelligence[],
    redFlags: RedFlagAlert[],
    historyMode: "allopathic" | "ayush",
    turns: ConversationTurn[] = []
  ): Promise<PhysicianSummary> {
    // Simulate AI summarization
    await delay(1200);

    const cc = history?.chiefComplaint ?? "";
    const hpi = [
      history?.onset && `Onset: ${history.onset}`,
      history?.character && `Character: ${history.character}`,
      history?.radiation && `Radiation: ${history.radiation}`,
      history?.duration && `Duration: ${history.duration}`,
      history?.severity !== undefined && `Severity: ${history.severity}/10`,
      history?.aggravatingFactors?.length && `Aggravated by: ${history.aggravatingFactors.join(", ")}`,
      history?.relievingFactors?.length && `Relieved by: ${history.relievingFactors.join(", ")}`,
    ]
      .filter(Boolean)
      .join("; ") || history?.hpi || "Chief complaint history incomplete.";

    const pmh = history?.pastMedicalHistory?.length
      ? history.pastMedicalHistory.join(", ")
      : "None recorded / not significant.";

    const psh = history?.pastSurgicalHistory?.length
      ? history.pastSurgicalHistory.join(", ")
      : "No history of surgery.";

    const meds = history?.currentMedications?.length
      ? history.currentMedications.map((m) => `${m.name} ${m.dose} ${m.frequency}`).join(", ")
      : "None recorded.";

    const allergies = history?.allergies?.length
      ? history.allergies.map((a) => `${a.substance} (${a.severity})`).join(", ")
      : "No known drug allergies.";

    const famHist = history?.familyHistory?.length
      ? history.familyHistory.map((f) => `${f.relation}: ${f.condition}`).join(", ")
      : "No significant family history.";

    const personal = history?.personalHistory
      ? [
          history.personalHistory.smoking && `Smoking: ${history.personalHistory.smoking}`,
          history.personalHistory.alcohol && `Alcohol: ${history.personalHistory.alcohol}`,
          history.personalHistory.occupation && `Occupation: ${history.personalHistory.occupation}`,
          history.personalHistory.diet && `Diet: ${history.personalHistory.diet}`,
          history.personalHistory.sleep && `Sleep: ${history.personalHistory.sleep}`,
        ]
          .filter(Boolean)
          .join("; ") || "Personal history not detailed."
      : "Personal history not recorded.";

    // Document intelligence synthesis
    const documentSummary = documents.length
      ? `Patient has ${documents.length} prior document(s) digitized and chronologically organized.`
      : "No prior medical documents uploaded.";

    // Investigation highlights - abnormal values
    const abnormalValues: string[] = [];
    for (const doc of documents) {
      for (const ent of doc.entities) {
        if (ent.type === "investigation" && ent.flag && ent.flag !== "normal") {
          abnormalValues.push(`${ent.value} (${ent.flag})`);
        }
      }
    }
    const investigationHighlights = abnormalValues.length
      ? `Notable abnormal values: ${abnormalValues.join("; ")}`
      : "No abnormal investigation values flagged.";

    const allRedFlags = redFlags.filter((r) => r.triggered);
    const redFlagSummary = allRedFlags.length
      ? `⚠ ${allRedFlags.map((r) => r.rule).join("; ")} - URGENT TRIAGE ALERT`
      : "No red flags detected.";

    // AYUSH summary
    let ayushSummary: string | undefined;
    if (historyMode === "ayush" && history?.ayush) {
      ayushSummary = [
        history.ayush.prakriti && `Prakriti: ${history.ayush.prakriti}`,
        history.ayush.vikriti && `Vikriti: ${history.ayush.vikriti}`,
        history.ayush.agni && `Agni: ${history.ayush.agni}`,
        history.ayush.koshtha && `Koshtha: ${history.ayush.koshtha}`,
        history.ayush.aharaVihara && `Ahara-Vihara: ${history.ayush.aharaVihara}`,
        history.ayush.nidana && `Nidana: ${history.ayush.nidana}`,
        history.ayush.samprapti && `Samprapti: ${history.ayush.samprapti}`,
        history.ayush.sar && `Sara: ${history.ayush.sar}`,
        history.ayush.samhanana && `Samhanana: ${history.ayush.samhanana}`,
        history.ayush.satmya && `Satmya: ${history.ayush.satmya}`,
        history.ayush.sattva && `Sattva: ${history.ayush.sattva}`,
        history.ayush.aharaShakti && `Ahara Shakti: ${history.ayush.aharaShakti}`,
        history.ayush.vyayamaShakti && `Vyayama Shakti: ${history.ayush.vyayamaShakti}`,
        history.ayush.vaya && `Vaya: ${history.ayush.vaya}`,
      ]
        .filter(Boolean)
        .join(" | ");
    }

    return {
      id: uid("sum"),
      patientId,
      generatedAt: new Date().toISOString(),
      historyMode,
      chiefComplaint: cc,
      hpi,
      pastMedicalHistory: pmh,
      pastSurgicalHistory: psh,
      currentMedications: meds,
      allergies,
      familyHistory: famHist,
      personalHistory: personal,
      reviewOfSystems: history?.reviewOfSystems
        ? Object.entries(history.reviewOfSystems)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ")
        : "ROS not elicited. (Complete during consultation if needed.)",
      documentSummary,
      investigationHighlights,
      redFlags: redFlagSummary,
      ayushSummary,
      sourceEvidence: buildSourceEvidence(turns, documents, redFlags),
      verified: false,
      verificationStatus: "pending",
    };
  },
};

function buildSourceEvidence(
  turns: ConversationTurn[],
  documents: DocumentIntelligence[],
  redFlags: RedFlagAlert[]
): SourceEvidence[] {
  const evidence: SourceEvidence[] = [];

  const fieldLabel: Record<string, string> = {
    chief_complaint: "Chief Complaint",
    hpi: "History of Present Illness",
    past_medical: "Past Medical History",
    past_surgical: "Past Surgical History",
    drug_history: "Current Medications",
    allergy: "Allergies",
    family_history: "Family History",
    personal_history: "Personal & Social History",
    review_of_systems: "Review of Systems",
    ayush_prakriti: "AYUSH Prakriti",
    ayush_vikriti: "AYUSH Vikriti",
  };

  for (const turn of turns) {
    if (turn.role !== "patient") continue;
    const label = turn.questionCategory ? fieldLabel[turn.questionCategory] : undefined;
    evidence.push({
      field: label ?? "Patient Interview",
      value: turn.content,
      source: turn.inputMode === "voice" ? "Patient voice input" : turn.inputMode === "text" ? "Patient typed input" : "Patient touch input",
      sourceType: turn.inputMode,
      date: turn.timestamp,
      status: "ai-generated",
    });
  }

  for (const doc of documents) {
    for (const ent of doc.entities) {
      evidence.push({
        field: `Digitized document · ${doc.originalName}`,
        value: `${ent.type}: ${ent.value}`,
        source: `OCR of ${doc.originalName}`,
        sourceType: "ocr",
        date: doc.chronologicalDate,
        confidence: ent.confidence,
        status: ent.needsVerification ? "needs-verification" : "ai-generated",
      });
    }
  }

  const triggered = redFlags.filter((r) => r.triggered);
  for (const rf of triggered) {
    evidence.push({
      field: "Red Flag",
      value: rf.rule,
      source: "AI red-flag detection on interview",
      sourceType: "clinical",
      status: "ai-generated",
    });
  }

  return evidence;
}
