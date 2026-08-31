import type { ConsentRecord, LanguageCode } from "@/types";
import { uid } from "@/lib/brand/constants";

// ------------------------------------------------------------------
// MEDIKIOSK - Consent, Privacy & ABDM Integration
// Models the ABDM consent framework + DPDP Act 2023 compliance.
// Consent is granular, revocable, and audio-guided for low-literacy users.
// ------------------------------------------------------------------

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export type ConsentType =
  | "data_capture"
  | "document_scan"
  | "ai_analysis"
  | "abdm_link"
  | "his_share"
  | "research";

export interface ConsentOption {
  type: ConsentType;
  title: string;
  description: string;
  audio: string;
  required: boolean;
  defaultGranted: boolean;
}

export const CONSENT_OPTIONS: ConsentOption[] = [
  {
    type: "data_capture",
    title: "Capture my medical history",
    description: "Record my health information provided in this conversation to help my doctor.",
    audio: "We will record the health information you share during this session to help your doctor.",
    required: true,
    defaultGranted: true,
  },
  {
    type: "document_scan",
    title: "Scan my medical documents",
    description: "Digitize prescriptions, lab reports & discharge summaries I upload.",
    audio: "We will scan and organize the medical documents you upload.",
    required: true,
    defaultGranted: true,
  },
  {
    type: "ai_analysis",
    title: "AI processing",
    description: "Use AI to structure my history and extract information from my documents.",
    audio: "Artificial intelligence will help organize your information for your doctor.",
    required: true,
    defaultGranted: true,
  },
  {
    type: "abdm_link",
    title: "Link to my ABHA health record",
    description: "Connect this session to my Ayushman Bharat Health Account (ABDM ecosystem).",
    audio: "We will connect this health information to your ABHA health account.",
    required: false,
    defaultGranted: true,
  },
  {
    type: "his_share",
    title: "Share with this hospital",
    description: "Push my clinical summary to this hospital's information system.",
    audio: "We will share your summary with this hospital so your doctor can see it.",
    required: true,
    defaultGranted: true,
  },
  {
    type: "research",
    title: "Use for anonymous research",
    description: "Help improve healthcare using de-identified data. No personal details shared.",
    audio: "Your information may be used without your name for medical research.",
    required: false,
    defaultGranted: false,
  },
];

export const CONSENT_SERVICE = {
  /** Create a consent record for a granted type */
  createRecord(
    type: ConsentType,
    patientId: string,
    granted: boolean,
    language: LanguageCode,
    audioPlayed = true
  ): ConsentRecord {
    return {
      id: uid("consent"),
      patientId,
      timestamp: new Date().toISOString(),
      type,
      granted,
      language,
      audioPlayed,
      revocable: true,
    };
  },

  /** Simulate playing an audio explanation */
  async playAudio(_message: string): Promise<void> {
    // In production this would use TTS (Bhashini/AI4Bharat)
    await delay(400);
    return;
  },

  /** Simulate authenticating via ABHA ID */
  async authenticateAbha(abhaId: string): Promise<{ ok: boolean; name?: string; error?: string }> {
    await delay(1200);
    if (!abhaId || abhaId.length < 8) {
      return { ok: false, error: "Please enter a valid ABHA ID (min 8 characters)." };
    }
    return {
      ok: true,
      name: "Rahul Sharma", // simulated
    };
  },

  /** Simulate Aadhaar QR decode */
  async decodeAadhaarQr(): Promise<{ ok: boolean; profile?: Partial<{ name: string; dob: string; gender: string; aadhaarLast4: string }>; error?: string }> {
    await delay(1500);
    return {
      ok: true,
      profile: {
        name: "Rahul Sharma",
        dob: "12/03/1992",
        gender: "Male",
        aadhaarLast4: "4821",
      },
    };
  },

  /** Simulate pushing the structured history to the hospital HIS + ABHA */
  async pushToHis(_summaryId: string, _abhaLinked: boolean): Promise<{ ok: boolean; reference: string; error?: string }> {
    await delay(1000);
    return {
      ok: true,
      reference: `HIS-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
    };
  },

  /** Simulate clearing temporary session data post-submission */
  async clearSessionData(): Promise<void> {
    await delay(300);
    return;
  },
};
