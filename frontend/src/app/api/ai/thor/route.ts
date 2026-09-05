import { NextRequest, NextResponse } from "next/server";
import { getThorGateway } from "@/lib/ai/thor";

const MAX_MESSAGE = 2000;

const SUPPORTED_LANGUAGES = new Set([
  "en", "hi", "ur", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as",
]);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, reply: "", mock: true, error: "invalid" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ success: false, reply: "", mock: true, error: "invalid" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const rawMessage = typeof b.message === "string" ? b.message.trim() : "";
  if (!rawMessage || rawMessage.length > MAX_MESSAGE) {
    return NextResponse.json({ success: false, reply: "", mock: true, error: "invalid" }, { status: 400 });
  }

  const language = typeof b.language === "string" && SUPPORTED_LANGUAGES.has(b.language) ? b.language : "en";
  const page = typeof b.page === "string" && b.page ? b.page.slice(0, 60) : "";
  const pageLabel = typeof b.pageLabel === "string" ? b.pageLabel.slice(0, 2000) : "";

  const gateway = getThorGateway();
  const result = await gateway.chat({ message: rawMessage, language, page, pageLabel });

  return NextResponse.json(
    {
      success: true,
      reply: result.reply,
      mock: result.mock,
      ...(result.provider ? { provider: result.provider } : {}),
    },
    { status: 200 }
  );
}

export async function GET() {
  return NextResponse.json({ name: "CareLink Thor AI Guide", ok: true }, { status: 200 });
}