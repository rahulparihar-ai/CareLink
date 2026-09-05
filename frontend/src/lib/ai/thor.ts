// ------------------------------------------------------------------
// CARELINK AI - Thor Guide Gateway (server-only)
//
// THOR is the animated AI guide companion of the app. He appears as a
// Stormbreaker-wielding boy and walks with the user across every page,
// explaining where they are, guiding them step-by-step, and answering
// free-form instructions with full AI chat.
//
// This gateway is server-only: it reuses the AI config and the
// OpenAI-compatible provider (OpenRouter works out of the box) and never
// exposes secrets to the browser. If the provider is unavailable, missing,
// or in mock mode, it returns safe Thor-theatred guidance (never a 5xx).
//
// SAFETY: Thor is a GUIDE, not a clinician. He never diagnoses, prescribes,
// or fabricates the user's health data. Every reply keeps care boundaries.
// ------------------------------------------------------------------

import { getAiConfig } from "./config";
import { OpenAICompatibleProvider } from "./providers/openai";
import type { AiChatMessage } from "./types";

export interface ThorChatResult {
  reply: string;
  mock: boolean;
  provider?: string;
  model?: string;
}

function buildSystemPrompt(page: string, pageLabel: string, language: string): string {
  return [
    "You are THOR, God of Thunder, reborn as the animated AI guide of CareLink - a digital healthcare " +
      "companion app. You wield Stormbreaker, your legendary axe-hammer, and you speak with Asgardian " +
      "charm: bold, warm, heroic, occasionally theatrical - but always clear, helpful and trustworthy.",
    "",
    "The user is navigating the CareLink app and is currently standing with you on this page:",
    `- Page code: "${page}"`,
    `- Page description: ${pageLabel || "the current CareLink screen"}`,
    "",
    "YOUR DUTIES:",
    "1. Explain THIS page properly - not just its name. Tell the user what this page does, what they " +
      "can do on it, and how to use it step by step.",
    "2. Guide the user fully. If they ask 'where am I?', say exactly which page they are on and what it offers.",
    "3. If the user gives an instruction (book an appointment, add a medication, change language, set a " +
      "PIN, find their reports, open settings, etc.), explain EXACTLY how to do it in CareLink - which " +
      "tab, which button, which tap.",
    "4. Answer conversationally and warmly, like Thor of Asgard who genuinely cares for this mortal.",
    "5. You respond to your OWN name: whenever the user speaks 'Thor', 'thore bhai', 'Bhai Thor' or calls " +
      "you by name, answer them directly and proudly in character as Thor himself.",
    "6. End your guidance with a brief friendly offer of help, like 'How can I help you today?' in the " +
      "user's language.",
    "",
    "RULES:",
    "- Respond in the user's app language (language code: " + language + "). Use that language fluently.",
    "- Keep replies concise and structured. Use short bullet points when a sequence of steps helps.",
    "- Hard cap around 200 words per reply.",
    "- NEVER invent, fabricate, or guess the user's personal health data, records, or numbers.",
    "- SAFETY: You are a guide, not a doctor. NEVER diagnose, prescribe medication, give doses, or claim " +
      "to be a clinician. If the user describes symptoms or asks medical questions, briefly advise " +
      "consulting a qualified doctor or the local emergency number, then continue guiding the app safely.",
    "",
    "Now respond as Thor to the user's message below.",
  ].join("\n");
}

function buildUserMessage(message: string, page: string, pageLabel: string, language: string): string {
  return [
    `Language code: ${language}`,
    `Current page: ${page}${pageLabel ? ` (${pageLabel})` : ""}`,
    "",
    message,
  ].join("\n");
}

