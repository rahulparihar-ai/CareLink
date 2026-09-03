import { describe, it, expect } from "vitest";
import { AiGateway } from "./gateway";

function mockGateway(): AiGateway {
  return new AiGateway({
    mock: true,
    primary: null,
    fallback: null,
    timeoutMs: 1000,
    maxInputChars: 2000,
  });
}

describe("AiGateway (mock mode)", () => {
  it("routes an intent to patient registration on a 'register patient' phrase", async () => {
    const res = await mockGateway().chat({ message: "I want to register as a patient", language: "en" });
    expect(res.success).toBe(true);
    expect(res.action).toBe("OPEN_PATIENT_REGISTRATION");
    expect(res.message.length).toBeGreaterThan(0);
  });

  it("routes doctor intent", async () => {
    const res = await mockGateway().chat({ message: "How does a doctor login?", language: "en" });
    expect(res.action).toBe("OPEN_DOCTOR_REGISTRATION");
  });

  it("routes language intent", async () => {
    const res = await mockGateway().chat({ message: "change language", language: "en" });
    expect(res.action).toBe("OPEN_LANGUAGE_SELECTION");
  });

  it("returns NONE (null action) for unknown input", async () => {
    const res = await mockGateway().chat({ message: "tell me a joke", language: "en" });
    expect(res.success).toBe(true);
    expect(res.action).toBeNull();
  });

  it("answers a health question with safe offline guidance and a disclaimer", async () => {
    const res = await mockGateway().chat({ message: "What should I do for fever?", language: "en" });
    expect(res.success).toBe(true);
    expect(res.action).toBeNull();
    expect(res.message.length).toBeGreaterThan(20);
    expect(/doctor|consult/i.test(res.message)).toBe(true);
  });

  it("answers health questions in the selected language", async () => {
    const en = await mockGateway().chat({ message: "I have a headache", language: "en" });
    const hi = await mockGateway().chat({ message: "मुझे बुखार है", language: "hi" });
    expect(en.success).toBe(true);
    expect(hi.success).toBe(true);
    expect(hi.language).toBe("hi");
    expect(hi.message.length).toBeGreaterThan(20);
  });

  it("respects the selected language defaulting to English", async () => {
    const en = await mockGateway().chat({ message: "hi", language: "en" });
    const hi = await mockGateway().chat({ message: "hi", language: "hi" });
    expect(en.language).toBe("en");
    expect(hi.language).toBe("hi");
    expect(hi.message).not.toBe(en.message);
  });

  it("rejects empty input defensively", async () => {
    const res = await mockGateway().chat({ message: "   ", language: "en" });
    expect(res.success).toBe(false);
    expect(res.error).toBe("invalid");
  });

  it("caps and sanitizes oversized input without throwing", async () => {
    const res = await mockGateway().chat({ message: "register patient ".repeat(5000), language: "en" });
    expect(res.success).toBe(true);
  });
});