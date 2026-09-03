// ------------------------------------------------------------------
// CARELINK - Mock Verification Service (frontend prototype)
//
// Professional + identity verification are SIMULATED so the prototype
// can be exercised end-to-end. The code is clearly labelled for the
// demo and never claims to be a real NMC / state-council / government
// verification. In production these adapters call the real registries:
//   - NMC / State Medical Council
//   - ABDM / HPR (Health Professional Registry)
//   - ABDM / ABHA
// The UI (Professional Verification + Identity Verification) stays the
// same; only the underlying adapter changes.
// ------------------------------------------------------------------

import { delay } from "./aiService";

export type VerificationStatus = "verified" | "pending" | "failed";

export interface VerificationResult {
  status: VerificationStatus;
  label: string;
}

// Demo mode. Returns "Demo Verified" for a non-empty registration number.
// This is intentionally NOT a claim of real government verification.
export async function verifyProfessionalCredentials(input: {
  name?: string;
  registrationNumber?: string;
  council?: string;
}): Promise<VerificationResult> {
  await delay(900);
  if (input.registrationNumber && input.registrationNumber.trim().length >= 4) {
    return { status: "verified", label: "Demo Verified" };
  }
  return { status: "pending", label: "Verification Pending" };
}

// Identity verification is kept SEPARATE from professional verification
// (spec §6). Demo returns a mock identity state.
export async function verifyIdentity(input: {
  name?: string;
  mobile?: string;
}): Promise<VerificationResult> {
  await delay(600);
  if (input.mobile && input.mobile.trim().length >= 10) {
    return { status: "verified", label: "Identity Verified (Demo)" };
  }
  return { status: "pending", label: "Identity Verification Pending" };
}

// Human-readable label for a stored status.
export function professionalStatusLabel(status?: VerificationStatus): string {
  if (status === "verified") return "Demo Verified";
  if (status === "failed") return "Verification Failed";
  return "Verification Pending";
}

export function identityStatusLabel(verified?: boolean): string {
  return verified ? "Identity Verified" : "Identity Pending";
}