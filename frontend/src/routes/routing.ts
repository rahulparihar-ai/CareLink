import type { View } from "@/store";

// Role-gated routing for CareLink.
// A user is never allowed to see a portal/view that does not belong to
// their role. This centralises the patient<->doctor boundary so the app can
// never randomly cross from one portal into another.

export type Role = "PATIENT" | "DOCTOR" | "ADMIN" | null;

const AUTH_VIEWS = new Set<View>([
  "SPLASH",
  "WELCOME",
  "LANGUAGE",
  "ROLE_SELECT",
  "LOGIN",
  "DOCTOR_LOGIN",
  "OTP",
  "REGISTER",
  "DOCTOR_REGISTER",
  "ACCESSIBILITY",
  "THEME",
  "HELP",
  "AI_ASSISTANT",
]);

const PATIENT_VIEWS = new Set<View>([
  "PATIENT_HOME",
  "PATIENT_PROFILE",
  "PATIENT_SETTINGS",
  "PATIENT_HISTORY",
  "PATIENT_TIMELINE",
  "PATIENT_DOCUMENTS",
  "PATIENT_OCR",
  "PATIENT_MEDICATIONS",
  "PATIENT_ALLERGIES",
  "PATIENT_FAMILY",
  "PATIENT_ABHA",
  "PATIENT_INSURANCE",
  "PATIENT_VACCINATION",
  "PATIENT_APPOINTMENTS",
  "PATIENT_AI",
  "PATIENT_INTAKE",
  "PATIENT_WELLNESS",
  "PATIENT_STEPS",
  "PATIENT_SLEEP",
  "PATIENT_GUIDANCE",
  "PATIENT_NUTRITION",
  "PATIENT_LAB",
  "NOTIFICATION_CENTER",
]);

const DOCTOR_VIEWS = new Set<View>([
  "DOCTOR_HOME",
  "DOCTOR_SETTINGS",
  "DOCTOR_QUEUE",
  "DOCTOR_PRIORITY",
  "DOCTOR_PATIENT",
  "DOCTOR_CASES",
  "DOCTOR_NOTES",
  "DOCTOR_PRESCRIPTIONS",
  "DOCTOR_FOLLOWUPS",
  "DOCTOR_CONSULTATION",
  "DOCTOR_CLINICAL",
]);

// Care Link intake self-service case-taking terminal + hospital hub.
// Accessible to any authenticated role (both doctor and patient staff flows).
const PUBLICTERMINAL_VIEWS = new Set<View>([
  "INTAKE_HOME",
  "INTAKE_IDENTIFY",
  "INTAKE_CONSENT",
  "INTAKE_HISTORY",
  "INTAKE_DOCUMENTS",
  "INTAKE_SUMMARY",
  "INTAKE_COMPLETE",
  "HOSPITAL_HOME",
  "REGISTER_PATIENT",
  "LAB_REPORTS",
  "SCAN_PRESCRIPTION",
]);

export function homeForRole(role: Role): View {
  switch (role) {
    case "PATIENT":
      return "PATIENT_HOME";
    case "DOCTOR":
      return "DOCTOR_HOME";
    default:
      return "WELCOME";
  }
}

/**
 * Destination a user lands on right after successful OTP verification.
 * Doctors without a completed profile are taken to doctor registration before
 * entering the doctor portal; returning doctors go straight to their dashboard.
 */
export function postOtpDestination(role: Role, hasDoctorProfile: boolean): View {
  if (role === "DOCTOR") {
    return hasDoctorProfile ? "DOCTOR_HOME" : "DOCTOR_REGISTER";
  }
  return "REGISTER";
}

/**
 * Destination a doctor lands on after signing in with hospital-issued
 * credentials. Doctors without a completed profile are taken to doctor
 * registration first.
 */
export function doctorLoginDestination(hasDoctorProfile: boolean): View {
  return hasDoctorProfile ? "DOCTOR_HOME" : "DOCTOR_REGISTER";
}

/**
 * Returns the view the app should actually render given the current role.
 * Any view that does not belong to the active role is redirected to that
 * role's home (or WELCOME if logged out), preventing cross-portal navigation
 * and random dashboard access.
 */
export function guardView(view: View, role: Role): View {
  if (AUTH_VIEWS.has(view)) return view;
  if (role === "PATIENT") {
    if (PATIENT_VIEWS.has(view)) return view;
    if (PUBLICTERMINAL_VIEWS.has(view)) return view;
    return "PATIENT_HOME";
  }
  if (role === "DOCTOR") {
    if (DOCTOR_VIEWS.has(view)) return view;
    if (PUBLICTERMINAL_VIEWS.has(view)) return view;
    return "DOCTOR_HOME";
  }
  // Not authenticated: only auth views are allowed.
  return "WELCOME";
}

export const VIEW_CATEGORY = {
  auth: (v: View) => AUTH_VIEWS.has(v),
  patient: (v: View) => PATIENT_VIEWS.has(v),
  doctor: (v: View) => DOCTOR_VIEWS.has(v),
  terminal: (v: View) => PUBLICTERMINAL_VIEWS.has(v),
};
