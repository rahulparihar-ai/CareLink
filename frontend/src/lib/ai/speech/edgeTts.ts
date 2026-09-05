import crypto from "node:crypto";
import WebSocket, { RawData } from "ws";

// CareLink Thor TTS - Microsoft Edge neural voices (free, no API key).
// Edge's Read-Aloud WebSocket protocol with Sec-MS-GEC auth. Yields the mp3
// bytes from a neural voice that actually sounds like a guiding hero - male
// for English/Hindi, and natural for every other language the app supports.

const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
const SEC_MS_GEC_VERSION = "1-143.0.3650.75";
const WSS_URL =
  "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";

// Thor should always sound like a man. Map the app language to a MALE neural
// voice; unknown/other languages fall back to a neutral English male.
const MALE_VOICES: Record<string, string> = {
  en: "en-US-GuyNeural",
  hi: "hi-IN-MadhurNeural",
  ur: "ur-PK-SalarNeural",
  bn: "bn-IN-BashkarNeural",
  ta: "ta-IN-ValluvarNeural",
  te: "te-IN-MohanNeural",
  mr: "mr-IN-ManoharNeural",
  gu: "gu-IN-NiranjanNeural",
  kn: "kn-IN-GaganNeural",
  ml: "ml-IN-MidhunNeural",
  pa: "pa-IN-ByomNeural",
  or: "or-IN-SubhasaNeural",
  as: "as-IN-BituponNeural",
};

function generateSecMsGec(): string {
  const ticks = Math.floor(Date.now() / 1000) + 11644473600;
  const rounded = ticks - (ticks % 300);
  const windowsTicks = rounded * 10_000_000;
  return crypto
    .createHash("sha256")
    .update(`${windowsTicks}${TRUSTED_CLIENT_TOKEN}`, "ascii")
    .digest("hex")
    .toUpperCase();
}

function parseHeaders(buf: Buffer): { headers: string; data: Buffer } {
  const headerLength = buf.readUInt16BE(0);
  return {
    headers: buf.toString("utf8", 2, 2 + headerLength),
    data: buf.subarray(2 + headerLength),
  };
}

function pathOf(headers: string): string | null {
  const m = headers.match(/Path:([^\r\n]+)/);
  return m ? m[1] : null;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Synthesize `text` with one of Microsoft's free neural voices and return the
 * complete mp3 buffer. `language` is an app language code like "en" or "hi".
 */
export async function synthesizeSpeech(text: string, language: string): Promise<{ audio: Buffer; voice: string }> {
  const voice = MALE_VOICES[language] ?? "en-US-GuyNeural";
  const connectionId = crypto.randomUUID();
  const url =
    WSS_URL +
    "?TrustedClientToken=" + TRUSTED_CLIENT_TOKEN +
    "&Sec-MS-GEC=" + generateSecMsGec() +
    "&Sec-MS-GEC-Version=" + SEC_MS_GEC_VERSION +
    "&ConnectionId=" + connectionId;

  const headers = {
    "Pragma": "no-cache",
    "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0",
    "Cookie": "muid=" + crypto.randomBytes(16).toString("hex").toUpperCase() + ";",
  };

  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let settled = false;

    const settle = (err?: unknown) => {
      if (settled) return;
      settled = true;
      if (err) reject(err as Error);
      else resolve({ audio: Buffer.concat(chunks), voice });
    };

    const timeout = setTimeout(() => settle(new Error("tts-timeout")), 25_000);

    const conn = new WebSocket(url, { headers, perMessageDeflate: true });

    conn.on("open", () => {
      conn.send(
        "Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n" +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: {
                    sentenceBoundaryEnabled: "false",
                    wordBoundaryEnabled: "true",
                  },
                  outputFormat: "audio-24khz-48kbitrate-mono-mp3",
                },
              },
            },
          })
      );

      const req = crypto.randomUUID();
      const ts = new Date().toUTCString();
      const lang = voice.split("-").slice(0, 2).join("-");
      const ssml =
        "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='" +
        lang +
        "'>" +
        "<voice name='" +
        voice +
        "'>" +
        "<prosody pitch='+0Hz' rate='-2%' volume='+0%'>" +
        escapeXml(text) +
        "</prosody>" +
        "</voice></speak>";
      conn.send(
        "X-RequestId:" + req +
        "\r\nContent-Type:application/ssml+xml" +
        "\r\nX-Timestamp:" + ts +
        "\r\nPath:ssml\r\n\r\n" + ssml
      );
    });

    conn.on("message", (data: RawData) => {
      if (Array.isArray(data)) data = Buffer.concat(data);
      if (data instanceof ArrayBuffer) data = Buffer.from(data);
      // Mid-synthesis, text frames may carry a final "turn.end" header.
      const buf: Buffer = data as Buffer;
      const { headers: hs, data: audio } = parseHeaders(buf);
      const path = pathOf(hs);
      if (path === "audio") {
        if (audio.length) chunks.push(Buffer.from(audio));
      } else if (path === "turn.end") {
        clearTimeout(timeout);
        conn.close();
        settle();
      }
    });

    conn.on("error", (e: Error) => {
      clearTimeout(timeout);
      settle(e);
    });

    conn.on("close", () => {
      clearTimeout(timeout);
      settle();
    });
  });
}

/** Normal app language code (en/hi/...) to a lowercase base code. */
export function ttsLanguageCode(language: string): string {
  const code = (language || "en").toLowerCase().split("-")[0];
  return MALE_VOICES[code] ? code : "en";
}