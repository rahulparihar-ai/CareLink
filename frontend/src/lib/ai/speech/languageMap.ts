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
  const voices =
    typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  if (!voices.length) return null;

  // 1) Exact India-locale voice first (e.g. hi-IN, en-IN, bn-IN). These are
  //    the genuinely Indian-sounding voices preferred across all 13 locales.
  const exactIndia = voices.find((v) => v.lang.toLowerCase() === bcp47);
  if (exactIndia) return exactIndia;

  // 2) A voice for the same script/language with an -IN suffix on its lang tag.
  const base = bcp47.split("-")[0];
  const anyIndia = voices.find((v) => {
    const tag = v.lang.toLowerCase();
    return tag.startsWith(base) && tag.endsWith("in");
  });
  if (anyIndia) return anyIndia;

  // 3) Any Indian voice with the same language base.
  const baseIndia = voices.find(
    (v) => v.lang.toLowerCase().startsWith(base) && v.lang.toLowerCase().includes("-in")
  );
  if (baseIndia) return baseIndia;

  // 4) Fall back to any voice for the language base.
  return voices.find((v) => v.lang.toLowerCase().startsWith(base)) ?? null;
}