import { NextRequest, NextResponse } from "next/server";
import { AiGateway } from "@/lib/ai/gateway";
import { getAiConfig } from "@/lib/ai/config";
import { isAllowedAction } from "@/lib/ai/actions";
import type { AiChatRequest, AiAssistantAction } from "@/lib/ai/types";
import type { LanguageCode } from "@/types";

/** Single shared gateway instance (created lazily; cheap). */
let gateway: AiGateway | null = null;
function getGateway(): AiGateway {
  if (!gateway) gateway = new AiGateway(getAiConfig());
  return gateway;
}

// The server owns the prompt and never trusts client system instructions.
const ALLOWED_MODES = new Set(["onboarding", "help"]);
const MAX_MESSAGE = 2000;
const MAX_CONTEXT = 12;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "", language: "en", action: null, actionParams: {}, error: "invalid" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return unprocessable();
  }
  const b = body as Record<string, unknown>;

  // Validate message
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message) return unprocessable();
  if (message.length > MAX_MESSAGE) return unprocessable();

  // Validate language
  const language = (typeof b.language === "string" ? b.language : "en") as LanguageCode;

  // Validate mode (only onboarding/help are accepted)
  const mode = typeof b.mode === "string" && ALLOWED_MODES.has(b.mode) ? (b.mode as "onboarding" | "help") : "onboarding";

  // Validate context: array of {role, content} only, capped length
  let context: AiChatRequest["context"];
  if (Array.isArray(b.context)) {
    context = b.context
      .slice(0, MAX_CONTEXT)
      .filter((t): t is { role: "user" | "assistant"; content: string } => {
        if (typeof t !== "object" || t === null) return false;
        const o = t as Record<string, unknown>;
        return (
          (o.role === "user" || o.role === "assistant") &&
          typeof o.content === "string" &&
          o.content.length <= MAX_MESSAGE
        );
      });
  }

  const request: AiChatRequest = { message, language, mode, context };

  const cfg = getAiConfig();
  const gw = getGateway();

  // Not configured AND not mock -> tell the client (safe, generic) to use mock.
  if (!cfg.mock && !cfg.primary?.apiKey) {
    return NextResponse.json({ success: false, message: "", language, action: null, actionParams: {}, error: "provider" }, { status: 503 });
  }

  const result = await gw.chat(request);

  // Defence-in-depth: never let an invalid action reach the client.
  let action: AiAssistantAction | null = result.action;
  if (action !== null && !isAllowedAction(action)) action = null;

  return NextResponse.json(
    {
      success: result.success,
      message: result.message,
      language: result.language,
      action,
      actionParams: result.actionParams,
      ...(result.mock !== undefined ? { mock: result.mock } : {}),
      ...(result.error ? { error: result.error } : {}),
    },
    { status: result.success ? 200 : 503 }
  );
}

function unprocessable() {
  return NextResponse.json({ success: false, message: "", language: "en", action: null, actionParams: {}, error: "invalid" }, { status: 400 });
}

export async function GET() {
  return NextResponse.json({ name: "CareLink AI", ok: true }, { status: 200 });
}