// ------------------------------------------------------------------
// CARELINK AI - Wellness Gateway (server-only)
//
// Backs the patient-facing "Health Guidance", "Ask AI about nutrition" and
// "AI health assistance" features. It reuses the server-only AI config and the
// OpenAI-compatible provider (OpenRouter works out of the box). It NEVER runs
// in the browser: secrets stay server-side.
//
// SAFETY: This assistant provides ONLY general wellness/health-habit
// information. It does not diagnose, prescribe, or escalate symptoms. Every
// reply carries a disclaimer, and when the provider is unavailable or not
// configured we return safe, generic guidance (never a 5xx to the user).
// ------------------------------------------------------------------

import { getAiConfig } from "./config";
import { OpenAICompatibleProvider } from "./providers/openai";
import { AiProviderError } from "./types";
import type { AiChatMessage } from "./types";

const DISCLAIMER =
  "This is general wellness information, not medical advice. Please discuss your personal health with a qualified doctor.";

const SYSTEM_PROMPT =
  "You are CareLink's wellness guidance assistant. You give ONLY general health-habit, " +
  "lifestyle, and wellness information for education. You do NOT diagnose any condition, " +
  "do NOT prescribe or suggest medication doses, and do NOT claim to be a doctor. If the " +
  "user describes symptoms, pain, a medical condition, or an emergency, briefly tell them " +
  "to consult a qualified doctor or the local emergency number, and keep your general tip " +
  "generic. Always respond in the language the user requests. Keep answers concise (under " +
  "160 words), clear, and safe. Do not invent or fabricate the user's personal medical data.";

export interface WellnessResult {
  reply: string;
  disclaimer: string;
  mock: boolean;
  provider?: string;
  model?: string;
}

class WellnessGateway {
  private primary: OpenAICompatibleProvider | null;
  private fallback: OpenAICompatibleProvider | null;
  private mock: boolean;

  constructor(env = process.env) {
    const cfg = getAiConfig(env);
    this.mock = cfg.mock;
    this.primary = cfg.primary ? new OpenAICompatibleProvider("primary", cfg.primary) : null;
    this.fallback = cfg.fallback ? new OpenAICompatibleProvider("fallback", cfg.fallback) : null;
  }

  /**
   * Produce a wellness reply. Never throws for user input; on provider
   * failure or missing config it returns safe generic guidance.
   */
  async answer(question: string, language: string, context?: string): Promise<WellnessResult> {
    const lang = language || "en";
    const sanitized = question.replace(/\s+/g, " ").trim().slice(0, 2000);
    let user = `Language code: ${lang}.\n`;
    if (context) user += `General context: ${context.trim().slice(0, 2000)}\n`;
    user += `Question: ${sanitized}`;

    if (this.mock || !this.primary?.isConfigured()) {
      return this.mockReply(lang);
    }

    const messages: AiChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ];

    const provider = this.primary;
    try {
      const result = await provider.complete(messages);
      return { reply: result.text, disclaimer: DISCLAIMER, mock: false, provider: provider.key };
    } catch {
      if (this.fallback?.isConfigured()) {
        try {
          const result = await this.fallback.complete(messages);
          return { reply: result.text, disclaimer: DISCLAIMER, mock: false, provider: this.fallback.key };
        } catch {
          return this.mockReply(lang);
        }
      }
      return this.mockReply(lang);
    }
  }

  private mockReply(language: string): WellnessResult {
    const fallback: Record<string, string> = {
      hi: "मैं आदतों, पोषण और जीवनशैली के बारे में सामान्य स्वास्थ्य जानकारी में मदद कर सकता हूँ। व्यक्तिगत चिकित्सा सलाह या आपात स्थिति के लिए कृपया किसी डॉक्टर से संपर्क करें।",
      ur: "میں عادات، غذائیت اور طرزِ زندگی کے بارے میں عمومی معلومات میں مدد کر سکتا ہوں۔ ذاتی طبی مشورے یا ہنگامی صورتحال کے لیے براہ کرم کسی ڈاکٹر سے رجوع کریں۔",
    };
    const text =
      fallback[language] ??
      "I can help with general wellness information on habits, nutrition and lifestyle. " +
        "For personal medical advice or if this is an emergency, please contact a qualified doctor.";
    return { reply: text, disclaimer: DISCLAIMER, mock: true, provider: "mock", model: "mock" };
  }
}

let instance: WellnessGateway | null = null;
export function getWellnessGateway(): WellnessGateway {
  if (!instance) instance = new WellnessGateway();
  return instance;
}

export { AiProviderError };