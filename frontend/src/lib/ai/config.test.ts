import { describe, it, expect } from "vitest";
import { getAiConfig } from "./config";

function env(overrides: Record<string, string | undefined> = {}) {
  return {
    AI_PROVIDER: "openai",
    AI_API_KEY: "sk-test",
    AI_MODEL: "gpt-4o-mini",
    AI_BASE_URL: "",
    AI_FALLBACK_API_KEY: "",
    AI_FALLBACK_MODEL: "",
    AI_MOCK_MODE: "",
    AI_TIMEOUT_MS: "",
    AI_MAX_INPUT_CHARS: "",
    ...overrides,
  } as unknown as NodeJS.ProcessEnv;
}

describe("getAiConfig", () => {
  it("parses a primary provider from env and defaults the base URL", () => {
    const cfg = getAiConfig(env());
    expect(cfg.mock).toBe(false);
    expect(cfg.primary?.apiKey).toBe("sk-test");
    expect(cfg.primary?.model).toBe("gpt-4o-mini");
    expect(cfg.primary?.baseUrl).toBe("https://api.openai.com/v1");
    expect(cfg.fallback).toBeNull();
  });

  it("honours AI_BASE_URL override and trims trailing slashes", () => {
    const cfg = getAiConfig(env({ AI_BASE_URL: "https://proxy.example.com/v1/" }));
    expect(cfg.primary?.baseUrl).toBe("https://proxy.example.com/v1");
  });

  it("treats missing key/model as disabled (no live provider)", () => {
    const cfg = getAiConfig(env({ AI_API_KEY: "", AI_MODEL: "" }));
    expect(cfg.primary).toBeNull();
    expect(cfg.mock).toBe(false);
  });

  it("turns on mock mode when AI_MOCK_MODE=true", () => {
    const cfg = getAiConfig(env({ AI_MOCK_MODE: "true" }));
    expect(cfg.mock).toBe(true);
  });

  it("parses a fallback provider and timeout/max length", () => {
    const cfg = getAiConfig(
      env({
        AI_FALLBACK_API_KEY: "sk-fb",
        AI_FALLBACK_MODEL: "claude-3-haiku",
        AI_FALLBACK_PROVIDER: "openrouter",
        AI_TIMEOUT_MS: "30000",
        AI_MAX_INPUT_CHARS: "5000",
      })
    );
    expect(cfg.fallback?.apiKey).toBe("sk-fb");
    expect(cfg.fallback?.model).toBe("claude-3-haiku");
    expect(cfg.fallback?.baseUrl).toBe("https://openrouter.ai/api/v1");
    expect(cfg.timeoutMs).toBe(30000);
    expect(cfg.maxInputChars).toBe(5000);
  });

  it("applies sane defaults for empty numeric settings", () => {
    const cfg = getAiConfig(env());
    expect(cfg.timeoutMs).toBe(15000);
    expect(cfg.maxInputChars).toBe(2000);
  });
});