// ------------------------------------------------------------------
// CARELINK - Type Definitions
// ------------------------------------------------------------------

export type Role = "PATIENT" | "DOCTOR" | "ADMIN" | null;

export type ThemeName =
  | "white"
  | "blue"
  | "green"
  | "pink"
  | "gold"
  | "black"
  | "light"
  | "dark"
  | "system";

export type LanguageCode =
  | "en"
  | "hi"
  | "ur"
  | "bn"
  | "ta"
  | "te"
  | "mr"
  | "gu"
  | "kn"
  | "ml"
  | "pa"
  | "or"
  | "as";

export type RegistrationMode = "self" | "family";

export type RedFlagLevel = "NORMAL" | "NEEDS_REVIEW" | "URGENT";

export type OcrPipelineState =
  | "idle"
  | "uploading"
  | "extracting_text"
  | "identifying_entities"
  | "organising"
  | "done"
  | "error";

// ---- HEALTH DATA ---------------------------------------------------

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  dateOfBirth?: string;
  mobileNumber: string;
  password?: string;
  email?: string;
  address?: string;
  language?: string;
  emergencyContact?: string;
  abhaStatus?: string;
  abhaReference?: string;
  bloodGroup?: string;
  allergies?: string;
  currentMedicines?: string;
  knownConditions?: string;
  informationSource?: string;
  familyReporterName?: string;
  familyRelationship?: string;
  aadhaarVerified?: boolean;
  avatarColor?: string;
  heightCm?: number;
  weightKg?: number;
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialization: string;
  facility: string;
  mobileNumber?: string;
  email?: string;
  gender?: string;
  professionalId?: string;
  doctorId?: string;
  loginId?: string;
  password?: string;
  languages?: string[];
  avatarColor?: string;
  experience?: string;
  availability?: string;
  mobileVerified?: boolean;
  // Professional type: drives which credential fields are shown (spec §1).
  professionType?: "medical-doctor" | "nurse" | "allied" | "other";
  // --- Professional registration (spec §5, §29) ---
  dateOfBirth?: string;
  profession?: string;
  qualification?: string;
  registrationNumber?: string;
  council?: string;
  state?: string;
  registrationDate?: string;
  // Verification is separate from workplace affiliation.
  professionalVerification?: "verified" | "pending" | "failed";
  identityVerified?: boolean;
  // Practice type: Govt Hospital / Private Hospital / Clinic / Independent.
  practiceType?: "government" | "private" | "clinic" | "independent";
  workplace?: string;
  workplaceType?: string;
  workplaceVerified?: boolean;
  affiliationStatus?: "approved" | "pending" | "none";
  clinicRequest?: {
    name: string;
    status: "requested" | "approved" | "rejected";
  };
}

export interface Medication {
  id: string;
  name: string;
  strength?: string;
  frequency?: string;
  duration?: string;
  status: "current" | "past";
  source: string;
  sourceType: "input" | "document" | "ocr" | "clinical";
  confidence?: number;
  startDate?: string;
  notes?: string;
}

export interface Allergy {
  id: string;
  substance: string;
  reaction?: string;
  severity?: "Mild" | "Moderate" | "Severe";
  source: string;
  sourceType: "input" | "document" | "ocr" | "clinical";
  confidence?: number;
  status: "known" | "unknown" | "none";
}

export interface Vaccination {
  id: string;
  vaccine: string;
  dose?: string;
  date?: string;
  status: string;
  source: string;
}

export interface InsurancePolicy {
  id: string;
  provider: string;
  policyNumber: string;
  validity?: string;
  tpa?: string;
  coverage?: string;
  status?: string;
}

export interface FamilyMember {
  id: string;
  relationship: string;
  condition: string;
  status: string;
  notes?: string;
  source: string;
  ageAtDiagnosis?: number;
}

