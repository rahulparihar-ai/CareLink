// ------------------------------------------------------------------
// CARELINK AYUSH INTELLIGENCE - Type Definitions
// ------------------------------------------------------------------

import type { LanguageCode, SourceEvidence } from "@/types";

// ---- AI INTERVIEW PHASES ------------------------------------------

export type AyushInterviewPhase =
  | "welcome"
  | "consent"
  | "mode_select"
  | "chief_complaint"
  | "adaptive_interview"
  | "ayurvedic_assessment"
  | "review"
  | "complete";

export type AyushInputMode = "voice" | "text" | "touch";

// ---- EXTRACTIVE SOURCES -------------------------------------------

export type ExtractionSource =
  | "PATIENT_REPORTED"
  | "AI_STRUCTURED"
  | "UPLOADED_DOCUMENT"
  | "PREVIOUS_ENCOUNTER"
  | "DOCTOR_ENTERED";

export type VerificationStatus =
  | "pending"
  | "ai_extracted"
  | "doctor_verified"
  | "doctor_edited"
  | "doctor_rejected"
  | "requires_clinician";

export type ConfidenceLevel = "high" | "medium" | "low";

// ---- ASSESSMENT FIELD ---------------------------------------------

export interface AssessmentField {
  value: string;
  source: ExtractionSource;
  confidence: ConfidenceLevel;
  status: VerificationStatus;
  evidence: EvidenceItem[];
  lastUpdated: string;
  originalResponse?: string;
}

// ---- EVIDENCE -----------------------------------------------------

export interface EvidenceItem {
  id: string;
  field: string;
  originalResponse: string;
  structuredInterpretation: string;
  sourceType: ExtractionSource;
  timestamp: string;
  confidence: ConfidenceLevel;
}

// ---- RED FLAG -----------------------------------------------------

export interface AyushRedFlag {
  id: string;
  rule: string;
  reason: string;
  level: "URGENT" | "NEEDS_REVIEW";
  timestamp: string;
  sourceFields: string[];
  patientResponse?: string;
  status: "open" | "notified" | "acknowledged";
}

// ---- CLINICAL HISTORY FIELDS --------------------------------------

export interface AyushClinicalHistory {
  chiefComplaint: AssessmentField;
  duration: AssessmentField;
  onset: AssessmentField;
  pattern: AssessmentField;
  character: AssessmentField;
  aggravatingFactors: AssessmentField;
  relievingFactors: AssessmentField;
  associatedSymptoms: AssessmentField;
  severity: AssessmentField;
  pastMedicalHistory: AssessmentField;
  pastSurgicalHistory: AssessmentField;
  currentMedications: AssessmentField;
  allergies: AssessmentField;
  familyHistory: AssessmentField;
  personalHistory: AssessmentField;
  dietHistory: AssessmentField;
  sleepHistory: AssessmentField;
  bowelHistory: AssessmentField;
  substanceHistory: AssessmentField;
  reviewOfSystems: AssessmentField;
}

// ---- DASHAVIDHA PARIKSHA ------------------------------------------

export interface DashavidhaAssessment {
  prakriti: AssessmentField;
  vikriti: AssessmentField;
  sara: AssessmentField;
  samhanana: AssessmentField;
  pramana: AssessmentField;
  satmya: AssessmentField;
  sattva: AssessmentField;
  aharaShakti: AssessmentField;
  vyayamaShakti: AssessmentField;
  vaya: AssessmentField;
}

// ---- AYURVEDIC CLINICAL ASSESSMENT --------------------------------

export interface AyurvedicAssessment {
  dashavidha: DashavidhaAssessment;
  agni: AssessmentField;
  koshtha: AssessmentField;
  aharaVihara: AssessmentField;
  nidana: AssessmentField;
  sampraptiContext: AssessmentField;
}

// ---- INTERVIEW QUESTION -------------------------------------------

export interface AyushQuestion {
  id: string;
  category: string;
  text: string;
  textByLanguage: Record<string, string>;
  answerType: "open" | "select" | "multi_select" | "scale" | "yes_no";
  options?: { label: string; value: string; labelByLanguage?: Record<string, string> }[];
  followUpRules: FollowUpRule[];
  relevanceRules: RelevanceRule[];
  safetyRules: SafetyRule[];
  source: ExtractionSource;
  confidence: ConfidenceLevel;
  verificationStatus: VerificationStatus;
}

export interface FollowUpRule {
  condition: string;
  nextQuestionId: string;
  category: string;
}

export interface RelevanceRule {
  dependsOn: string;
  condition: string;
}

export interface SafetyRule {
  keywords: string[];
  flagLevel: "URGENT" | "NEEDS_REVIEW";
  message: string;
}

// ---- CONVERSATION TURN --------------------------------------------

export interface AyushConversationTurn {
  id: string;
  role: "ai" | "patient";
  content: string;
  inputMode: AyushInputMode;
  questionId?: string;
  category?: string;
  timestamp: string;
  evidenceCreated?: boolean;
  redFlagTriggered?: boolean;
}

// ---- PHYSICIAN SUMMARY --------------------------------------------

export interface AyushPhysicianSummary {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: string;
  generatedAt: string;
  language: LanguageCode;
  clinicalHistory: AyushClinicalHistory;
  ayurvedicAssessment: AyurvedicAssessment;
  redFlags: AyushRedFlag[];
  aiSummaryText: string;
  sourceEvidence: SourceEvidence[];
  verificationStatus: "pending" | "doctor_verified" | "doctor_edited" | "doctor_rejected";
  verifiedBy?: string;
  verifiedAt?: string;
}

// ---- SESSION STATE ------------------------------------------------

export interface AyushInterviewSession {
  id: string;
  patientId?: string;
  patientName?: string;
  phase: AyushInterviewPhase;
  inputMode: AyushInputMode;
  language: LanguageCode;
  consentGiven: boolean;
  consentTimestamp?: string;
  conversationTurns: AyushConversationTurn[];
  clinicalHistory: AyushClinicalHistory;
  ayurvedicAssessment: AyurvedicAssessment;
  redFlags: AyushRedFlag[];
  summary: AyushPhysicianSummary | null;
  historyCompletion: number;
  startedAt: string;
  completedAt?: string;
  isPaused: boolean;
  isMuted: boolean;
  currentQuestionIndex: number;
  askedQuestionIds: string[];
}

// ---- DOCTOR QUEUE ENTRY -------------------------------------------

export interface AyushDoctorQueueEntry {
  id: string;
  sessionId: string;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  status: "WAITING" | "NEEDS_REVIEW" | "URGENT" | "IN_CONSULTATION" | "COMPLETED";
  redFlagLevel: "NORMAL" | "NEEDS_REVIEW" | "URGENT";
  redFlagCount: number;
  historyCompletion: number;
  aiSummaryAvailable: boolean;
  ayushAssessmentReady: boolean;
  language: LanguageCode;
  createdAt: string;
  summary?: AyushPhysicianSummary;
}

// ---- LONGITUDINAL ENTRY -------------------------------------------

export interface AyushVisitEntry {
  id: string;
  visitDate: string;
  visitNumber: number;
  chiefComplaint: string;
  prakritiVerified: boolean;
  vikritiValue: string;
  agniValue: string;
  koshthaValue: string;
  symptoms: string[];
  summary: string;
  sessionId: string;
}
