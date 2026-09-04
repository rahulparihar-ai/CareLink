import { NextRequest, NextResponse } from "next/server";
import { getWellnessGateway } from "@/lib/ai/wellness";

/** Ask AI about nutrition: general dietary guidance, server-side only. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "invalid" }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ success: false, error: "invalid" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const question =
    typeof b.question === "string" && b.question.trim()
      ? b.question
      : "healthy eating guidance";
  const pref = Array.isArray(b.preferences)
    ? (b.preferences as unknown[]).filter((p): p is string => typeof p === "string").join(", ")
    : "";
  const language = typeof b.language === "string" ? b.language : "en";
  const prompt = pref ? `${question} (dietary preferences: ${pref})` : question;

  const gw = getWellnessGateway();
  const result = await gw.answer(`Nutrition: ${prompt}`, language);
  return NextResponse.json({ success: true, ...result });
}

export function GET() {
  return NextResponse.json({ name: "CareLink AI Nutrition", ok: true }, { status: 200 });
}