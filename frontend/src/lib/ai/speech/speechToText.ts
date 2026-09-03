// ------------------------------------------------------------------
// CARELINK AI - Speech-to-Text Provider (browser Web Speech API)
// Client-only. Provider-abstracted so a cloud ASR service can be swapped
// in later without changing the assistant UI.
//
// If SpeechRecognition is unavailable (many desktop browsers / Safari end),
// available() returns false and the assistant falls back to text input.
// ------------------------------------------------------------------

import type { LanguageCode } from "@/types";
import { langToBcp47 } from "./languageMap";
import type { SpeechToTextProvider, SpeechToTextResult } from "../types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type SR = any;

function createRecognition(): SR | null {
  const w = globalThis as SR & {
    SpeechRecognition?: new () => SR;
    webkitSpeechRecognition?: new () => SR;
  };
  const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export class WebSpeechToTextProvider implements SpeechToTextProvider {
  readonly id = "web-speech";

  available(): boolean {
    return createRecognition() !== null;
  }

  start(opts: {
    language: LanguageCode;
    onResult: (r: SpeechToTextResult) => void;
    onError: (kind: string, message: string) => void;
    onEnd: () => void;
  }) {
    const recognition = createRecognition();
    if (!recognition) {
      opts.onError("unsupported", "SpeechRecognition unavailable");
      return { stop: () => {} };
    }

    recognition.lang = langToBcp47(opts.language);
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let stopped = false;
    recognition.onresult = (event: SR) => {
      let transcript = "";
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        isFinal = res.isFinal;
        transcript += res[0]?.transcript ?? "";
      }
      if (transcript) {
        opts.onResult({
          transcript: transcript.trim(),
          language: opts.language,
          isFinal,
        });
      }
    };
    recognition.onerror = (event: SR) => {
      const code: string = event?.error ?? "unknown";
      if (code === "not-allowed" || code === "service-not-allowed") {
        opts.onError("permission-denied", "Microphone permission denied");
      } else if (code === "no-speech") {
        opts.onError("no-speech", "No speech detected");
      } else if (code === "audio-capture") {
        opts.onError("audio-capture", "No microphone available");
      } else {
        opts.onError(code, "Speech recognition error");
      }
    };
    recognition.onend = () => {
      if (!stopped) opts.onEnd();
    };

    try {
      recognition.start();
    } catch {
      opts.onError("start-failed", "Could not start recognition");
    }

    return {
      stop: () => {
        stopped = true;
        try {
          recognition.stop();
        } catch {
          /* already stopped */
        }
      },
    };
  }
}

/** Singleton for easy reuse. */
export const speechToTextProvider: SpeechToTextProvider = new WebSpeechToTextProvider();