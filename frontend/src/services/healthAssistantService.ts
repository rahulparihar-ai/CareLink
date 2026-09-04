// ------------------------------------------------------------------
// CARELINK - Health Assistant Service
// Health guidance and nutrition are served by the server-side AI wellness
// gateway (OpenRouter-capable). The browser only ever receives the reply text
// and a disclaimer; API keys never reach the client bundle.
// ------------------------------------------------------------------

export interface GuidanceResponse {
  title: string;
  points: string[];
  disclaimer: string;
  mock?: boolean;
  provider?: string;
}

function splitPoints(text: string | undefined | null): string[] {
  if (!text || !text.trim()) return [];
  return text
    .split(/\n+|-|\*|•/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 5);
}

async function post(path: string, payload: Record<string, unknown>): Promise<GuidanceResponse | null> {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; reply?: string; disclaimer?: string; mock?: boolean; provider?: string };
    if (!json.success) return null;
    return {
      title: "Guidance",
      points: splitPoints(json.reply),
      disclaimer: json.disclaimer ?? "This is general information, not medical advice.",
      mock: json.mock,
      provider: json.provider,
    };
  } catch {
    return null;
  }
}

const fallbackText = {
  title: "Guidance is temporarily unavailable",
  points: [
    "Please try again shortly, or talk to your doctor for personal guidance.",
  ],
  disclaimer: "This is general information, not medical advice.",
};

export async function getGuidance(topic: string): Promise<GuidanceResponse> {
  const data = await post("/api/ai/guidance", { topic, language: "en" });
  if (data) {
    data.title = topic.includes("sleep")
      ? "Habits that may support better sleep"
      : topic.includes("nutrition")
        ? "Healthy eating basics"
        : topic.includes("routine")
          ? "General daily routine guidance"
          : "Guidance";
    return data;
  }
  return fallbackText;
}

export async function getNutritionGuidance(): Promise<GuidanceResponse> {
  const data = await post("/api/ai/nutrition", { question: "healthy eating principles", language: "en" });
  if (data) {
    data.title = "General healthy eating principles";
    return data;
  }
  return fallbackText;
}