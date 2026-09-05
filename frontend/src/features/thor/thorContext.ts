// ------------------------------------------------------------------
// CARELINK - Thor Page Guide Map (client)
//
// Maps each app view to a localized guide line Thor narrates when the
// user lands on that page. Content lives in the i18n store as
// `thor.guide.<VIEW>` keys so every language gets the same set (parity
// enforced by tests). Unmapped views fall back to a friendly default.
// ------------------------------------------------------------------

import type { View } from "@/store";

const GUIDE_KEYS: Partial<Record<View, string>> = {
  // Patient portal
  PATIENT_HOME: "thor.guide.PATIENT_HOME",
  PATIENT_PROFILE: "thor.guide.PATIENT_PROFILE",
  PATIENT_SETTINGS: "thor.guide.PATIENT_SETTINGS",
  PATIENT_HISTORY: "thor.guide.PATIENT_HISTORY",
  PATIENT_TIMELINE: "thor.guide.PATIENT_TIMELINE",
  PATIENT_DOCUMENTS: "thor.guide.PATIENT_DOCUMENTS",
  PATIENT_OCR: "thor.guide.PATIENT_OCR",
  PATIENT_MEDICATIONS: "thor.guide.PATIENT_MEDICATIONS",
  PATIENT_ALLERGIES: "thor.guide.PATIENT_ALLERGIES",
  PATIENT_FAMILY: "thor.guide.PATIENT_FAMILY",
  PATIENT_ABHA: "thor.guide.PATIENT_ABHA",
  PATIENT_INSURANCE: "thor.guide.PATIENT_INSURANCE",
  PATIENT_VACCINATION: "thor.guide.PATIENT_VACCINATION",
  PATIENT_APPOINTMENTS: "thor.guide.PATIENT_APPOINTMENTS",
  PATIENT_AI: "thor.guide.PATIENT_AI",
  PATIENT_INTAKE: "thor.guide.PATIENT_INTAKE",
  PATIENT_WELLNESS: "thor.guide.PATIENT_WELLNESS",
  PATIENT_STEPS: "thor.guide.PATIENT_STEPS",
  PATIENT_SLEEP: "thor.guide.PATIENT_SLEEP",
  PATIENT_GUIDANCE: "thor.guide.PATIENT_GUIDANCE",
  PATIENT_NUTRITION: "thor.guide.PATIENT_NUTRITION",
  PATIENT_LAB: "thor.guide.PATIENT_LAB",
  NOTIFICATION_CENTER: "thor.guide.NOTIFICATION_CENTER",
  PATIENT_AYUSH: "thor.guide.PATIENT_AYUSH",
  PATIENT_AYUSH_INTERVIEW: "thor.guide.PATIENT_AYUSH_INTERVIEW",
  PATIENT_AYUSH_SUMMARY: "thor.guide.PATIENT_AYUSH_SUMMARY",

  // Doctor portal
  DOCTOR_HOME: "thor.guide.DOCTOR_HOME",
  DOCTOR_SETTINGS: "thor.guide.DOCTOR_SETTINGS",
  DOCTOR_QUEUE: "thor.guide.DOCTOR_QUEUE",
  DOCTOR_PRIORITY: "thor.guide.DOCTOR_PRIORITY",
  DOCTOR_PATIENT: "thor.guide.DOCTOR_PATIENT",
  DOCTOR_CASES: "thor.guide.DOCTOR_CASES",
  DOCTOR_NOTES: "thor.guide.DOCTOR_NOTES",
  DOCTOR_PRESCRIPTIONS: "thor.guide.DOCTOR_PRESCRIPTIONS",
  DOCTOR_FOLLOWUPS: "thor.guide.DOCTOR_FOLLOWUPS",
  DOCTOR_CONSULTATION: "thor.guide.DOCTOR_CONSULTATION",
  DOCTOR_CLINICAL: "thor.guide.DOCTOR_CLINICAL",
  DOCTOR_AYUSH_REVIEW: "thor.guide.DOCTOR_AYUSH_REVIEW",

  // Hospital role
  HOSPITAL_HOME: "thor.guide.HOSPITAL_HOME",
  REGISTER_PATIENT: "thor.guide.REGISTER_PATIENT",
  LAB_REPORTS: "thor.guide.LAB_REPORTS",
  SCAN_PRESCRIPTION: "thor.guide.SCAN_PRESCRIPTION",

  // Care Link intake
  INTAKE_HOME: "thor.guide.INTAKE_HOME",
  INTAKE_IDENTIFY: "thor.guide.INTAKE_IDENTIFY",
  INTAKE_CONSENT: "thor.guide.INTAKE_CONSENT",
  INTAKE_HISTORY: "thor.guide.INTAKE_HISTORY",
  INTAKE_DOCUMENTS: "thor.guide.INTAKE_DOCUMENTS",
  INTAKE_SUMMARY: "thor.guide.INTAKE_SUMMARY",
  INTAKE_COMPLETE: "thor.guide.INTAKE_COMPLETE",
};

export const THOR_GUIDE_DEFAULT_KEY = "thor.guide.DEFAULT";

/** Resolve the localized guide key for a view (falls back to default). */
export function thorGuideKey(view: View): string {
  return GUIDE_KEYS[view] ?? THOR_GUIDE_DEFAULT_KEY;
}