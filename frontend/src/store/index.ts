"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BRAND, uid } from "@/lib/brand/constants";
import type {
  PatientProfile,
  DoctorProfile,
  Medication,
  Allergy,
  Vaccination,
  InsurancePolicy,
  FamilyMember,
  DocumentData,
  VaultDocument,
  TimelineEvent,
  Appointment,
  ConsultationState,
  ShareSession,
  AuditEvent,
  NotificationItem,
  NotificationPrefs,
  Role,
  ThemeName,
  LanguageCode,
  LabReport,
  StepsData,
  SleepData,
  IntakeSession,
  IntakePhase,
  InputMode,
  HistoryMode,
  ConsentRecord,
  ConversationTurn,
  ClinicalHistory,
  DocumentIntelligence,
  RedFlagAlert,
  PhysicianSummary,
  DoctorPatientRecord,
} from "@/types";

// ---- View names ----
export type View =
  | "SPLASH"
  | "WELCOME"
  | "LANGUAGE"
  | "ROLE_SELECT"
  | "LOGIN"
  | "DOCTOR_LOGIN"
  | "OTP"
  | "REGISTER"
  | "DOCTOR_REGISTER"
  | "ACCESSIBILITY"
  | "THEME"
  | "HELP"
  | "AI_ASSISTANT"
  | "PATIENT_HOME"
  | "PATIENT_PROFILE"
  | "PATIENT_SETTINGS"
  | "PATIENT_HISTORY"
  | "PATIENT_TIMELINE"
  | "PATIENT_DOCUMENTS"
  | "PATIENT_OCR"
  | "PATIENT_MEDICATIONS"
  | "PATIENT_ALLERGIES"
  | "PATIENT_FAMILY"
  | "PATIENT_ABHA"
  | "PATIENT_INSURANCE"
  | "PATIENT_VACCINATION"
  | "PATIENT_APPOINTMENTS"
  | "PATIENT_AI"
  | "PATIENT_INTAKE"
  | "PATIENT_WELLNESS"
  | "PATIENT_STEPS"
  | "PATIENT_SLEEP"
  | "PATIENT_GUIDANCE"
  | "PATIENT_NUTRITION"
  | "PATIENT_LAB"
  | "NOTIFICATION_CENTER"
  | "DOCTOR_HOME"
  | "DOCTOR_SETTINGS"
  | "DOCTOR_QUEUE"
  | "DOCTOR_PRIORITY"
  | "DOCTOR_PATIENT"
  | "DOCTOR_CASES"
  | "DOCTOR_NOTES"
  | "DOCTOR_PRESCRIPTIONS"
  | "DOCTOR_FOLLOWUPS"
  | "DOCTOR_CONSULTATION"
  | "HOSPITAL_HOME"
  | "REGISTER_PATIENT"
  | "LAB_REPORTS"
  | "SCAN_PRESCRIPTION"

  // Care Link intake views
  | "INTAKE_HOME"
  | "INTAKE_IDENTIFY"
  | "INTAKE_CONSENT"
  | "INTAKE_HISTORY"
  | "INTAKE_DOCUMENTS"
  | "INTAKE_SUMMARY"
  | "INTAKE_COMPLETE"
  | "DOCTOR_CLINICAL";

interface AppState {
  // navigation
  currentView: View;
  setView: (v: View) => void;
  role: Role;
  setRole: (r: Role) => void;

  // prefs
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  themeColor: ThemeName;
  setThemeColor: (t: ThemeName) => void;
  reducedMotion: boolean;
  setReducedMotion: (b: boolean) => void;
  highContrast: boolean;
  setHighContrast: (b: boolean) => void;
  largeText: boolean;
  setLargeText: (b: boolean) => void;
  audioGuided: boolean;
  setAudioGuided: (b: boolean) => void;

  // auth
  hasSeenSplash: boolean;
  setHasSeenSplash: (b: boolean) => void;
  hasSeenStartupAssistant: boolean;
  setHasSeenStartupAssistant: (b: boolean) => void;
  loginMobile: string;
  setLoginMobile: (m: string) => void;
  loginDoctorId: string;
  setLoginDoctorId: (id: string) => void;
  logout: () => void;

  // Aadhaar linking (UI flow, no live verification)
  aadhaarReference: string;
  setAadhaarReference: (r: string) => void;
  aadhaarVerified: boolean;
  setAadhaarVerified: (b: boolean) => void;

  // profiles
  patientProfile: PatientProfile | null;
  setPatientProfile: (p: PatientProfile) => void;
  patientRegistry: PatientProfile[];
  upsertPatient: (p: PatientProfile) => void;
  doctorProfile: DoctorProfile | null;
  setDoctorProfile: (p: DoctorProfile) => void;

