// ------------------------------------------------------------------
// CARELINK AI - Gateway
//
// Coordinates the AI layer:
//   - owns the system prompt (Phase 4 requirement: server owns the prompt)
//   - builds the provider message list
//   - runs MOCK MODE when configured (deterministic, no credentials needed)
//   - sends to the configured primary provider
//   - fails over to a secondary provider when enabled
//   - enforces timeouts, validates the structured JSON, and allows only
//     allowlisted actions (Phase 6)
//   - maps provider failures to safe user-facing categories
//
// Server-only.
// ------------------------------------------------------------------

import type { LanguageCode } from "@/types";
import { getAiConfig } from "./config";
import { buildSystemPrompt, buildOutputFormatInstruction } from "./prompts";
import { OpenAICompatibleProvider } from "./providers/openai";
import { isAllowedAction } from "./actions";
import type {
  AiAssistantAction,
  AiChatMessage,
  AiChatRequest,
  AiChatResponse,
  AiProvider,
} from "./types";
import { AiProviderError } from "./types";

export class AiGateway {
  private primary: AiProvider | null;
  private fallback: AiProvider | null;
  private mock: boolean;
  private timeoutMs: number;
  private maxInputChars: number;

  constructor(config = getAiConfig()) {
    this.mock = config.mock;
    this.timeoutMs = config.timeoutMs;
    this.maxInputChars = config.maxInputChars;
    this.primary = config.primary ? new OpenAICompatibleProvider("primary", config.primary) : null;
    this.fallback = config.fallback ? new OpenAICompatibleProvider("fallback", config.fallback) : null;
  }

  get isMock(): boolean {
    return this.mock;
  }

  /**
   * Handle a chat request and return a validated, safe response envelope.
   * Never throws for user-facing input; provider failures are mapped to a
   * generic response with a `success: false` + safe error category.
   */
  async chat(request: AiChatRequest): Promise<AiChatResponse> {
    // Validate & sanitize input defensively.
    const message = sanitize(request.message, this.maxInputChars);
    const language = normalizeLanguage(request.language);
    if (!message) {
      return buildErrorResponse("invalid", language, "EMPTY_INPUT");
    }

    // Mock mode: deterministic, credential-free.
    if (this.mock) {
      return this.mockReply(message, language);
    }

    if (!this.primary?.isConfigured()) {
      return buildErrorResponse("provider", language, "NOT_CONFIGURED");
    }

    const system = [
      buildSystemPrompt(language, request.mode ?? "onboarding"),
      buildOutputFormatInstruction(),
    ].join("\n\n");

    const messages: AiChatMessage[] = [
      { role: "system", content: system },
      ...(request.context ?? []).map((t) => ({ role: t.role as "user" | "assistant", content: sanitize(t.content, this.maxInputChars) })),
      { role: "user", content: message },
    ];

    // Try primary (and optionally fallback).
    const provider = this.primary;
    let raw: string;
    try {
      const result = await provider.complete(messages);
      raw = result.text;
    } catch (err) {
      // Legitimate failover: try the fallback if enabled.
      if (this.fallback?.isConfigured()) {
        try {
          const result = await this.fallback.complete(messages);
          raw = result.text;
        } catch (fallbackErr) {
          return mapProviderError(fallbackErr, language);
        }
      } else {
        return mapProviderError(err, language);
      }
    }

    return this.parseResponse(raw, language);
  }

  /** Parse + validate the model's JSON envelope. Rejects bad actions. */
  private parseResponse(raw: string, language: LanguageCode): AiChatResponse {
    const parsed = safeParseJson(raw);
    if (!parsed || typeof parsed !== "object") {
      return buildErrorResponse("invalid", language, "MALFORMED_JSON");
    }
    const obj = parsed as Record<string, unknown>;
    const message = typeof obj.message === "string" ? obj.message.trim() : "";

    // Allowlist enforcement (Phase 6) - never accept an unlisted action.
    let action: AiAssistantAction | null = "NONE";
    if (obj.action !== undefined) {
      const candidate = obj.action;
      if (candidate === null || candidate === "NONE") {
        action = "NONE";
      } else if (isAllowedAction(candidate)) {
        action = candidate;
      } else {
        // Invalid action -> reject the whole action, keep a safe reply.
        action = "NONE";
      }
    }

    if (!message) {
      return buildErrorResponse("invalid", language, "EMPTY_RESPONSE");
    }

    return {
      success: true,
      message,
      language,
      action: action === "NONE" ? null : action,
      actionParams: isPlainRecord(obj.actionParams),
    };
  }

