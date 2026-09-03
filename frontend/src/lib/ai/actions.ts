// ------------------------------------------------------------------
// CARELINK AI - Strict Action Allowlist
//
// The AI never returns JavaScript, URLs, or arbitrary commands. It can
// only request one of the actions below. The client resolves an allowed
// action to an internal view; anything else is ignored.
//
// This module is intentionally free of secrets so it can be imported on
// both the server (route validation) and the client (action -> view map).
// ------------------------------------------------------------------

export const AI_ACTIONS = [
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
] as const;

export type AiAssistantAction = (typeof AI_ACTIONS)[number];

/** Runtime-check an arbitrary string against the allowlist. */
export function isAllowedAction(value: unknown): value is AiAssistantAction {
  return typeof value === "string" && (AI_ACTIONS as readonly string[]).includes(value);
}

/**
 * Resolve an allowed action to an internal CareLink view (client-side).
 * Returns null for actions that carry no navigation (e.g. NONE) or that
 * should not navigate yet (e.g. actions handled as guidance text only).
 * Set `role` to null when the user is on the pre-login startup flow.
 */
export function actionToView(action: AiAssistantAction, role: "PATIENT" | "DOCTOR" | null): string | null {
  switch (action) {
    case "OPEN_LANGUAGE_SELECTION":
      return "LANGUAGE";
    case "OPEN_LOGIN":
      return role === "DOCTOR" ? "DOCTOR_LOGIN" : "LOGIN";
    case "OPEN_PATIENT_REGISTRATION":
      return "REGISTER";
    case "OPEN_DOCTOR_REGISTRATION":
      return "DOCTOR_REGISTER";
    case "OPEN_HELP":
      return "HELP";
    case "OPEN_ABHA":
      return role === "PATIENT" ? "PATIENT_ABHA" : null;
    case "OPEN_CONSENT":
      // Consent forms are captured during registration / kiosk case-taking.
      return role === "PATIENT" ? "REGISTER" : null;
    case "OPEN_DOCUMENT_CENTER":
      return role === "PATIENT" ? "PATIENT_DOCUMENTS" : null;
    case "START_AI_HISTORY":
      return role === "PATIENT" ? "PATIENT_AI" : null;
    case "OPEN_PATIENT_DASHBOARD":
      return "PATIENT_HOME";
    case "OPEN_DOCTOR_DASHBOARD":
      return "DOCTOR_HOME";
    case "GO_BACK":
      return "__BACK__";
    case "NONE":
    default:
      return null;
  }
}