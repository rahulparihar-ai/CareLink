// ------------------------------------------------------------------
// CARELINK AI - Client-side chat client
// The ONLY way the browser talks to the AI. It posts to the server route
// /api/ai/chat. No provider credentials, names, or fallback rules ever
// reach this file or the browser bundle.
// ------------------------------------------------------------------

import type { LanguageCode } from "@/types";
import type { AiAssistantAction, AiChatResponse, AiChatTurn } from "./types";

export interface ClientAiError {
  kind: "invalid" | "provider" | "timeout" | "rate_limit" | "quota" | "network";
}

export async function chatWithAssistant(opts: {
  message: string;
  language: LanguageCode;
  mode?: "onboarding" | "help";
  context?: AiChatTurn[];
  signal?: AbortSignal;
}): Promise<AiChatResponse> {
  let res: Response;
  try {
    res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: opts.message,
        language: opts.language,
        mode: opts.mode ?? "onboarding",
        context: opts.context,
      }),
      signal: opts.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    throw { kind: aborted ? "timeout" : "network" } as ClientAiError;
  }

  let data: AiChatResponse;
  try {
    data = (await res.json()) as AiChatResponse;
  } catch {
    throw { kind: "provider" } as ClientAiError;
  }

  if (data.success === false) {
    throw { kind: data.error ?? "provider" } as ClientAiError;
  }

  // Defence-in-depth: drop any action that is not on the allowlist.
  if (data.action !== null && data.action !== undefined && !isActionKnown(data.action)) {
    data.action = null;
  }

  return data;
}

function isActionKnown(a: AiAssistantAction): boolean {
  return [
    "NONE", "OPEN_LANGUAGE_SELECTION", "OPEN_LOGIN", "OPEN_PATIENT_REGISTRATION",
    "OPEN_DOCTOR_REGISTRATION", "OPEN_HELP", "OPEN_ABHA", "OPEN_CONSENT",
    "OPEN_DOCUMENT_CENTER", "START_AI_HISTORY", "OPEN_PATIENT_DASHBOARD",
    "OPEN_DOCTOR_DASHBOARD", "GO_BACK",
  ].includes(a);
}