  // health data
  medications: Medication[];
  addMedication: (m: Medication) => void;
  allergies: Allergy[];
  addAllergy: (a: Allergy) => void;
  vaccinations: Vaccination[];
  addVaccination: (v: Vaccination) => void;
  insurancePolicies: InsurancePolicy[];
  addInsurance: (i: InsurancePolicy) => void;
  familyHealth: FamilyMember[];
  addFamilyMember: (f: FamilyMember) => void;
  documents: DocumentData[];
  addDocument: (d: DocumentData) => void;
  vaultDocuments: VaultDocument[];
  addVaultDocument: (d: VaultDocument) => void;
  timeline: TimelineEvent[];
  addTimelineEvent: (e: TimelineEvent) => void;
  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;
  cancelAppointment: (id: string) => void;
  labReports: LabReport[];
  stepsData: StepsData | null;
  sleepData: SleepData | null;

  // notifications
  notifications: NotificationItem[];
  addNotification: (n: NotificationItem) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  notificationPrefs: NotificationPrefs;
  setNotificationPrefs: (p: Partial<NotificationPrefs>) => void;

  // consultations / AI
  activeConsultation: ConsultationState | null;
  startConsultation: () => void;
  updateConsultation: (partial: Partial<ConsultationState>) => void;
  endConsultation: () => void;

  // doctor
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;

  // PIN lock
  pinEnabled: boolean;
  pin: string;
  isUnlocked: boolean;
  setPinEnabled: (b: boolean) => void;
  setPin: (p: string) => void;
  setIsUnlocked: (b: boolean) => void;
  lockApp: () => void;

  // misc
  shareSession: ShareSession | null;
  setShareSession: (s: ShareSession | null) => void;
  auditTrail: AuditEvent[];
  addAuditEvent: (e: AuditEvent) => void;
  resetApp: () => void;

  // Care Link intake
  intakeSession: IntakeSession | null;
  startIntakeSession: (partial: Partial<IntakeSession>) => void;
  setIntakePhase: (phase: IntakePhase) => void;
  setIntakeInputMode: (mode: InputMode) => void;
  setIntakeHistoryMode: (mode: HistoryMode) => void;
  setIntakePatientId: (id: string) => void;
  addConsentRecord: (r: ConsentRecord) => void;
  addConversationTurn: (t: ConversationTurn) => void;
  setClinicalHistory: (h: ClinicalHistory) => void;
  addIntakeDocument: (d: DocumentIntelligence) => void;
  addRedFlagAlert: (r: RedFlagAlert) => void;
  setPhysicianSummary: (s: PhysicianSummary) => void;
  completeIntakeSession: () => void;
  resetIntakeSession: () => void;

  // real patient cases captured through the intake/case-taking flow
  caseQueue: DoctorPatientRecord[];
  addCompletedCase: (c: DoctorPatientRecord) => void;
  updateCaseStatus: (id: string, status: DoctorPatientRecord["status"]) => void;
  updateCaseRecord: (id: string, patch: Partial<DoctorPatientRecord>) => void;
  // The case queue is real data only. env:DOCTOR_DEMO_CASES gates synthetic
  // seed data to development; it never renders in the normal production UI.
  caseQueueDemo: boolean;
  seedDemoCases: () => void;
}

