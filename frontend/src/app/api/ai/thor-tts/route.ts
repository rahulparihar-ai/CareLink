import { NextRequest, NextResponse } from "next/server";
import { synthesizeSpeech, ttsLanguageCode } from "@/lib/ai/speech/edgeTts";

const MAX_TEXT = 1200;

const SUPPORTED_LANGUAGES = new Set([
  "en", "hi", "ur", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as",
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawText = searchParams.get("text") ?? "";
  const rawLang = searchParams.get("lang") ?? "en";
  const text = rawText.slice(0, MAX_TEXT).trim();
  const language = SUPPORTED_LANGUAGES.has(rawLang) ? rawLang : "en";

  if (!text) {
    return NextResponse.json({ error: "empty" }, { status: 400 });
  }

  try {
    const { audio } = await synthesizeSpeech(text, ttsLanguageCode(language));
    if (!audio.length) {
      return NextResponse.json({ error: "empty-audio" }, { status: 502 });
    }
    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "tts-failed" }, { status: 502 });
  }
}