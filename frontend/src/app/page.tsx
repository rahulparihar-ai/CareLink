"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/store";
import { guardView } from "@/routes";
import { SplashView } from "@/features/SplashView";
import { WelcomeView } from "@/features/auth/WelcomeView";
import { LanguageSelectView } from "@/features/auth/LanguageSelectView";
import { RoleSelectView } from "@/features/auth/RoleSelectView";
import { LoginView } from "@/features/auth/LoginView";
import { DoctorLoginView } from "@/features/auth/DoctorLoginView";
import { OTPView } from "@/features/auth/OTPView";
import { RegisterView } from "@/features/auth/RegisterView";
import { DoctorRegisterView } from "@/features/auth/DoctorRegisterView";
import { AccessibilityView } from "@/features/auth/AccessibilityView";
import { ThemeSelectView } from "@/features/auth/ThemeSelectView";
import { HelpAssistantView } from "@/features/auth/HelpAssistantView";
import { AiAssistantView } from "@/features/ai/AiAssistantView";

// Hospital (Reception / Doctor desk features)
import { HospitalHome } from "@/features/hospital/HospitalHome";
import { RegisterPatientView } from "@/features/hospital/RegisterPatientView";
import { LabReportsView } from "@/features/hospital/LabReportsView";
import { ScanPrescriptionView } from "@/features/hospital/ScanPrescriptionView";

// Patient
import { PatientHome } from "@/features/patient/PatientHome";
import { PatientProfileView } from "@/features/patient/PatientProfileView";
import { PatientSettingsView } from "@/features/patient/PatientSettingsView";
import { PatientHistoryView } from "@/features/patient/PatientHistoryView";
import { PatientTimelineView } from "@/features/patient/PatientTimelineView";
import { PatientDocumentsView } from "@/features/patient/PatientDocumentsView";
import { PatientOcrView } from "@/features/patient/PatientOcrView";
import { PatientMedicationsView } from "@/features/patient/PatientMedicationsView";
import { PatientAllergiesView } from "@/features/patient/PatientAllergiesView";
import { PatientFamilyView } from "@/features/patient/PatientFamilyView";
import { PatientAbhaView } from "@/features/patient/PatientAbhaView";
import { PatientInsuranceView } from "@/features/patient/PatientInsuranceView";
import { PatientVaccinationView } from "@/features/patient/PatientVaccinationView";
import { PatientAppointmentsView } from "@/features/patient/PatientAppointmentsView";
import { PatientAiView } from "@/features/patient/PatientAiView";
import { PatientIntakeView } from "@/features/patient/PatientIntakeView";
import { PatientWellnessView } from "@/features/patient/PatientWellnessView";
import { PatientStepsView } from "@/features/patient/PatientStepsView";
import { PatientSleepView } from "@/features/patient/PatientSleepView";
import { PatientGuidanceView } from "@/features/patient/PatientGuidanceView";
import { PatientNutritionView } from "@/features/patient/PatientNutritionView";
import { NotificationCenter } from "@/features/patient/NotificationCenter";
import { PatientLabView } from "@/features/patient/PatientLabView";

// Doctor
import { DoctorHome } from "@/features/doctor/DoctorHome";
import { DoctorSettingsView } from "@/features/doctor/DoctorSettingsView";
import { DoctorQueueView } from "@/features/doctor/DoctorQueueView";
import { DoctorPriorityView } from "@/features/doctor/DoctorPriorityView";
import { DoctorPatientView } from "@/features/doctor/DoctorPatientView";
import { DoctorCasesView } from "@/features/doctor/DoctorCasesView";
import { DoctorNotesView } from "@/features/doctor/DoctorNotesView";
import { DoctorPrescriptionsView } from "@/features/doctor/DoctorPrescriptionsView";
import { DoctorFollowupsView } from "@/features/doctor/DoctorFollowupsView";
import { DoctorConsultationView } from "@/features/doctor/DoctorConsultationView";

import { PinLockScreen } from "@/components/shared/PinLockScreen";
import { AudioGuidedAnnouncer } from "@/components/shared/AudioGuidedAnnouncer";

// Care Link intake
import { IntakeHome } from "@/features/intake/IntakeHome";
import { IntakeIdentify } from "@/features/intake/IntakeIdentify";
import { IntakeConsent } from "@/features/intake/IntakeConsent";
import { IntakeHistory } from "@/features/intake/IntakeHistory";
import { IntakeDocuments } from "@/features/intake/IntakeDocuments";
import { IntakeSummary } from "@/features/intake/IntakeSummary";
import { IntakeComplete } from "@/features/intake/IntakeComplete";
import { DoctorClinicalView } from "@/features/intake/DoctorClinicalView";