const now = () => new Date().toISOString();

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: "SPLASH",
      setView: (v) => set({ currentView: v }),
      role: null,
      setRole: (r) => set({ role: r }),

      language: "en",
      setLanguage: (l) => set({ language: l }),
      theme: "white",
      setTheme: (t) => set({ theme: t, themeColor: t }),
      themeColor: "white",
      setThemeColor: (t) => set({ themeColor: t, theme: t }),
      reducedMotion: false,
      setReducedMotion: (b) => set({ reducedMotion: b }),
      highContrast: false,
      setHighContrast: (b) => set({ highContrast: b }),
      largeText: false,
      setLargeText: (b) => set({ largeText: b }),
      audioGuided: false,
      setAudioGuided: (b) => set({ audioGuided: b }),

      hasSeenSplash: false,
      setHasSeenSplash: (b) => set({ hasSeenSplash: b }),
      hasSeenStartupAssistant: false,
      setHasSeenStartupAssistant: (b) => set({ hasSeenStartupAssistant: b }),
      loginMobile: "",
      setLoginMobile: (m) => set({ loginMobile: m }),
      loginDoctorId: "",
      setLoginDoctorId: (id) => set({ loginDoctorId: id }),
      aadhaarReference: "",
      setAadhaarReference: (r) => set({ aadhaarReference: r }),
      aadhaarVerified: false,
      setAadhaarVerified: (b) => set({ aadhaarVerified: b }),
      logout: () =>
        set({
          currentView: "WELCOME",
          role: null,
          loginMobile: "",
          loginDoctorId: "",
          aadhaarReference: "",
          aadhaarVerified: false,
          selectedPatientId: null,
          isUnlocked: true,
        }),

      // Profiles start empty — the app only ever shows data the user
      // actually enters, so there is no pre-seeded/mock data.
      patientProfile: null,
      setPatientProfile: (p) =>
        set((s) => ({
          patientProfile: p,
          patientRegistry: s.patientRegistry.some((x) => x.id === p.id)
            ? s.patientRegistry.map((x) => (x.id === p.id ? p : x))
            : [...s.patientRegistry, p],
        })),
      patientRegistry: [],
      upsertPatient: (p) =>
        set((s) => ({
          patientRegistry: s.patientRegistry.some((x) => x.id === p.id)
            ? s.patientRegistry.map((x) => (x.id === p.id ? { ...x, ...p } : x))
            : [...s.patientRegistry, p],
        })),
      doctorProfile: null,
      setDoctorProfile: (p) => set({ doctorProfile: p }),

      medications: [],
      addMedication: (m) => set((s) => ({ medications: [...s.medications, m] })),
      allergies: [],
      addAllergy: (a) =>
        set((s) => ({
          allergies: [...s.allergies.filter((x) => x.substance !== a.substance), a],
        })),
      vaccinations: [],
      addVaccination: (v) => set((s) => ({ vaccinations: [...s.vaccinations, v] })),
      insurancePolicies: [],
      addInsurance: (i) => set((s) => ({ insurancePolicies: [...s.insurancePolicies, i] })),
      familyHealth: [],
      addFamilyMember: (f) => set((s) => ({ familyHealth: [...s.familyHealth, f] })),
      documents: [],
      addDocument: (d) => set((s) => ({ documents: [...s.documents, d] })),
      vaultDocuments: [],
      addVaultDocument: (d) => set((s) => ({ vaultDocuments: [...s.vaultDocuments, d] })),
      timeline: [],
      addTimelineEvent: (e) => set((s) => ({ timeline: [...s.timeline, e] })),
      appointments: [],
      addAppointment: (a) => set((s) => ({ appointments: [...s.appointments, a] })),
      cancelAppointment: (id) =>
        set((s) => ({ appointments: s.appointments.map((a) => (a.id === id ? { ...a, status: "cancelled" } : a)) })),
      labReports: [],
      stepsData: null,
      sleepData: null,

      notifications: [],
      addNotification: (n) => set((s) => ({ notifications: [n, ...s.notifications] })),
      markNotificationRead: (id) =>
        set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllNotificationsRead: () =>
        set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      notificationPrefs: {
        consultation: true,
        document: true,
        sharing: true,
        reminders: true,
        system: true,
      },
      setNotificationPrefs: (p) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, ...p } })),

      activeConsultation: null,
      startConsultation: () =>
        set({ activeConsultation: { id: uid("cons"), timestamp: now(), isProxy: false, chiefComplaint: "", symptoms: [], responses: {}, documents: [], redFlags: [], isCompleted: false } }),
      updateConsultation: (partial) =>
        set((s) => ({ activeConsultation: s.activeConsultation ? { ...s.activeConsultation, ...partial } : s.activeConsultation })),
      endConsultation: () => set({ activeConsultation: null }),

      selectedPatientId: null,
      setSelectedPatientId: (id) => set({ selectedPatientId: id }),

      pinEnabled: false,
      pin: "",
      isUnlocked: true,
      setPinEnabled: (b) => set({ pinEnabled: b }),
      setPin: (p) => set({ pin: p }),
      setIsUnlocked: (b) => set({ isUnlocked: b }),
      lockApp: () => set({ isUnlocked: false }),

      shareSession: null,
      setShareSession: (sess) => set({ shareSession: sess }),
      auditTrail: [],
      addAuditEvent: (e) => set((s) => ({ auditTrail: [...s.auditTrail, e] })),
      resetApp: () =>
        set({
          currentView: "ROLE_SELECT",
          role: null,
          patientProfile: null,
          doctorProfile: null,
          medications: [],
          allergies: [],
          vaccinations: [],
          insurancePolicies: [],
          familyHealth: [],
          documents: [],
          vaultDocuments: [],
          timeline: [],
          appointments: [],
          labReports: [],
          notifications: [],
          selectedPatientId: null,
        }),

      // Care Link intake
      intakeSession: null,
      startIntakeSession: (partial) =>
        set((s) => {
          const base: IntakeSession = {
            id: uid("intake"),
            patientId: undefined,
            phase: "welcome",
            inputMode: "voice",
            historyMode: "allopathic",
            language: s.language,
            consentRecords: [],
            conversationTurns: [],
            clinicalHistory: null,
            documents: [],
            redFlags: [],
            summary: null,
            startedAt: now(),
          };
          return { intakeSession: { ...base, ...partial } };
        }),
      setIntakePhase: (phase) =>
        set((s) => ({ intakeSession: s.intakeSession ? { ...s.intakeSession, phase } : s.intakeSession })),
      setIntakeInputMode: (inputMode) =>
        set((s) => ({ intakeSession: s.intakeSession ? { ...s.intakeSession, inputMode } : s.intakeSession })),
      setIntakeHistoryMode: (historyMode) =>
        set((s) => ({ intakeSession: s.intakeSession ? { ...s.intakeSession, historyMode } : s.intakeSession })),
      setIntakePatientId: (patientId) =>
        set((s) => ({ intakeSession: s.intakeSession ? { ...s.intakeSession, patientId } : s.intakeSession })),
      addConsentRecord: (r) =>
        set((s) => ({
          intakeSession: s.intakeSession
            ? {
                ...s.intakeSession,
                consentRecords: [...s.intakeSession.consentRecords, r],
              }
            : s.intakeSession,
        })),
      addConversationTurn: (t) =>
        set((s) => ({
          intakeSession: s.intakeSession
            ? { ...s.intakeSession, conversationTurns: [...s.intakeSession.conversationTurns, t] }
            : s.intakeSession,
        })),
      setClinicalHistory: (clinicalHistory) =>
        set((s) => ({ intakeSession: s.intakeSession ? { ...s.intakeSession, clinicalHistory } : s.intakeSession })),
      addIntakeDocument: (d) =>
        set((s) => ({
          intakeSession: s.intakeSession
            ? { ...s.intakeSession, documents: [...s.intakeSession.documents, d] }
            : s.intakeSession,
        })),
      addRedFlagAlert: (r) =>
        set((s) => ({
          intakeSession: s.intakeSession ? { ...s.intakeSession, redFlags: [...s.intakeSession.redFlags, r] } : s.intakeSession,
        })),
      setPhysicianSummary: (summary) =>
        set((s) => ({ intakeSession: s.intakeSession ? { ...s.intakeSession, summary } : s.intakeSession })),
      completeIntakeSession: () =>
        set((s) => ({
          intakeSession: s.intakeSession ? { ...s.intakeSession, phase: "complete", completedAt: now() } : s.intakeSession,
        })),
      resetIntakeSession: () => set({ intakeSession: null }),
      caseQueue: [],
      addCompletedCase: (c) => set((s) => ({ caseQueue: [c, ...s.caseQueue] })),
      updateCaseStatus: (id, status) =>
        set((s) => ({
          caseQueue: s.caseQueue.map((c) => (c.id === id ? { ...c, status } : c)),
        })),
      // Generic patch for a case record (notes, prescriptions, red flags,
      // summary verification etc.). Persists doctor actions into the record.
      updateCaseRecord: (id, patch) =>
        set((s) => ({
          caseQueue: s.caseQueue.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        })),
      // Real patient cases captured through the intake/case-taking flow. The
      // The doctor queue is never pre-seeded in production or in demo.
      // No fabricated patient records are ever injected; the portal starts
      // empty and waits for real patient intake.
      caseQueueDemo: false,
      seedDemoCases: () => set({}),
    }),
    {
      name: BRAND.storageKey,
      partialize: (s) => ({
        language: s.language,
        theme: s.theme,
        themeColor: s.themeColor,
        reducedMotion: s.reducedMotion,
        highContrast: s.highContrast,
        largeText: s.largeText,
        audioGuided: s.audioGuided,
        hasSeenSplash: s.hasSeenSplash,
        hasSeenStartupAssistant: s.hasSeenStartupAssistant,
        role: s.role,
        loginMobile: s.loginMobile,
        aadhaarReference: s.aadhaarReference,
        aadhaarVerified: s.aadhaarVerified,
        patientProfile: s.patientProfile,
        doctorProfile: s.doctorProfile,
        medications: s.medications,
        allergies: s.allergies,
        vaccinations: s.vaccinations,
        insurancePolicies: s.insurancePolicies,
        familyHealth: s.familyHealth,
        documents: s.documents,
        vaultDocuments: s.vaultDocuments,
        timeline: s.timeline,
        appointments: s.appointments,
        labReports: s.labReports,
        notifications: s.notifications,
        notificationPrefs: s.notificationPrefs,
        pinEnabled: s.pinEnabled,
        pin: s.pin,
        isUnlocked: s.isUnlocked,
        intakeSession: s.intakeSession,
        caseQueue: s.caseQueue,
        patientRegistry: s.patientRegistry,
        caseQueueDemo: s.caseQueueDemo,
        auditTrail: s.auditTrail,
      }),
    }
  )
);
