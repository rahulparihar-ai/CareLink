// ------------------------------------------------------------------
// CARELINK AI - Shared Types
//
// Provider-independent contracts for the AI layer. The UI, gateway and
// individual provider adapters all speak to these interfaces so a provider
// can be swapped without touching application code.
// ------------------------------------------------------------------

import type { LanguageCode } from "@/types";
import type { AiAssistantAction } from "./actions";

export type { AiAssistantAction } from "./actions";

// ---- Chat request/response ----------------------------------------

export interface AiChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type AiAssistantMode = "onboarding" | "help";

/** A provider transport message. The system message is owned by the gateway. */
export interface AiChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AiChatRequest {
  /** The user's free-text or transcribed message. */
  message: string;
  /** Active CareLink language code (drives the reply language). */
  language: LanguageCode;
  /** Optional conversational context (previous turns). */
  context?: AiChatTurn[];
  /**
   * The assistant's current role in the flow. The startup assistant only
   * supports "onboarding"; "help" is reserved for later non-startup help.
   */
  mode?: AiAssistantMode;
  /** App-level product version / build label for the prompt. */
  appVersion?: string;
}

/** Structured, allowlisted response returned to the client (Phase 6). */
export interface AiChatResponse {
  success: boolean;
  message: string;
  language: LanguageCode;
  action: AiAssistantAction | null;
  actionParams: Record<string, string | number | boolean | null | undefined>;
  /** True when the reply was produced by the deterministic mock provider. */
  mock?: boolean;
  /** Provider-level failure category, surfaced only as a generic message. */
  error?: "provider" | "timeout" | "rate_limit" | "quota" | "invalid";
}

export interface AiProviderResult {
  /** Raw text returned by the model (may include trailing whitespace). */
  text: string;
  /** Which provider key produced this result (for diagnostics; not user-facing). */
  provider: string;
}

export type AiProviderErrorKind = "timeout" | "rate_limit" | "quota" | "unauthorized" | "network" | "invalid_response";

export class AiProviderError extends Error {
  kind: AiProviderErrorKind;
  constructor(kind: AiProviderErrorKind, message: string) {
    super(message);
    this.name = "AiProviderError";
    this.kind = kind;
  }
}

// ---- Provider adapter contract (Phase 2 / 14) ----------------------

/** A single chat-completions provider. Implementations are server-only. */
export interface AiProvider {
  readonly key: string;
  /** Whether required credentials are present for live inference. */
  isConfigured(): boolean;
  /** Send a prebuilt message list and return the model's raw text output. */
  complete(messages: AiChatMessage[]): Promise<AiProviderResult>;
}

// ---- Speech contracts (Phase 11) -----------------------------------

export type SpeechRecognitionStatus =
  | "idle"
  | "listening"
  | "processing"
  | "error";

export interface SpeechToTextResult {
  transcript: string;
  language: LanguageCode;
  isFinal: boolean;
}

export interface SpeechToTextProvider {
  readonly id: string;
  available(): boolean;
  /** Start listening; returns an object that can stop recognition. */
  start(opts: {
    language: LanguageCode;
    onResult: (r: SpeechToTextResult) => void;
    onError: (kind: string, message: string) => void;
    onEnd: () => void;
  }): { stop: () => void };
}

export interface TextToSpeechProvider {
  readonly id: string;
  available(): boolean;
  speak(text: string, language: LanguageCode, onEnd?: () => void): void;
  cancel(): void;
  isSpeaking(): boolean;
}

// ---- Future clinical AI interfaces (Phase 15) ----------------------
// Interfaces only - NOT implemented. These keep the startup assistant
// separate from the future clinical AI modules and provide stable seams.

export interface ClinicalAiRequest {
  language: LanguageCode;
  context: Record<string, unknown>;
}

export interface ClinicalAiResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AiHistoryTakingProvider {
  adaptiveQuestion(request: ClinicalAiRequest): Promise<ClinicalAiResult<string>>;
}
export interface AiRedFlagDetector {
  detect(request: ClinicalAiRequest): Promise<ClinicalAiResult<{ flags: string[]; urgent: boolean }>>;
}
export interface AiDocumentExtractor {
  extract(request: ClinicalAiRequest): Promise<ClinicalAiResult<Record<string, unknown>>>;
}
export interface AiTimelineExtractor {
  extractTimeline(request: ClinicalAiRequest): Promise<ClinicalAiResult<Record<string, unknown>[]>>;
}
export interface AiClinicalSummarizer {
  summarize(request: ClinicalAiRequest): Promise<ClinicalAiResult<string>>;
}
export interface AiNoteDrafter {
  draftNote(request: ClinicalAiRequest): Promise<ClinicalAiResult<string>>;
}