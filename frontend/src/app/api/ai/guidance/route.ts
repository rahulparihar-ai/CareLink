import { NextRequest, NextResponse } from "next/server";
import { getWellnessGateway } from "@/lib/ai/wellness";

const ALLOWED_TOPICS = new Set(["routine", "sleep", "nutrition", "general"]);

/** Health guidance: general wellness/health-habit information, server-side. */
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
  const topic = typeof b.topic === "string" ? b.topic.toLowerCase() : "general";
  const sub = typeof b.sub_topic === "string" ? b.sub_topic : "";
  const language = typeof b.language === "string" ? b.language : "en";
  const safeTopic = ALLOWED_TOPICS.has(topic) ? topic : "general";
  const question = [safeTopic, sub].filter(Boolean).join(", ");

  const gw = getWellnessGateway();
  const result = await gw.answer(question, language);

  return NextResponse.json({ success: true, ...result });
}

export function GET() {
  return NextResponse.json({ name: "CareLink AI Guidance", ok: true }, { status: 200 });
}