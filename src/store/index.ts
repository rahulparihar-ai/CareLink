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
  KioskSession,
  KioskPhase,
  InputMode,
  HistoryMode,
  ConsentRecord,
  ConversationTurn,
  ClinicalHistory,
  DocumentIntelligence,
  RedFlagAlert,
  PhysicianSummary,
} from "@/types";
import { demoDoctors } from "@/data/demo";

// ---- View names ----
export type View =
  | "SPLASH"
  | "WELCOME"
  | "LANGUAGE"
  | "ROLE_SELECT"
  | "LOGIN"
  | "OTP"
  | "REGISTER"
  | "PATIENT_HOME"
  | "PATIENT_PROFILE"
  | "PATIENT_SETTINGS"
  | "PATIENT_HISTORY"
  | "PATIENT_TIMELINE"
  | "PATIENT_DOCUMENTS"
  | "PATIENT_DOCUMENT_VAULT"
  | "PATIENT_OCR"
  | "PATIENT_MEDICATIONS"
  | "PATIENT_ALLERGIES"
  | "PATIENT_FAMILY"
  | "PATIENT_ABHA"
  | "PATIENT_INSURANCE"
  | "PATIENT_VACCINATION"
  | "PATIENT_EMERGENCY"
  | "PATIENT_HEALTHCARD"
  | "PATIENT_APPOINTMENTS"
  | "PATIENT_BOOK_APPOINTMENT"
  | "PATIENT_DOCTORS"
  | "PATIENT_DOCTOR_PROFILE"
  | "PATIENT_AI"
  | "PATIENT_INTAKE"
  | "PATIENT_VOICE"
  | "PATIENT_WELLNESS"
  | "PATIENT_STEPS"
  | "PATIENT_SLEEP"
  | "PATIENT_GUIDANCE"
  | "PATIENT_NUTRITION"
  | "PATIENT_NOTIFICATIONS"
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
  |   "PATIENT_SHARE_ID"
  | "HOSPITAL_HOME"
  | "CONSULTANT_SCHEDULE"
  | "CONSULTANT_DETAIL"
  | "TARIFF"
  | "ROSTER"
  | "REGISTER_PATIENT"
  | "AADHAAR_SCAN"
  | "LAB_REPORTS"
  | "SCAN_PRESCRIPTION"
  | "DOCTOR_DESK"

  // MediKiosk views
  | "KIOSK_HOME"
  | "KIOSK_IDENTIFY"
  | "KIOSK_CONSENT"
  | "KIOSK_HISTORY"
  | "KIOSK_DOCUMENTS"
  | "KIOSK_SUMMARY"
  | "KIOSK_COMPLETE"
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

  // auth
  hasSeenSplash: boolean;
  setHasSeenSplash: (b: boolean) => void;
  loginMobile: string;
  setLoginMobile: (m: string) => void;

  // profiles
  patientProfile: PatientProfile | null;
  setPatientProfile: (p: PatientProfile) => void;
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
  labReports: LabReport[];
  stepsData: StepsData;
  sleepData: SleepData;

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

  // MediKiosk
  kioskSession: KioskSession | null;
  startKioskSession: (partial: Partial<KioskSession>) => void;
  setKioskPhase: (phase: KioskPhase) => void;
  setKioskInputMode: (mode: InputMode) => void;
  setKioskHistoryMode: (mode: HistoryMode) => void;
  setKioskPatientId: (id: string) => void;
  addConsentRecord: (r: ConsentRecord) => void;
  addConversationTurn: (t: ConversationTurn) => void;
  setClinicalHistory: (h: ClinicalHistory) => void;
  addKioskDocument: (d: DocumentIntelligence) => void;
  addRedFlagAlert: (r: RedFlagAlert) => void;
  setPhysicianSummary: (s: PhysicianSummary) => void;
  completeKioskSession: () => void;
  resetKioskSession: () => void;
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

      hasSeenSplash: false,
      setHasSeenSplash: (b) => set({ hasSeenSplash: b }),
      loginMobile: "",
      setLoginMobile: (m) => set({ loginMobile: m }),

      patientProfile: {
        id: BRAND.demoPatientId,
        name: "Rahul Sharma",
        age: 34,
        gender: "Male",
        dateOfBirth: "1992-03-14",
        mobileNumber: "9876543210",
        language: "English",
        emergencyContact: "Priya Sharma · +91 9123456780",
        abhaStatus: "Linked",
        abhaReference: "91-XXXX-XXXX-XXXX",
        bloodGroup: "B+",
        allergies: "Penicillin",
        currentMedicines: "Amlodipine 5mg",
        knownConditions: "Hypertension",
        heightCm: 174,
        weightKg: 78,
      },
      setPatientProfile: (p) => set({ patientProfile: p }),
      doctorProfile: {
        id: "DR-CL-00123",
        name: "Dr. Arjun Mehta",
        specialization: "General Medicine",
        facility: "CareLink Health Network",
        mobileNumber: "9876500011",
        professionalId: "MCI-88412",
        languages: ["English", "Hindi"],
        experience: "14 years",
        availability: "Mon–Sat, AM 9–5",
        avatarColor: "blue",
      },
      setDoctorProfile: (p) => set({ doctorProfile: p }),

      medications: [
        {
          id: uid("med"),
          name: "Amlodipine",
          strength: "5 mg",
          frequency: "Once daily",
          duration: "Ongoing",
          status: "current",
          source: "Doctor prescription",
          sourceType: "clinical",
          startDate: "2024-02-10",
        },
        {
          id: uid("med"),
          name: "Metformin",
          strength: "500 mg",
          frequency: "Twice daily",
          duration: "6 months",
          status: "current",
          source: "Doctor prescription",
          sourceType: "clinical",
          startDate: "2024-06-01",
        },
        {
          id: uid("med"),
          name: "Paracetamol",
          strength: "500 mg",
          frequency: "As needed",
          duration: "PRN",
          status: "past",
          source: "Patient input",
          sourceType: "input",
          startDate: "2023-11-20",
        },
      ],
      addMedication: (m) => set((s) => ({ medications: [...s.medications, m] })),
      allergies: [
        {
          id: uid("alg"),
          substance: "Penicillin",
          reaction: "Skin rash, itching",
          severity: "Moderate",
          source: "Doctor record",
          sourceType: "clinical",
          status: "known",
        },
      ],
      addAllergy: (a) =>
        set((s) => ({
          allergies: [...s.allergies.filter((x) => x.substance !== a.substance), a],
        })),
      vaccinations: [
        { id: uid("vac"), vaccine: "COVID-19", dose: "Booster", date: "2023-05-12", status: "Completed", source: "Certificate" },
        { id: uid("vac"), vaccine: "Tetanus (TT)", dose: "Booster", date: "2022-09-30", status: "Completed", source: "Record" },
        { id: uid("vac"), vaccine: "Influenza", dose: "Annual", date: "2023-10-02", status: "Completed", source: "Record" },
      ],
      addVaccination: (v) => set((s) => ({ vaccinations: [...s.vaccinations, v] })),
      insurancePolicies: [
        {
          id: uid("ins"),
          provider: "Star Health",
          policyNumber: "SH-XXXX-8421",
          validity: "Mar 2026",
          tpa: "Star Health TPA",
          coverage: "₹5,00,000 · Family Floater",
          status: "Active",
        },
      ],
      addInsurance: (i) => set((s) => ({ insurancePolicies: [...s.insurancePolicies, i] })),
      familyHealth: [
        { id: uid("fam"), relationship: "Father", condition: "Hypertension", status: "Known", notes: "On medication since age 58", source: "Patient input", ageAtDiagnosis: 58 },
        { id: uid("fam"), relationship: "Mother", condition: "Type 2 Diabetes", status: "Known", notes: "Diet managed", source: "Patient input", ageAtDiagnosis: 52 },
      ],
      addFamilyMember: (f) => set((s) => ({ familyHealth: [...s.familyHealth, f] })),
      documents: [
        { id: uid("doc"), type: "Lab Report", name: "Complete Blood Count.pdf", dateStr: "Aug 18, 2026", hospital: "CareLink Lab", status: "ready", confidence: 96 },
        { id: uid("doc"), type: "Prescription", name: "Prescription_Mar.pdf", dateStr: "Mar 05, 2026", doctor: "Dr. Mehta", status: "ready", confidence: 98 },
        { id: uid("doc"), type: "Imaging", name: "Chest_Xray_Report.jpg", dateStr: "Jan 22, 2026", hospital: "City Diagnostics", status: "ready", confidence: 91 },
      ],
      addDocument: (d) => set((s) => ({ documents: [...s.documents, d] })),
      vaultDocuments: [],
      addVaultDocument: (d) => set((s) => ({ vaultDocuments: [...s.vaultDocuments, d] })),
      timeline: [
        { id: uid("tl"), year: "2026", title: "Doctor Visit", description: "Follow-up with Dr. Mehta · General Medicine", category: "visit", sourceType: "clinical", date: "Aug 20, 2026", hospital: "CareLink Clinic" },
        { id: uid("tl"), year: "2026", title: "Lab Report", description: "Complete Blood Count · within normal range", category: "lab", sourceType: "document", date: "Aug 18, 2026" },
        { id: uid("tl"), year: "2026", title: "Prescription", description: "Metformin 500 mg · twice daily", category: "medication", sourceType: "clinical", date: "Jun 10, 2026" },
        { id: uid("tl"), year: "2026", title: "Hospital Visit", description: "Outpatient consultation · Hypertension review", category: "visit", sourceType: "clinical", date: "Jul 29, 2026", hospital: "CareLink Clinic" },
        { id: uid("tl"), year: "2025", title: "Vaccination", description: "Influenza annual dose", category: "vaccination", sourceType: "document", date: "Oct 02, 2025" },
        { id: uid("tl"), year: "2025", title: "Lab Report", description: "Lipid profile · monitoring panel", category: "lab", sourceType: "document", date: "Feb 14, 2025" },
      ],
      addTimelineEvent: (e) => set((s) => ({ timeline: [...s.timeline, e] })),
      appointments: [
        { id: uid("apt"), doctorName: "Dr. Arjun Mehta", specialty: "General Medicine", date: "Aug 30, 2026", time: "10:30 AM", location: "CareLink Clinic, Main Road", status: "upcoming", consultationMode: "In-clinic" },
        { id: uid("apt"), doctorName: "Dr. Neha Kapoor", specialty: "Cardiology", date: "Jul 15, 2026", time: "11:00 AM", location: "CareLink Heart Center", status: "completed" },
        { id: uid("apt"), doctorName: "Dr. Arjun Mehta", specialty: "General Medicine", date: "Mar 05, 2026", time: "09:00 AM", location: "CareLink Clinic, Main Road", status: "completed" },
      ],
      addAppointment: (a) => set((s) => ({ appointments: [...s.appointments, a] })),
      labReports: [
        { id: uid("lab"), title: "Complete Blood Count", date: "Aug 18, 2026", status: "Normal", markers: [{ name: "Hb", value: "12.4", unit: "g/dL", normal: "Normal", flag: "normal" }, { name: "WBC", value: "7.2", unit: "×10⁹/L", normal: "Normal", flag: "normal" }, { name: "Platelets", value: "245", unit: "×10⁹/L", normal: "Normal", flag: "normal" }], synthetic: true, source: "CareLink Lab" },
        { id: uid("lab"), title: "Lipid Profile", date: "Feb 14, 2025", status: "Borderline", markers: [{ name: "Total Chol", value: "198", unit: "mg/dL", normal: "Borderline", flag: "warn" }, { name: "LDL", value: "124", unit: "mg/dL", normal: "Normal", flag: "normal" }], synthetic: true, source: "CareLink Lab" },
      ],
      stepsData: {
        today: 8234,
        goal: 10000,
        weekly: [6234, 7801, 9123, 5432, 8901, 7200, 8234],
        monthly: [7100, 8200, 7600, 8400, 7900, 8600, 7800, 8100, 8300, 7700, 8500, 8800],
        avgDaily: 7862,
        last7days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        benchmark: "General adult activity guidance: aim for ~7,500–10,000 steps/day. This is general guidance, not a personalized prescription.",
      },
      sleepData: {
        todayHours: 7.3,
        avgSleep: 6.9,
        bedtime: "11:15 PM",
        wakeTime: "6:30 AM",
        week: [6.8, 7.1, 6.5, 7.3, 6.9, 7.6, 7.3],
        days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },

      notifications: [
        { id: uid("ntf"), type: "appointment", title: "Appointment Reminder", body: "Your appointment with Dr. Mehta is tomorrow at 10:30 AM.", timestamp: now(), read: false, category: "appointment" },
        { id: uid("ntf"), type: "document", title: "New Document", body: "Your lab report has been added to Documents.", timestamp: now(), read: false, category: "document" },
        { id: uid("ntf"), type: "followup", title: "Follow-up Due", body: "It's time for your routine hypertension check-up.", timestamp: now(), read: true, category: "followup" },
      ],
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
          doctorProfile: {
            id: "DR-CL-00123",
            name: "Dr. Arjun Mehta",
            specialization: "General Medicine",
            facility: "CareLink Health Network",
            mobileNumber: "9876500011",
            professionalId: "MCI-88412",
            languages: ["English", "Hindi"],
            experience: "14 years",
            availability: "Mon–Sat, AM 9–5",
            avatarColor: "blue",
          },
          selectedPatientId: null,
        }),

      // MediKiosk
      kioskSession: null,
      startKioskSession: (partial) =>
        set((s) => {
          const base: KioskSession = {
            id: uid("kiosk"),
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
          return { kioskSession: { ...base, ...partial } };
        }),
      setKioskPhase: (phase) =>
        set((s) => ({ kioskSession: s.kioskSession ? { ...s.kioskSession, phase } : s.kioskSession })),
      setKioskInputMode: (inputMode) =>
        set((s) => ({ kioskSession: s.kioskSession ? { ...s.kioskSession, inputMode } : s.kioskSession })),
      setKioskHistoryMode: (historyMode) =>
        set((s) => ({ kioskSession: s.kioskSession ? { ...s.kioskSession, historyMode } : s.kioskSession })),
      setKioskPatientId: (patientId) =>
        set((s) => ({ kioskSession: s.kioskSession ? { ...s.kioskSession, patientId } : s.kioskSession })),
      addConsentRecord: (r) =>
        set((s) => ({
          kioskSession: s.kioskSession
            ? {
                ...s.kioskSession,
                consentRecords: [...s.kioskSession.consentRecords, r],
              }
            : s.kioskSession,
        })),
      addConversationTurn: (t) =>
        set((s) => ({
          kioskSession: s.kioskSession
            ? { ...s.kioskSession, conversationTurns: [...s.kioskSession.conversationTurns, t] }
            : s.kioskSession,
        })),
      setClinicalHistory: (clinicalHistory) =>
        set((s) => ({ kioskSession: s.kioskSession ? { ...s.kioskSession, clinicalHistory } : s.kioskSession })),
      addKioskDocument: (d) =>
        set((s) => ({
          kioskSession: s.kioskSession
            ? { ...s.kioskSession, documents: [...s.kioskSession.documents, d] }
            : s.kioskSession,
        })),
      addRedFlagAlert: (r) =>
        set((s) => ({
          kioskSession: s.kioskSession ? { ...s.kioskSession, redFlags: [...s.kioskSession.redFlags, r] } : s.kioskSession,
        })),
      setPhysicianSummary: (summary) =>
        set((s) => ({ kioskSession: s.kioskSession ? { ...s.kioskSession, summary } : s.kioskSession })),
      completeKioskSession: () =>
        set((s) => ({
          kioskSession: s.kioskSession ? { ...s.kioskSession, phase: "complete", completedAt: now() } : s.kioskSession,
        })),
      resetKioskSession: () => set({ kioskSession: null }),
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
        hasSeenSplash: s.hasSeenSplash,
        role: s.role,
        loginMobile: s.loginMobile,
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
      }),
    }
  )
);

// Convenience: get demo doctors
export { demoDoctors };