  private mockReply(message: string, language: LanguageCode): AiChatResponse {
    return deterministicMock(message, language);
  }
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function sanitize(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizeLanguage(lang: unknown): LanguageCode {
  const known: LanguageCode[] = ["en", "hi", "ur", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as"];
  return known.find((l) => l === lang) ?? "en";
}

function isPlainRecord(v: unknown): Record<string, string | number | boolean | null | undefined> {
  if (v === null || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string | number | boolean | null | undefined> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null) {
      out[k] = val as never;
    }
  }
  return out;
}

/** The only field a caller sees as `success` is a boolean; errors are generic. */
function buildErrorResponse(
  error: NonNullable<AiChatResponse["error"]>,
  language: LanguageCode,
  _code: string
): AiChatResponse {
  return {
    success: false,
    message: "",
    language,
    action: null,
    actionParams: {},
    error,
  };
}

function mapProviderError(err: unknown, language: LanguageCode): AiChatResponse {
  if (err instanceof AiProviderError) {
    const kind = err.kind;
    if (kind === "unauthorized") return buildErrorResponse("provider", language, "UNAUTHORIZED");
    if (kind === "rate_limit") return buildErrorResponse("rate_limit", language, "RATE_LIMIT");
    if (kind === "quota") return buildErrorResponse("quota", language, "QUOTA");
    if (kind === "timeout") return buildErrorResponse("timeout", language, "TIMEOUT");
    if (kind === "invalid_response") return buildErrorResponse("invalid", language, "INVALID");
    return buildErrorResponse("provider", language, "NETWORK");
  }
  return buildErrorResponse("provider", language, "UNKNOWN");
}

/**
 * Deterministic mock. No fake patient/doctor MEDICAL data - only assistant
 * behaviour for onboarding/testing. Replies use the selected language where
 * feasible (English/Hindi/Urdu short replies; fallback to English otherwise).
 */
function deterministicMock(message: string, language: LanguageCode): AiChatResponse {
  const q = message.toLowerCase();

  if (/(register|sign up|signup|patient)/.test(q)) {
    return { success: true, message: mockText(language, "register"), language, action: "OPEN_PATIENT_REGISTRATION", actionParams: {} };
  }
  if (/(doctor|hospital staff)/.test(q)) {
    return { success: true, message: mockText(language, "doctor"), language, action: "OPEN_DOCTOR_REGISTRATION", actionParams: {} };
  }
  if (/(language|भाषा|زبان)/.test(q)) {
    return { success: true, message: mockText(language, "language"), language, action: "OPEN_LANGUAGE_SELECTION", actionParams: {} };
  }
  if (/(help|help desk|सहायता|مدد)/.test(q)) {
    return { success: true, message: mockText(language, "help"), language, action: "OPEN_HELP", actionParams: {} };
  }
  if (/(login|sign in|लॉगिन)/.test(q)) {
    return { success: true, message: mockText(language, "login"), language, action: "OPEN_LOGIN", actionParams: {} };
  }
  return { success: true, message: mockText(language, "fallback"), language, action: null, actionParams: {} };
}

/** Minimal translated strings for the mock path. Missing languages fall back to English. */
function mockText(language: LanguageCode, key: string): string {
  const t: Record<string, Record<string, string>> = {
    register: {
      en: "Of course. Let's start patient registration. I'll guide you through it.",
      hi: "ज़रूर। चलिए मरीज़ पंजीकरण शुरू करते हैं। मैं आपका मार्गदर्शन करूँगा।",
      ur: "بالکل۔ آئیے مریض رجسٹریشن شروع کریں۔ میں آپ کی رہنمائی کروں گا۔",
      bn: "অবশ্যই। চলুন রোগী নিবন্ধন শুরু করি। আমি আপনাকে গাইড করব।",
    },
    doctor: {
      en: "Sure. Let's set up the doctor registration flow so you can join as a healthcare professional.",
      hi: "ज़रूर। चलिए डॉक्टर पंजीकरण शुरू करते हैं ताकि आप स्वास्थ्य पेशेवर के रूप में जुड़ सकें।",
      ur: "بالکل۔ آئیے ڈاکٹر رجسٹریشن شروع کریں تاکہ آپ صحت کے پیشہ ور کے طور پر شامل ہو سکیں۔",
      bn: "অবশ্যই। আসুন ডাক্তার নিবন্ধন শুরু করি যাতে আপনি স্বাস্থ্যসেবা পেশাজীবী হিসেবে যোগ দিতে পারেন।",
    },
    language: {
      en: "Let's open the language selection so you can pick your preferred language.",
      hi: "आइए भाषा चयन खोलें ताकि आप अपनी पसंदीदा भाषा चुन सकें।",
      ur: "آئیے زبان کا انتخاب کھولیں تاکہ آپ اپنی پسندیدہ زبان منتخب کر سکیں۔",
      bn: "চলুন ভাষা নির্বাচন খুলি যাতে আপনি আপনার পছন্দের ভাষা বেছে নিতে পারেন।",
    },
    help: {
      en: "I can open the Help Desk for you, which explains every part of CareLink.",
      hi: "मैं आपके लिए सहायता डेस्क खोल सकता हूँ, जो केयरलिंक के हर हिस्से की जानकारी देता है।",
      ur: "میں آپ کے لیے ہیلپ ڈیسک کھول سکتا ہوں، جو کیئرلنک کے ہر حصے کی وضاحت کرتا ہے۔",
      bn: "আমি আপনার জন্য হেল্প ডেস্ক খুলতে পারি, যা কেয়ারলিংকের প্রতিটি অংশ বোঝায়।",
    },
    login: {
      en: "I'll take you to the login screen. You can sign in with your mobile number.",
      hi: "मैं आपको लॉगिन स्क्रीन पर ले जाऊँगा। आप अपने मोबाइल नंबर से साइन इन कर सकते हैं।",
      ur: "میں آپ کو لاگ ان اسکرین پر لے جاؤں گا۔ آپ اپنے موبائل نمبر سے سائن ان کر سکتے ہیں۔",
      bn: "আমি আপনাকে লগইন স্ক্রিনে নিয়ে যাব। আপনি আপনার মোবাইল নম্বর দিয়ে সাইন ইন করতে পারেন।",
    },
    fallback: {
      en: "I'm here to help you get started with CareLink. You can ask me to begin patient registration, join as a doctor, change the language, or open the Help Desk.",
      hi: "मैं केयरलिंक शुरू करने में आपकी मदद के लिए यहाँ हूँ। आप मुझसे मरीज़ पंजीकरण, डॉक्टर के रूप में जुड़ने, भाषा बदलने या सहायता डेस्क खोलने के लिए कह सकते हैं।",
      ur: "میں کیئرلنک شروع کرنے میں آپ کی مدد کے لیے حاضر ہوں۔ آپ مجھ سے مریض رجسٹریشن، ڈاکٹر کے طور پر شامل ہونے، زبان تبدیل کرنے یا ہیلپ ڈیسک کھولنے کے لیے کہہ سکتے ہیں۔",
      bn: "আমি কেয়ারলিংক শুরু করতে আপনাকে সাহায্য করার জন্য এখানে আছি। আপনি আমাকে রোগী নিবন্ধন, ডাক্তার হিসেবে যোগ দেওয়া, ভাষা পরিবর্তন বা হেল্প ডেস্ক খোলার জন্য বলতে পারেন।",
    },
  };
  const bucket = t[key] ?? t.fallback;
  return bucket[language] ?? bucket.en ?? "Welcome to CareLink. I can help you get started.";
}

function safeParseJson(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*|```$/g, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    // Attempt to salvage a top-level JSON object if the model wrapped text.
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}