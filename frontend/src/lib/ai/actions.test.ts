import { describe, it, expect } from "vitest";
import { AI_ACTIONS, isAllowedAction, actionToView } from "./actions";

describe("AI action allowlist", () => {
  it("includes only the strict known actions", () => {
    expect(AI_ACTIONS).toEqual([
      "NONE",
      "OPEN_LANGUAGE_SELECTION",
      "OPEN_LOGIN",
      "OPEN_PATIENT_REGISTRATION",
      "OPEN_DOCTOR_REGISTRATION",
      "OPEN_HELP",
      "OPEN_ABHA",
      "OPEN_CONSENT",
      "OPEN_DOCUMENT_CENTER",
      "START_AI_HISTORY",
      "OPEN_PATIENT_DASHBOARD",
      "OPEN_DOCTOR_DASHBOARD",
      "GO_BACK",
    ]);
  });

  it("rejects arbitrary/injected actions (Phase 6 allowlist enforcement)", () => {
    expect(isAllowedAction("OPEN_PATIENT_REGISTRATION")).toBe(true);
    expect(isAllowedAction("NONE")).toBe(true);
    expect(isAllowedAction("DROP_DATABASE")).toBe(false);
    expect(isAllowedAction("window.location")).toBe(false);
    expect(isAllowedAction(123)).toBe(false);
    expect(isAllowedAction(null)).toBe(false);
  });

  it("returns null for pre-login actions that require a patient portal", () => {
    // In the startup (logged-out) flow these must not navigate anywhere.
    expect(actionToView("START_AI_HISTORY", null)).toBeNull();
    expect(actionToView("OPEN_ABHA", null)).toBeNull();
    expect(actionToView("OPEN_DOCUMENT_CENTER", "PATIENT" as const)).toBe("PATIENT_DOCUMENTS");
  });
});

describe("actionToView navigation", () => {
  it("maps patient/doctor registration and language selection for startup", () => {
    expect(actionToView("OPEN_PATIENT_REGISTRATION", null)).toBe("REGISTER");
    expect(actionToView("OPEN_DOCTOR_REGISTRATION", null)).toBe("DOCTOR_REGISTER");
    expect(actionToView("OPEN_LANGUAGE_SELECTION", null)).toBe("LANGUAGE");
    expect(actionToView("OPEN_HELP", null)).toBe("HELP");
    expect(actionToView("OPEN_LOGIN", null)).toBe("LOGIN");
  });

  it("routes doctor login for a doctor role", () => {
    expect(actionToView("OPEN_LOGIN", "DOCTOR")).toBe("DOCTOR_LOGIN");
    expect(actionToView("OPEN_LOGIN", "PATIENT")).toBe("LOGIN");
  });

  it("returns null for NONE", () => {
    expect(actionToView("NONE", null)).toBeNull();
  });
});