export interface DocumentData {
  id: string;
  type: string;
  name: string;
  dateStr?: string;
  hospital?: string;
  doctor?: string;
  ocrData?: Record<string, unknown>;
  ocrStructured?: Record<string, unknown>;
  confidence?: number;
  source?: string;
  status?: "ready" | "processing";
}

export interface ExtractedEntity {
  id: string;
  category: string;
  value: string;
  confidence: number;
  needsVerification: boolean;
  source_type: string;
  source_id?: string;
  edited?: boolean;
}

export interface VaultDocument {
  id: string;
  patientId: string;
  title: string;
  type: string;
  date: string;
  dateISO?: string;
  hospital?: string;
  doctor?: string;
  entities: ExtractedEntity[];
  ocrRawText?: string;
  confidenceOverall: number;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  category:
    | "visit"
    | "document"
    | "medication"
    | "report"
    | "procedure"
    | "vaccination"
    | "lab";
  sourceType: "input" | "document" | "ocr" | "clinical";
  date?: string;
  hospital?: string;
  icon?: string;
  confidence?: number;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "completed" | "cancelled";
  consultationMode?: string;
  notes?: string;
}

export interface DoctorInfo {
  id: string;
  name: string;
  specialty: string;
  experience: string;
  languages: string[];
  availability: string;
  hospital: string;
  rating: number;
  photoColor: string;
  qualifications: string;
}

// ---- CLINICAL / DOCTOR ---------------------------------------------

export interface RedFlag {
  id: string;
  rule: string;
  reason: string;
  level: RedFlagLevel;
  timestamp: string;
  status: "open" | "reviewed" | "escalated";
  sourceFields?: string[];
}

export interface DoctorPatientRecord {
  id: string;
  patientId: string;
  name: string;
  age: number;
  gender: string;
  chiefComplaint: string;
  status: "WAITING" | "NEEDS_REVIEW" | "URGENT" | "IN_CONSULTATION" | "COMPLETED";
  redFlagLevel?: RedFlagLevel;
  redFlags?: RedFlag[];
  language?: string;
  time?: string;
  waitTime?: string;
  source: string;
  relationship?: string;
  historyCompletion?: number;
  summaryStatus?: "pending" | "draft" | "verified";
  summaryVerified?: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  consent?: boolean;
  consultationId?: string;
  timeline?: TimelineEvent[];
  medications?: Medication[];
  allergies?: Allergy[];
  familyHealth?: FamilyMember[];
  investigations?: Record<string, unknown>[];
  documents?: DocumentData[];
  notes?: ClinicalNote[];
  prescriptions?: PrescriptionDraft[];
  aiSummary?: AiSummary;
  appointmentId?: string;
  consultNotes?: StructuredNote[];
  investigationRequests?: InvestigationRequest[];
  documentRequests?: DocumentRequest[];
}

export interface AiSummary {
  chiefComplaint?: string;
  hpi?: string;
  pastMedicalHistory?: string;
  medications?: string;
  allergies?: string;
  familyHistory?: string;
  investigations?: string;
  timeline?: string;
  redFlags?: string;
  generatedAt?: string;
  verified?: boolean;
  verifiedBy?: string;
}

export interface ClinicalNote {
  id: string;
  type: "note" | "assessment" | "plan" | "follow-up";
  content: string;
  transcript?: string;
  timestamp: string;
  status: "draft" | "saved";
}

// ---- AI / CONSULTATION ---------------------------------------------

export interface ConsultationState {
  id: string;
  timestamp: string;
  isProxy: boolean;
  proxyRelation?: string;
  proxyName?: string;
  proxyPatientName?: string;
  proxyPatientAge?: number;
  proxyPatientGender?: string;
  informationSource?: string;
  chiefComplaint: string;
  symptoms: string[];
  responses: Record<string, string>;
  documents: DocumentData[];
  redFlags: RedFlag[];
  aiSummary?: AiSummary;
  isCompleted: boolean;
  historyReuseMode?: string;
  medicineStatuses?: Record<string, string>;
  consentGiven?: boolean;
  patternDetected?: boolean;
  severity?: string;
  duration?: string;
  bodyArea?: string;
}

