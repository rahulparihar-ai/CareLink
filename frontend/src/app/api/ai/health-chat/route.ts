import { NextRequest, NextResponse } from "next/server";
import { getWellnessGateway } from "@/lib/ai/wellness";

/** AI health assistance: general health chat, server-side only. */
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
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message) return NextResponse.json({ success: false, error: "invalid" }, { status: 400 });
  const language = typeof b.language === "string" ? b.language : "en";
  const context =
    typeof b.context === "object" && b.context !== null
      ? JSON.stringify((b.context as Record<string, unknown>).general ?? "")
      : "";

  const gw = getWellnessGateway();
  const result = await gw.answer(message, language, context);
  return NextResponse.json({ success: true, ...result });
}

export function GET() {
  return NextResponse.json({ name: "CareLink AI Health Chat", ok: true }, { status: 200 });
}