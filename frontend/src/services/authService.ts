// ------------------------------------------------------------------
// CARELINK - Mock Auth Service
// Frontend-only OTP simulation. Demo OTP: 123456
// ------------------------------------------------------------------

import { BRAND } from "@/lib/brand/constants";
import { delay } from "./aiService";

export interface AuthResult {
  ok: boolean;
  error?: string;
}

export function validateMobile(mobile: string): boolean {
  return /^\d{10}$/.test(mobile);
}

export async function sendOtp(mobile: string): Promise<AuthResult> {
  await delay(500);
  if (!validateMobile(mobile)) {
    return { ok: false, error: "Invalid mobile number" };
  }
  return { ok: true };
}

export async function verifyOtp(otp: string): Promise<AuthResult> {
  await delay(400);
  if (otp === BRAND.demoOtp) return { ok: true };
  return { ok: false, error: "Invalid code" };
}