export interface SourceEvidence {
  field: string;
  value: string;
  source: string;
  sourceType: string;
  date?: string;
  confidence?: number;
  status: "verified" | "needs-verification" | "ai-generated";
}

export interface ShareSession {
  token: string;
  code: string;
  expiresAt: string;
  permissions: string[];
  consultationId?: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  role: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  category: string;
}

export interface PrescriptionDraft {
  medicine: string;
  dose: string;
  frequency: string;
  duration: string;
  confirmed: boolean;
}

// Investigation requested by the doctor (spec §22)
export interface InvestigationRequest {
  id: string;
  investigation: string;
  reason: string;
  priority: "routine" | "urgent";
  notes?: string;
  createdAt: string;
}

// Missing information/document the doctor requests from the patient (spec §24)
export interface DocumentRequest {
  id: string;
  title: string;
  detail: string;
  status: "pending" | "fulfilled";
  createdAt: string;
  fulfilledAt?: string;
}

// Structured clinical note for the consultation workspace (spec §20)
export interface StructuredNote {
  id: string;
  section: "chief-complaint" | "history" | "examination" | "assessment" | "plan" | "advice" | "follow-up";
  content: string;
  updatedAt: string;
}

export interface NotificationPrefs {
  consultation: boolean;
  document: boolean;
  sharing: boolean;
  reminders: boolean;
  system: boolean;
}