export default function MobileApp() {
  const currentView = useAppStore((s) => s.currentView);
  const role = useAppStore((s) => s.role);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const isUnlocked = useAppStore((s) => s.isUnlocked);
  const largeText = useAppStore((s) => s.largeText);
  const highContrast = useAppStore((s) => s.highContrast);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const audioGuided = useAppStore((s) => s.audioGuided);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  // Enforce role-based routing: the app can never show a portal that does not
  // belong to the active role, and never a portal while logged out.
  const view = guardView(currentView, role);

  const lockedOnly = ["SPLASH", "WELCOME", "LANGUAGE", "ROLE_SELECT", "LOGIN", "DOCTOR_LOGIN", "OTP", "REGISTER", "ACCESSIBILITY", "THEME", "HELP", "AI_ASSISTANT"];
  if (
    pinEnabled &&
    !isUnlocked &&
    !lockedOnly.includes(view)
  ) {
    return <PinLockScreen />;
  }

  const base = "app-shell min-h-dvh";

  const a11yClass =
    (largeText ? " ck-large-text " : "") +
    (highContrast ? " ck-high-contrast " : "") +
    (reducedMotion ? " ck-reduced-motion " : "");

  let content: React.ReactNode;

  switch (view) {
    case "SPLASH":
      content = <SplashView />;
      break;
    case "WELCOME":
      content = <WelcomeView />;
      break;
    case "LANGUAGE":
      content = <LanguageSelectView />;
      break;
    case "ROLE_SELECT":
      content = <RoleSelectView />;
      break;
    case "LOGIN":
      content = <LoginView />;
      break;
    case "DOCTOR_LOGIN":
      content = <DoctorLoginView />;
      break;
    case "OTP":
      content = <OTPView />;
      break;
    case "REGISTER":
      content = <RegisterView />;
      break;
    case "DOCTOR_REGISTER":
      content = <DoctorRegisterView />;
      break;
    case "ACCESSIBILITY":
      content = <AccessibilityView />;
      break;
    case "THEME":
      content = <ThemeSelectView />;
      break;
    case "HELP":
      content = <HelpAssistantView />;
      break;
    case "AI_ASSISTANT":
      content = <AiAssistantView />;
      break;

    // Care Link intake
    case "INTAKE_HOME":
      content = <IntakeHome />;
      break;
    case "INTAKE_IDENTIFY":
      content = <IntakeIdentify />;
      break;
    case "INTAKE_CONSENT":
      content = <IntakeConsent />;
      break;
    case "INTAKE_HISTORY":
      content = <IntakeHistory />;
      break;
    case "INTAKE_DOCUMENTS":
      content = <IntakeDocuments />;
      break;
    case "INTAKE_SUMMARY":
      content = <IntakeSummary />;
      break;
    case "INTAKE_COMPLETE":
      content = <IntakeComplete />;
      break;
    case "DOCTOR_CLINICAL":
      content = <DoctorClinicalView />;
      break;

    // Hospital / Reception desk
    case "HOSPITAL_HOME":
      content = <HospitalHome />;
      break;
    case "REGISTER_PATIENT":
      content = <RegisterPatientView />;
      break;
    case "LAB_REPORTS":
      content = <LabReportsView />;
      break;
    case "SCAN_PRESCRIPTION":
      content = <ScanPrescriptionView />;
      break;

    // Patient
    case "PATIENT_HOME":
      content = <PatientHome />;
      break;
    case "PATIENT_PROFILE":
      content = <PatientProfileView />;
      break;
    case "PATIENT_SETTINGS":
      content = <PatientSettingsView />;
      break;
    case "PATIENT_HISTORY":
      content = <PatientHistoryView />;
      break;
    case "PATIENT_TIMELINE":
      content = <PatientTimelineView />;
      break;
    case "PATIENT_DOCUMENTS":
      content = <PatientDocumentsView />;
      break;
    case "PATIENT_OCR":
      content = <PatientOcrView />;
      break;
    case "PATIENT_MEDICATIONS":
      content = <PatientMedicationsView />;
      break;
    case "PATIENT_ALLERGIES":
      content = <PatientAllergiesView />;
      break;
    case "PATIENT_FAMILY":
      content = <PatientFamilyView />;
      break;
    case "PATIENT_ABHA":
      content = <PatientAbhaView />;
      break;
    case "PATIENT_INSURANCE":
      content = <PatientInsuranceView />;
      break;
    case "PATIENT_VACCINATION":
      content = <PatientVaccinationView />;
      break;
    case "PATIENT_APPOINTMENTS":
      content = <PatientAppointmentsView />;
      break;
    case "PATIENT_AI":
      content = <PatientAiView />;
      break;
    case "PATIENT_INTAKE":
      content = <PatientIntakeView />;
      break;
    case "PATIENT_WELLNESS":
      content = <PatientWellnessView />;
      break;
    case "PATIENT_STEPS":
      content = <PatientStepsView />;
      break;
    case "PATIENT_SLEEP":
      content = <PatientSleepView />;
      break;
    case "PATIENT_GUIDANCE":
      content = <PatientGuidanceView />;
      break;
    case "PATIENT_NUTRITION":
      content = <PatientNutritionView />;
      break;
    case "PATIENT_LAB":
      content = <PatientLabView />;
      break;
    case "NOTIFICATION_CENTER":
      content = <NotificationCenter />;
      break;

    // Doctor
    case "DOCTOR_HOME":
      content = <DoctorHome />;
      break;
    case "DOCTOR_SETTINGS":
      content = <DoctorSettingsView />;
      break;
    case "DOCTOR_QUEUE":
      content = <DoctorQueueView />;
      break;
    case "DOCTOR_PRIORITY":
      content = <DoctorPriorityView />;
      break;
    case "DOCTOR_PATIENT":
      content = <DoctorPatientView />;
      break;
    case "DOCTOR_CASES":
      content = <DoctorCasesView />;
      break;
    case "DOCTOR_NOTES":
      content = <DoctorNotesView />;
      break;
    case "DOCTOR_PRESCRIPTIONS":
      content = <DoctorPrescriptionsView />;
      break;
    case "DOCTOR_FOLLOWUPS":
      content = <DoctorFollowupsView />;
      break;
    case "DOCTOR_CONSULTATION":
      content = <DoctorConsultationView />;
      break;

    default:
      content = <RoleSelectView />;
      break;
  }

  return (
    <div className="app-backdrop">
      <div className={base + a11yClass} data-audio-guided={audioGuided || undefined}>
        <AudioGuidedAnnouncer view={view} />
        <AnimatePresence mode="wait">
          <motion.div
            key={view}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="min-h-dvh"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
