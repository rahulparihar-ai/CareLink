"use client";

export interface ThorChatResponse {
  success: boolean;
  reply: string;
  mock: boolean;
}

/**
 * Ask the Thor AI guide a question / instruction. Uses the server route so
 * provider secrets stay server-side. Returns null on transport failure so the
 * UI can fall back to a friendly line.
 */
export async function askThor(
  message: string,
  language: string,
  pageLabel: string,
  page?: string
): Promise<ThorChatResponse | null> {
  try {
    const res = await fetch("/api/ai/thor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, language, page, pageLabel }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<ThorChatResponse>;
    if (!data.success || typeof data.reply !== "string") return null;
    return { success: true, reply: data.reply, mock: Boolean(data.mock) };
  } catch {
    return null;
  }
}