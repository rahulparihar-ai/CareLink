// ------------------------------------------------------------------
// CARELINK AI - Speech Language Mapping
// Maps the 13 CareLink language codes to BCP-47 tags used by the Web Speech
// API (SpeechRecognition lang, speechSynthesis voices). India locale (-IN)
// is used where available; Urdu is RTL and uses ur-IN.
// ------------------------------------------------------------------

import type { LanguageCode } from "@/types";

export const SPEECH_LANG: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ur: "ur-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  or: "or-IN",
  as: "as-IN",
};

export function langToBcp47(language: LanguageCode): string {
  return SPEECH_LANG[language] ?? "en-IN";
}

/** Attempt to find a speechSynthesis voice matching a language tag. */
export function findVoice(language: LanguageCode): SpeechSynthesisVoice | null {
  const bcp47 = langToBcp47(language).toLowerCase();
  const voices = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  if (!voices.length) return null;
  const exact = voices.find((v) => v.lang.toLowerCase() === bcp47);
  if (exact) return exact;
  const langBase = bcp47.split("-")[0];
  return voices.find((v) => v.lang.toLowerCase().startsWith(langBase)) ?? null;
}