/** Thor-flavoured deterministic fallbacks keyed by language. */
function thorMock(pageLabel: string, language: string): string {
  const first =
    pageLabel && pageLabel.length > 0
      ? pageLabel.slice(0, 120)
      : "this page";

  const fallbacks: Record<string, string> = {
    hi: `मैं थोर हूँ, और हम इस समय "${first}" पेज पर खड़े हैं, वीर! इस पेज पर जो भी करना चाहें - मुझे बताइए और मैं कदम-दर-कदम रास्ता दिखाऊँगा। अपॉइंटमेंट बुक करना हो, दवाई जोड़नी हो या सेटिंग बदलनी हो - बस बताइए। (यह AI मार्गदर्शन है, चिकित्सा सलाह नहीं - स्वास्थ्य संबंधी प्रश्न के लिए कृपया डॉक्टर से मिलें।)`,
    ur: `میں تھور ہوں، اور ہم اس وقت "${first}" والے صفحے پر کھڑے ہیں، بہادر! اس صفحے پر جو بھی کرنا ہے مجھے بتائیں اور میں قدم بہ قدم راستہ دکھاؤں گا۔ اپائنٹمنٹ بک کرنی ہو، دوا شامل کرنی ہو یا سیٹنگز بدلنی ہوں - بس بتائیں۔ (یہ AI رہنمائی ہے، طبی مشورہ نہیں - صحت کے سوال کے لیے براہِ کرم ڈاکٹر سے ملیں۔)`,
  };

  return (
    fallbacks[language] ??
    `I am Thor, and by Stormbreaker we stand upon the page of "${first}"! Whatever you wish to do here - book an appointment, add a medicine, change a setting - just tell me and I will guide you step by step. (This is AI guidance, not medical advice. For health concerns, please consult a qualified doctor.)`
  );
}

class ThorGateway {
  private primary: OpenAICompatibleProvider | null;
  private fallback: OpenAICompatibleProvider | null;
  private mock: boolean;

  constructor(env = process.env) {
    const cfg = getAiConfig(env);
    this.mock = cfg.mock;
    this.primary = cfg.primary ? new OpenAICompatibleProvider("primary", cfg.primary) : null;
    this.fallback = cfg.fallback ? new OpenAICompatibleProvider("fallback", cfg.fallback) : null;
  }

  /** Produce a Thor reply. Never throws for user input. */
  async chat(opts: {
    message: string;
    language: string;
    page: string;
    pageLabel?: string;
  }): Promise<ThorChatResult> {
    const language = opts.language || "en";
    const page = (opts.page || "UNKNOWN").replace(/\s+/g, "_").slice(0, 60);
    const pageLabel = (opts.pageLabel || "").replace(/\s+/g, " ").trim().slice(0, 2000);
    const message = opts.message.replace(/\s+/g, " ").trim().slice(0, 2000);

    if (!message) {
      return { reply: thorMock(pageLabel, language), mock: true, provider: "mock", model: "mock" };
    }

    if (this.mock || !this.primary?.isConfigured()) {
      return { reply: thorMock(pageLabel, language), mock: true, provider: "mock", model: "mock" };
    }

    const messages: AiChatMessage[] = [
      { role: "system", content: buildSystemPrompt(page, pageLabel, language) },
      { role: "user", content: buildUserMessage(message, page, pageLabel, language) },
    ];

    const provider = this.primary;
    try {
      const result = await provider.complete(messages);
      return { reply: result.text, mock: false, provider: provider.key, model: provider.key };
    } catch {
      if (this.fallback?.isConfigured()) {
        try {
          const result = await this.fallback.complete(messages);
          return { reply: result.text, mock: false, provider: this.fallback.key, model: this.fallback.key };
        } catch {
          return { reply: thorMock(pageLabel, language), mock: true, provider: "mock", model: "mock" };
        }
      }
      return { reply: thorMock(pageLabel, language), mock: true, provider: "mock", model: "mock" };
    }
  }
}

let instance: ThorGateway | null = null;
export function getThorGateway(): ThorGateway {
  if (!instance) instance = new ThorGateway();
  return instance;
}