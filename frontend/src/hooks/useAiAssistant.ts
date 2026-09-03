"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppStore, type View } from "@/store";
import { chatWithAssistant, type ClientAiError } from "@/lib/ai/client";
import { speechToTextProvider } from "@/lib/ai/speech/speechToText";
import { textToSpeechProvider } from "@/lib/ai/speech/textToSpeech";
import { actionToView } from "@/lib/ai/actions";
import type { AiChatTurn, LanguageCode, SpeechToTextResult } from "@/lib/ai";

export interface AssistantMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  speaking?: boolean;
}

let idSeed = 0;
function nextId() {
  idSeed += 1;
  return `msg-${Date.now()}-${idSeed}`;
}

// Keep only recent turns so the server context stays small and cost bounded.
const MAX_CONTEXT_TURNS = 12;

export function useAiAssistant() {
  const language = useAppStore((s) => s.language) as LanguageCode;
  const role = useAppStore((s) => s.role);
  const setView = useAppStore((s) => s.setView);
  const setHasSeenStartupAssistant = useAppStore((s) => s.setHasSeenStartupAssistant);

  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sttAvailable] = useState(() => speechToTextProvider.available());
  const [ttsAvailable] = useState(() => textToSpeechProvider.available());

  // Keep the latest values for effects without re-subscribing.
  const stateRef = useRef({ language, role, muted });
  useEffect(() => {
    stateRef.current = { language, role, muted };
  }, [language, role, muted]);

  const stopListenerRef = useRef<{ stop: () => void } | null>(null);
  const speechOnEndRef = useRef<(() => void) | null>(null);
  const killAutoSpeak = useRef(false);

  const stopSpeech = useCallback(() => {
    killAutoSpeak.current = true;
    textToSpeechProvider.cancel();
    setMessages((ms) => ms.map((m) => ({ ...m, speaking: false })));
  }, []);

  // Stop speech/listening on unmount.
  useEffect(() => {
    return () => {
      stopListenerRef.current?.stop();
      textToSpeechProvider.cancel();
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      const { muted: m } = stateRef.current;
      if (m || !ttsAvailable) return;
      killAutoSpeak.current = false;
      setMessages((ms) => ms.map((msg) => ({ ...msg, speaking: msg.text === text })));
      speechOnEndRef.current = () => {
        setMessages((ms) => ms.map((msg) => ({ ...msg, speaking: false })));
      };
      textToSpeechProvider.speak(text, stateRef.current.language, speechOnEndRef.current);
    },
    [ttsAvailable]
  );

  const handleError = useCallback((err: ClientAiError) => {
    // Surface only a safe, generic message to the user.
    const map: Partial<Record<ClientAiError["kind"], string>> = {
      timeout: "The assistant took too long to respond. Please try again.",
      network: "You are offline or the assistant is unreachable. Please check your connection.",
      rate_limit: "The assistant is busy right now. Please try again in a moment.",
      quota: "The assistant is temporarily unavailable. Please try again later.",
      invalid: "The assistant could not process this. Please try again.",
      provider: "The assistant is temporarily unavailable. Please try again later.",
    };
    setError(map[err.kind] ?? "Something went wrong. Please try again.");
  }, []);

  const send = useCallback(
    async (raw?: string) => {
      const text = (raw ?? input).replace(/\s+/g, " ").trim();
      setInput("");
      if (!text || busy) return;

      // Cancel TTS from a previous message.
      stopSpeech();
      setError(null);

      const userMsg: AssistantMessage = { id: nextId(), role: "user", text };
      setMessages((ms) => [...ms, userMsg]);
      setBusy(true);

      const { language: l } = stateRef.current;
      const context: AiChatTurn[] = messages
        .filter((m) => m.text)
        .slice(-MAX_CONTEXT_TURNS)
        .map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));

      try {
        const res = await chatWithAssistant({
          message: text,
          language: l,
          mode: "onboarding",
          context,
        });
        const aiMsg: AssistantMessage = { id: nextId(), role: "ai", text: res.message };
        setMessages((ms) => [...ms, aiMsg]);
        window.setTimeout(() => speak(res.message), 200);

        // Resolve an allowlisted action to an internal view, if any.
        if (res.action && res.action !== "NONE") {
          const target = actionToView(res.action, role as "PATIENT" | "DOCTOR" | null);
          // Startup is pre-login: only navigate to pre-login/auth views.
          // Portal views (patient/doctor home, documents, etc.) would be
          // ignored by the router for a logged-out user, so skip them.
          const PRELOGIN = new Set<View>([
            "LANGUAGE", "LOGIN", "DOCTOR_LOGIN", "REGISTER",
            "DOCTOR_REGISTER", "HELP", "ACCESSIBILITY", "WELCOME",
          ] as View[]);
          if (target && target !== "__BACK__" && PRELOGIN.has(target as View)) {
            window.setTimeout(() => setView(target as View), 1200);
          }
        }
      } catch (err) {
        handleError(err as ClientAiError);
      } finally {
        setBusy(false);
      }
    },
    [input, busy, messages, stopSpeech, speak, role, setView, handleError]
  );

  // ---- Speech-to-text ----
  const toggleListening = useCallback(() => {
    if (listening) {
      stopListenerRef.current?.stop();
      setListening(false);
      return;
    }
    setError(null);
    setListening(true);
    stopListenerRef.current = speechToTextProvider.start({
      language: stateRef.current.language,
      onResult: (r: SpeechToTextResult) => {
        setInput(r.transcript);
        if (r.isFinal) {
          setListening(false);
          stopListenerRef.current = null;
          void send(r.transcript);
        }
      },
      onError: (_kind, message) => {
        setListening(false);
        stopListenerRef.current = null;
        setError(message);
      },
      onEnd: () => {
        setListening(false);
        stopListenerRef.current = null;
      },
    });
  }, [listening, send]);

  // ---- Completion / done ----
  const finish = useCallback(() => {
    stopSpeech();
    setHasSeenStartupAssistant(true);
    setView("WELCOME");
  }, [setHasSeenStartupAssistant, setView, stopSpeech]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      if (next) stopSpeech();
      return next;
    });
  }, [stopSpeech]);

  const retry = useCallback(() => {
    setError(null);
  }, []);

  return {
    messages,
    input,
    setInput,
    busy,
    listening,
    muted,
    error,
    sttAvailable,
    ttsAvailable,
    send,
    toggleListening,
    toggleMute,
    finish,
    retry,
  };
}