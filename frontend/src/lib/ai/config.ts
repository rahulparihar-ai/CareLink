// ------------------------------------------------------------------
// CARELINK AI - Server-only Configuration
//
// IMPORTANT: This module reads server-side secrets. It must only ever be
// imported from server code (App Router route handlers / server modules).
// It must NEVER be imported from client components, otherwise `process.env`
// secrets could be inlined into the browser bundle.
//
// The client never knows which provider is configured, which API keys exist,
// or what fallback rules are active.
// ------------------------------------------------------------------

export type AiProviderKind = "openai" | "openrouter" | "gemini";

export interface AiProviderConfig {
  kind: AiProviderKind;
  apiKey: string;
  /** REST base URL including the path prefix (no trailing slash). */
  baseUrl: string;
  model: string;
}

export interface AiConfig {
  mock: boolean;
  primary: AiProviderConfig | null;
  /** Optional secondary/fallback provider for legitimate failover. */
  fallback: AiProviderConfig | null;
  timeoutMs: number;
  maxInputChars: number;
}

const str = (v: string | undefined): string => (v ?? "").trim();

/**
 * Resolve an OpenAI-compatible base URL for a provider kind.
 * Users may override per-provider base URLs via env. Defaults favour
 * real production endpoints / common gateways using the exact env shape:
 *   AI_PROVIDER, AI_API_KEY, AI_MODEL, AI_BASE_URL
 *   AI_FALLBACK_PROVIDER, AI_FALLBACK_API_KEY, AI_FALLBACK_MODEL, AI_FALLBACK_BASE_URL
 */
function resolveBaseUrl(kind: AiProviderKind, explicit: string): string {
  if (explicit) return explicit.replace(/\/+$/, "");
  switch (kind) {
    case "openai":
      return "https://api.openai.com/v1";
    case "openrouter":
      return "https://openrouter.ai/api/v1";
    case "gemini":
      return "https://generativelanguage.googleapis.com/v1";
    default:
      return "https://api.openai.com/v1";
  }
}

function buildProvider(
  kind: AiProviderKind,
  apiKey: string,
  model: string,
  baseUrl: string
): AiProviderConfig | null {
  if (!apiKey || !model) return null;
  return { kind, apiKey, model, baseUrl: resolveBaseUrl(kind, baseUrl) };
}

/**
 * Parse provider config from server env. Mock mode short-circuits live
 * calls entirely, so no API key is required.
 */
export function getAiConfig(env = process.env): AiConfig {
  const mock = str(env.AI_MOCK_MODE) === "true";
  const primaryKind = (str(env.AI_PROVIDER).toLowerCase() || "openai") as AiProviderKind;
  const fallbackKind = (str(env.AI_FALLBACK_PROVIDER).toLowerCase() || "openai") as AiProviderKind;

  const primary = buildProvider(
    primaryKind,
    str(env.AI_API_KEY),
    str(env.AI_MODEL),
    str(env.AI_BASE_URL)
  );
  const fallback = buildProvider(
    fallbackKind,
    str(env.AI_FALLBACK_API_KEY),
    str(env.AI_FALLBACK_MODEL),
    str(env.AI_FALLBACK_BASE_URL)
  );

  return {
    mock,
    primary,
    fallback,
    timeoutMs: Number.parseInt(str(env.AI_TIMEOUT_MS) || "15000", 10) || 15000,
    maxInputChars: Number.parseInt(str(env.AI_MAX_INPUT_CHARS) || "2000", 10) || 2000,
  };
}