export interface FeedbackEntry {
  id: string;
  type: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export interface AppView {
  name: string;
}

// ---- WELLNESS / LAB (synthetic) ------------------------------------

export interface LabMarker {
  name: string;
  value: string;
  unit: string;
  normal: string;
  flag: string;
}

export interface LabReport {
  id: string;
  title: string;
  date: string;
  status: string;
  markers: LabMarker[];
  synthetic?: boolean;
  source?: string;
}

export interface StepsData {
  today: number;
  goal: number;
  weekly: number[];
  monthly: number[];
  avgDaily: number;
  last7days: string[];
  benchmark: string;
}

export interface SleepData {
  todayHours: number;
  avgSleep: number;
  bedtime: string;
  wakeTime: string;
  week: number[];
  days: string[];
}

// ------------------------------------------------------------------
// CARE LINK - AI Clinical History Platform Types
// ------------------------------------------------------------------

export type IntakePhase =
  | "welcome"
  | "identify"
  | "consent"
  | "history"
  | "documents"
  | "summary"
  | "complete";

export type InputMode = "voice" | "touch" | "text";

export type HistoryMode = "allopathic" | "ayush";

// Conversational turn in the history interview
export interface ConversationTurn {
  id: string;
  role: "system" | "patient";
  content: string;
  inputMode: InputMode;
  timestamp: string;
  questionCategory?: HistoryQuestionCategory;
  extractedField?: string;
}

export type HistoryQuestionCategory =
  | "chief_complaint"
  | "hpi"
  | "past_medical"
  | "past_surgical"
  | "drug_history"
  | "allergy"
  | "family_history"
  | "personal_history"
  | "review_of_systems"
  | "ayush_prakriti"
  | "ayush_vikriti"
  | "ayush_agni"
  | "ayush_koshtha"
  | "ayush_ahara_vihara"
  | "ayush_nidana"
  | "ayush_samprapti"
  | "ayush_sara"
  | "ayush_samhanana"
  | "ayush_pramana"
  | "ayush_satmya"
  | "ayush_sattva"
  | "ayush_ahara_shakti"
  | "ayush_vyayama_shakti"
  | "ayush_vaya"
  | "social_history"
  | "occupation"
  | "lifestyle";

// Structured clinical history generated from conversation
export interface ClinicalHistory {
  chiefComplaint: string;
  hpi: string;
  onset?: string;
  duration?: string;
  character?: string;
  radiation?: string;
  aggravatingFactors?: string[];
  relievingFactors?: string[];
  severity?: number;
  pastMedicalHistory: string[];
  pastSurgicalHistory: string[];
  currentMedications: { name: string; dose: string; frequency: string; duration: string }[];
  allergies: { substance: string; reaction: string; severity: string }[];
  familyHistory: { relation: string; condition: string; ageAtDiagnosis?: number }[];
  personalHistory: {
    smoking?: string;
    alcohol?: string;
    exercise?: string;
    diet?: string;
    occupation?: string;
    sleep?: string;
  };
  reviewOfSystems: Record<string, string>;
  socialHistory?: string;
  // AYUSH-specific fields
  ayush?: AyushHistory;
}

export interface AyushHistory {
  prakriti: string;
  vikriti: string;
  agni: string;
  koshtha: string;
  aharaVihara: string;
  nidana: string;
  samprapti: string;
  sar: string;
  samhanana: string;
  pramana: string;
  satmya: string;
  sattva: string;
  aharaShakti: string;
  vyayamaShakti: string;
  vaya: string;
}

// Red flag detected during history
export interface RedFlagAlert {
  id: string;
  rule: string;
  reason: string;
  level: "URGENT" | "NEEDS_REVIEW";
  timestamp: string;
  sourceFields: string[];
  triggered: boolean;
}

// Document intelligence - enhanced extraction
export interface DocumentIntelligence {
  id: string;
  originalName: string;
  type: "prescription" | "lab_report" | "discharge_summary" | "imaging" | "other";
  uploadDate: string;
  ocrStatus: "pending" | "processing" | "completed" | "error";
  ocrConfidence: number;
  extractedText: string;
  entities: ExtractedClinicalEntity[];
  chronologicalDate?: string;
  abnormalities: string[];
  potentialInteractions: string[];
}

export interface ExtractedClinicalEntity {
  type: "diagnosis" | "medication" | "investigation" | "procedure" | "allergy" | "vital" | "date" | "doctor_name" | "hospital_name";
  value: string;
  confidence: number;
  context?: string;
  normalRange?: string;
  flag?: "normal" | "high" | "low" | "critical";
  needsVerification?: boolean;
}

// Consent record
export interface ConsentRecord {
  id: string;
  patientId: string;
  timestamp: string;
  type: "data_capture" | "document_scan" | "ai_analysis" | "abdm_link" | "his_share" | "research";
  granted: boolean;
  language: LanguageCode;
  audioPlayed: boolean;
  revocable: boolean;
  revoked?: string;
}

// Structured summary for physician
export interface PhysicianSummary {
  id: string;
  patientId: string;
  generatedAt: string;
  historyMode: HistoryMode;
  chiefComplaint: string;
  hpi: string;
  pastMedicalHistory: string;
  pastSurgicalHistory: string;
  currentMedications: string;
  allergies: string;
  familyHistory: string;
  personalHistory: string;
  reviewOfSystems: string;
  documentSummary: string;
  investigationHighlights: string;
  redFlags: string;
  ayushSummary?: string;
  physicianNotes?: string;
  sourceEvidence: SourceEvidence[];
  verified: boolean;
  verificationStatus: "pending" | "accepted" | "edited" | "rejected";
}

// Intake session state
export interface IntakeSession {
  id: string;
  patientId?: string;
  phase: IntakePhase;
  inputMode: InputMode;
  historyMode: HistoryMode;
  language: LanguageCode;
  consentRecords: ConsentRecord[];
  conversationTurns: ConversationTurn[];
  clinicalHistory: ClinicalHistory | null;
  documents: DocumentIntelligence[];
  redFlags: RedFlagAlert[];
  summary: PhysicianSummary | null;
  startedAt: string;
  completedAt?: string;
}
