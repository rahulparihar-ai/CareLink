import { describe, it, expect } from "vitest";
import {
  guardView,
  homeForRole,
  postOtpDestination,
  doctorLoginDestination,
} from "./routing";

describe("guardView — role-based routing boundary", () => {
  it("never lets a PATIENT cross into the doctor portal", () => {
    expect(guardView("DOCTOR_HOME", "PATIENT")).toBe("PATIENT_HOME");
    expect(guardView("DOCTOR_QUEUE", "PATIENT")).toBe("PATIENT_HOME");
    expect(guardView("DOCTOR_PATIENT", "PATIENT")).toBe("PATIENT_HOME");
    expect(guardView("DOCTOR_CLINICAL", "PATIENT")).toBe("PATIENT_HOME");
  });

  it("never lets a DOCTOR cross into the patient portal", () => {
    expect(guardView("PATIENT_HOME", "DOCTOR")).toBe("DOCTOR_HOME");
    expect(guardView("PATIENT_MEDICATIONS", "DOCTOR")).toBe("DOCTOR_HOME");
    expect(guardView("PATIENT_PROFILE", "DOCTOR")).toBe("DOCTOR_HOME");
  });

  it("keeps a patient inside the patient portal for their own views", () => {
    expect(guardView("PATIENT_MEDICATIONS", "PATIENT")).toBe("PATIENT_MEDICATIONS");
    expect(guardView("PATIENT_PROFILE", "PATIENT")).toBe("PATIENT_PROFILE");
    expect(guardView("NOTIFICATION_CENTER", "PATIENT")).toBe("NOTIFICATION_CENTER");
  });

  it("keeps a doctor inside the doctor portal for their own views", () => {
    expect(guardView("DOCTOR_QUEUE", "DOCTOR")).toBe("DOCTOR_QUEUE");
    expect(guardView("DOCTOR_SETTINGS", "DOCTOR")).toBe("DOCTOR_SETTINGS");
    expect(guardView("DOCTOR_CLINICAL", "DOCTOR")).toBe("DOCTOR_CLINICAL");
  });

  it("never shows a portal to a logged-out user (null role)", () => {
    expect(guardView("PATIENT_HOME", null)).toBe("WELCOME");
    expect(guardView("DOCTOR_HOME", null)).toBe("WELCOME");
    expect(guardView("HOSPITAL_HOME", null)).toBe("WELCOME");
  });

  it("still allows auth-screen navigation regardless of role", () => {
    expect(guardView("LOGIN", "PATIENT")).toBe("LOGIN");
    expect(guardView("WELCOME", null)).toBe("WELCOME");
    expect(guardView("OTP", "DOCTOR")).toBe("OTP");
  });

  it("allows the doctor login screen even when logged out", () => {
    expect(guardView("DOCTOR_LOGIN", null)).toBe("DOCTOR_LOGIN");
    expect(guardView("DOCTOR_LOGIN", "DOCTOR")).toBe("DOCTOR_LOGIN");
  });

  it("keeps accessibility & help screens available without login and inside auth only", () => {
    expect(guardView("ACCESSIBILITY", null)).toBe("ACCESSIBILITY");
    expect(guardView("HELP", null)).toBe("HELP");
    expect(guardView("PATIENT_SETTINGS", null)).toBe("WELCOME");
  });
});

describe("doctorLoginDestination — doctor ID/password login flow", () => {
  it("sends a first-time doctor to DOCTOR_REGISTER after sign-in", () => {
    expect(doctorLoginDestination(false)).toBe("DOCTOR_REGISTER");
  });

  it("sends a returning doctor straight to their dashboard", () => {
    expect(doctorLoginDestination(true)).toBe("DOCTOR_HOME");
  });
});

describe("postOtpDestination — doctor first-time registration flow", () => {
  it("sends a first-time doctor to DOCTOR_REGISTER before the portal", () => {
    expect(postOtpDestination("DOCTOR", false)).toBe("DOCTOR_REGISTER");
  });

  it("sends a returning doctor straight to their dashboard", () => {
    expect(postOtpDestination("DOCTOR", true)).toBe("DOCTOR_HOME");
  });

  it("sends a patient to REGISTER after OTP", () => {
    expect(postOtpDestination("PATIENT", false)).toBe("REGISTER");
  });
});

describe("homeForRole", () => {
  it("maps each role to the correct portal home", () => {
    expect(homeForRole("PATIENT")).toBe("PATIENT_HOME");
    expect(homeForRole("DOCTOR")).toBe("DOCTOR_HOME");
    expect((homeForRole(null)) satisfies string).toBe("WELCOME");
  });
});