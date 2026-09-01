"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/store";
import { guardView } from "@/lib/routing";
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
import { HelpAssistantView } from "@/features/auth/HelpAssistantView";

// Hospital (Swasthya-style)
import { HospitalHome } from "@/features/hospital/HospitalHome";
import { ConsultantScheduleView } from "@/features/hospital/ConsultantScheduleView";
import { TariffView } from "@/features/hospital/TariffView";
import { RosterView } from "@/features/hospital/RosterView";
import { RegisterPatientView } from "@/features/hospital/RegisterPatientView";
import { LabReportsView } from "@/features/hospital/LabReportsView";
import { ScanPrescriptionView } from "@/features/hospital/ScanPrescriptionView";
import { DoctorDeskView } from "@/features/hospital/DoctorDeskView";

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
import { PatientEmergencyCardView } from "@/features/patient/PatientEmergencyCardView";
import { PatientHealthCardView } from "@/features/patient/PatientHealthCardView";
import { PatientAppointmentsView } from "@/features/patient/PatientAppointmentsView";
import { PatientBookAppointmentView } from "@/features/patient/PatientBookAppointmentView";
import { PatientDoctorsView } from "@/features/patient/PatientDoctorsView";
import { PatientDoctorProfileView } from "@/features/patient/PatientDoctorProfileView";
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

import { PinLockScreen } from "@/components/shared/PinLockScreen";

// MediKiosk
import { KioskHome } from "@/features/kiosk/KioskHome";
import { KioskIdentify } from "@/features/kiosk/KioskIdentify";
import { KioskConsent } from "@/features/kiosk/KioskConsent";
import { KioskHistory } from "@/features/kiosk/KioskHistory";
import { KioskDocuments } from "@/features/kiosk/KioskDocuments";
import { KioskSummary } from "@/features/kiosk/KioskSummary";
import { KioskComplete } from "@/features/kiosk/KioskComplete";
import { DoctorClinicalView } from "@/features/kiosk/DoctorClinicalView";

export default function MobileApp() {
  const currentView = useAppStore((s) => s.currentView);
  const role = useAppStore((s) => s.role);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const isUnlocked = useAppStore((s) => s.isUnlocked);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  // Enforce role-based routing: the app can never show a portal that does not
  // belong to the active role, and never a portal while logged out.
  const view = guardView(currentView, role);

  const lockedOnly = ["SPLASH", "WELCOME", "LANGUAGE", "ROLE_SELECT", "LOGIN", "DOCTOR_LOGIN", "OTP", "REGISTER", "ACCESSIBILITY", "HELP"];
  if (
    pinEnabled &&
    !isUnlocked &&
    !lockedOnly.includes(view)
  ) {
    return <PinLockScreen />;
  }

  const base = "app-shell min-h-dvh";

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
    case "HELP":
      content = <HelpAssistantView />;
      break;

    // MediKiosk
    case "KIOSK_HOME":
      content = <KioskHome />;
      break;
    case "KIOSK_IDENTIFY":
      content = <KioskIdentify />;
      break;
    case "KIOSK_CONSENT":
      content = <KioskConsent />;
      break;
    case "KIOSK_HISTORY":
      content = <KioskHistory />;
      break;
    case "KIOSK_DOCUMENTS":
      content = <KioskDocuments />;
      break;
    case "KIOSK_SUMMARY":
      content = <KioskSummary />;
      break;
    case "KIOSK_COMPLETE":
      content = <KioskComplete />;
      break;
    case "DOCTOR_CLINICAL":
      content = <DoctorClinicalView />;
      break;

    // Hospital hub
    case "HOSPITAL_HOME":
      content = <HospitalHome />;
      break;
    case "CONSULTANT_SCHEDULE":
      content = <ConsultantScheduleView />;
      break;
    case "CONSULTANT_DETAIL":
      content = <ConsultantScheduleView />;
      break;
    case "TARIFF":
      content = <TariffView />;
      break;
    case "ROSTER":
      content = <RosterView />;
      break;
    case "REGISTER_PATIENT":
      content = <RegisterPatientView />;
      break;
    case "AADHAAR_SCAN":
      content = <RegisterPatientView />;
      break;
    case "LAB_REPORTS":
      content = <LabReportsView />;
      break;
    case "SCAN_PRESCRIPTION":
      content = <ScanPrescriptionView />;
      break;
    case "DOCTOR_DESK":
      content = <DoctorDeskView />;
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
    case "PATIENT_EMERGENCY":
      content = <PatientEmergencyCardView />;
      break;
    case "PATIENT_HEALTHCARD":
      content = <PatientHealthCardView />;
      break;
    case "PATIENT_APPOINTMENTS":
      content = <PatientAppointmentsView />;
      break;
    case "PATIENT_BOOK_APPOINTMENT":
      content = <PatientBookAppointmentView />;
      break;
    case "PATIENT_DOCTORS":
      content = <PatientDoctorsView />;
      break;
    case "PATIENT_DOCTOR_PROFILE":
      content = <PatientDoctorProfileView />;
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

    default:
      content = <RoleSelectView />;
      break;
  }

  return (
    <div className="app-backdrop">
      <div className={base}>
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
