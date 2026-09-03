// ------------------------------------------------------------------
// CARELINK AI - OpenAI-compatible provider adapter
//
// A thin REST adapter for any OpenAI-compatible chat completions endpoint
// (OpenAI, OpenRouter, and compatible gateways). Using fetch instead of an
// SDK keeps the dependency surface minimal and the adapter provider-agnostic.
//
// The system prompt is owned by the gateway (see gateway.ts) and passed in
// as part of the messages array - this adapter is purely a transport.
//
// Server-only.
// ------------------------------------------------------------------

import { AiProviderError } from "../types";
import type { AiChatMessage, AiProvider, AiProviderResult } from "../types";
import type { AiProviderConfig } from "../config";

export class OpenAICompatibleProvider implements AiProvider {
  readonly key: string;
  private config: AiProviderConfig;

  constructor(key: string, config: AiProviderConfig) {
    this.key = key;
    this.config = config;
  }

  isConfigured(): boolean {
    return Boolean(this.config.apiKey && this.config.model);
  }

  async complete(messages: AiChatMessage[]): Promise<AiProviderResult> {
    const { baseUrl, model, apiKey } = this.config;
    const endpoint = `${baseUrl}/chat/completions`;
    const timeoutMs = readTimeout();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 512,
          stream: false,
          messages,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        throw new AiProviderError("unauthorized", `Provider ${this.key} rejected credentials (${res.status}).`);
      }
      if (res.status === 429) {
        throw new AiProviderError("rate_limit", `Provider ${this.key} rate limited (429).`);
      }
      if (res.status === 402) {
        throw new AiProviderError("quota", `Provider ${this.key} quota exhausted (402).`);
      }
      if (!res.ok) {
        throw new AiProviderError("invalid_response", `Provider ${this.key} returned ${res.status}.`);
      }

      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content?.trim() ?? "";
      if (!text) {
        throw new AiProviderError("invalid_response", `Provider ${this.key} returned an empty message.`);
      }
      return { text, provider: this.key };
    } catch (err) {
      if (err instanceof AiProviderError) throw err;
      if (err instanceof Error && err.name === "AbortError") {
        throw new AiProviderError("timeout", `Provider ${this.key} timed out.`);
      }
      throw new AiProviderError("network", `Network error calling ${this.key}.`);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function readTimeout(): number {
  const v = Number.parseInt(process.env.AI_TIMEOUT_MS ?? "15000", 10);
  return Number.isFinite(v) && v > 0 ? v : 15000;
}