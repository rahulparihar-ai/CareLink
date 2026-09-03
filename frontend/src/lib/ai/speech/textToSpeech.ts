// ------------------------------------------------------------------
// CARELINK AI - Text-to-Speech Provider (browser speechSynthesis)
// Client-only. Provider-abstracted so a cloud TTS service can be swapped in
// later. If speechSynthesis is unavailable, available() returns false and
// the UI offers mute/off states (never crashes).
// ------------------------------------------------------------------

import type { LanguageCode } from "@/types";
import { findVoice, langToBcp47 } from "./languageMap";
import type { TextToSpeechProvider } from "../types";

function synth(): SpeechSynthesis | null {
  return typeof speechSynthesis !== "undefined" ? speechSynthesis : null;
}

export class BrowserTextToSpeechProvider implements TextToSpeechProvider {
  readonly id = "web-speech";

  available(): boolean {
    return synth() !== null;
  }

  speak(text: string, language: LanguageCode, onEnd?: () => void): void {
    const s = synth();
    if (!s || !text) {
      onEnd?.();
      return;
    }
    // Cancel anything currently playing so voices do not overlap.
    s.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voice = findVoice(language);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = langToBcp47(language);
    }
    utterance.rate = 1;
    utterance.pitch = 1;

    // Chrome bug workaround: voices may load asynchronously.
    if (!voice) {
      const trySet = () => {
        const v = findVoice(language);
        if (v) {
          utterance.voice = v;
          utterance.lang = v.lang;
        }
      };
      if (typeof s.getVoices !== "undefined" && s.getVoices().length === 0) {
        s.addEventListener?.("voiceschanged", trySet, { once: true });
      }
    }

    if (onEnd) {
      utterance.onend = () => onEnd();
      utterance.onerror = () => onEnd();
    }
    s.speak(utterance);
  }

  cancel(): void {
    const s = synth();
    if (s) s.cancel();
  }

  isSpeaking(): boolean {
    const s = synth();
    return s ? s.speaking : false;
  }
}

/** Singleton for easy reuse. */
export const textToSpeechProvider: TextToSpeechProvider = new BrowserTextToSpeechProvider();