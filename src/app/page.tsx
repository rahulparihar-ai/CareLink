"use client";

import { useSyncExternalStore } from "react";
import { useAppStore } from "@/store";
import { SplashView } from "@/features/SplashView";
import { WelcomeView } from "@/features/auth/WelcomeView";
import { LanguageSelectView } from "@/features/auth/LanguageSelectView";
import { RoleSelectView } from "@/features/auth/RoleSelectView";
import { LoginView } from "@/features/auth/LoginView";
import { OTPView } from "@/features/auth/OTPView";
import { RegisterView } from "@/features/auth/RegisterView";

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
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const isUnlocked = useAppStore((s) => s.isUnlocked);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted) return null;

  const lockedOnly = ["SPLASH", "WELCOME", "LANGUAGE", "ROLE_SELECT", "LOGIN", "OTP", "REGISTER"];
  if (
    pinEnabled &&
    !isUnlocked &&
    !lockedOnly.includes(currentView)
  ) {
    return <PinLockScreen />;
  }

  const base = "app-shell min-h-dvh";

  switch (currentView) {
    case "SPLASH":
      return <SplashView />;
    case "WELCOME":
      return <WelcomeView />;
    case "LANGUAGE":
      return <LanguageSelectView />;
    case "ROLE_SELECT":
      return <RoleSelectView />;
    case "LOGIN":
      return <LoginView />;
    case "OTP":
      return <OTPView />;
    case "REGISTER":
      return <RegisterView />;

    // MediKiosk
    case "KIOSK_HOME":
      return <KioskHome />;
    case "KIOSK_IDENTIFY":
      return <KioskIdentify />;
    case "KIOSK_CONSENT":
      return <KioskConsent />;
    case "KIOSK_HISTORY":
      return <KioskHistory />;
    case "KIOSK_DOCUMENTS":
      return <KioskDocuments />;
    case "KIOSK_SUMMARY":
      return <KioskSummary />;
    case "KIOSK_COMPLETE":
      return <KioskComplete />;
    case "DOCTOR_CLINICAL":
      return <DoctorClinicalView />;

    // Hospital hub
    case "HOSPITAL_HOME":
      return <div className={base}><HospitalHome /></div>;
    case "CONSULTANT_SCHEDULE":
      return <ConsultantScheduleView />;
    case "CONSULTANT_DETAIL":
      return <ConsultantScheduleView />;
    case "TARIFF":
      return <TariffView />;
    case "ROSTER":
      return <RosterView />;
    case "REGISTER_PATIENT":
      return <RegisterPatientView />;
    case "AADHAAR_SCAN":
      return <RegisterPatientView />;
    case "LAB_REPORTS":
      return <LabReportsView />;
    case "SCAN_PRESCRIPTION":
      return <ScanPrescriptionView />;
    case "DOCTOR_DESK":
      return <DoctorDeskView />;

    // Patient
    case "PATIENT_HOME":
      return <div className={base}><PatientHome /></div>;
    case "PATIENT_PROFILE":
      return <PatientProfileView />;
    case "PATIENT_SETTINGS":
      return <PatientSettingsView />;
    case "PATIENT_HISTORY":
      return <PatientHistoryView />;
    case "PATIENT_TIMELINE":
      return <PatientTimelineView />;
    case "PATIENT_DOCUMENTS":
      return <PatientDocumentsView />;
    case "PATIENT_OCR":
      return <PatientOcrView />;
    case "PATIENT_MEDICATIONS":
      return <PatientMedicationsView />;
    case "PATIENT_ALLERGIES":
      return <PatientAllergiesView />;
    case "PATIENT_FAMILY":
      return <PatientFamilyView />;
    case "PATIENT_ABHA":
      return <PatientAbhaView />;
    case "PATIENT_INSURANCE":
      return <PatientInsuranceView />;
    case "PATIENT_VACCINATION":
      return <PatientVaccinationView />;
    case "PATIENT_EMERGENCY":
      return <PatientEmergencyCardView />;
    case "PATIENT_HEALTHCARD":
      return <PatientHealthCardView />;
    case "PATIENT_APPOINTMENTS":
      return <PatientAppointmentsView />;
    case "PATIENT_BOOK_APPOINTMENT":
      return <PatientBookAppointmentView />;
    case "PATIENT_DOCTORS":
      return <PatientDoctorsView />;
    case "PATIENT_DOCTOR_PROFILE":
      return <PatientDoctorProfileView />;
    case "PATIENT_AI":
      return <PatientAiView />;
    case "PATIENT_INTAKE":
      return <PatientIntakeView />;
    case "PATIENT_WELLNESS":
      return <PatientWellnessView />;
    case "PATIENT_STEPS":
      return <PatientStepsView />;
    case "PATIENT_SLEEP":
      return <PatientSleepView />;
    case "PATIENT_GUIDANCE":
      return <PatientGuidanceView />;
    case "PATIENT_NUTRITION":
      return <PatientNutritionView />;
    case "PATIENT_LAB":
      return <PatientLabView />;
    case "NOTIFICATION_CENTER":
      return <NotificationCenter />;

    // Doctor
    case "DOCTOR_HOME":
      return <DoctorHome />;
    case "DOCTOR_SETTINGS":
      return <DoctorSettingsView />;
    case "DOCTOR_QUEUE":
      return <DoctorQueueView />;
    case "DOCTOR_PRIORITY":
      return <DoctorPriorityView />;
    case "DOCTOR_PATIENT":
      return <DoctorPatientView />;
    case "DOCTOR_CASES":
      return <DoctorCasesView />;
    case "DOCTOR_NOTES":
      return <DoctorNotesView />;
    case "DOCTOR_PRESCRIPTIONS":
      return <DoctorPrescriptionsView />;
    case "DOCTOR_FOLLOWUPS":
      return <DoctorFollowupsView />;

    default:
      return <RoleSelectView />;
  }
}
