// ------------------------------------------------------------------
// CARELINK - AI Health Assistant Service
// Answers are produced by the server-side AI wellness gateway (OpenRouter-
// capable). The user's stored records are passed as general context so the
// assistant can reference medication/appointment/lab info, but the browser
// never fabricates or exposes raw medical PII through this path.
// ------------------------------------------------------------------

export interface AiReply {
  text: string;
  sources?: { label: string; value: string; sourceType: string; confidence?: number }[];
  mock?: boolean;
  provider?: string;
  disclaimer?: string;
}

export interface AiRecordContext {
  medications: string[];
  appointments: { doctor: string; date: string; time: string }[];
  lastLab: { title: string; date: string; status: string } | null;
  bloodGroup: string;
  allergies: string[];
}

const noRecords = (missing: string) =>
  `I don't have any ${missing} stored in your profile yet. Add it from the app, and I'll be able to answer about it.`;

export async function askAi(query: string, ctx: AiRecordContext): Promise<AiReply> {
  // First try the server-side wellness gateway.
  try {
    const res = await fetch("/api/ai/health-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: query,
        language: "en",
        context: {
          general: [
            ctx.medications.length ? `medications: ${ctx.medications.join(", ")}` : "",
            ctx.appointments.length
              ? `appointments: ${ctx.appointments.map((a) => `${a.doctor} on ${a.date}`).join("; ")}`
              : "",
            ctx.lastLab ? `${ctx.lastLab.title} (${ctx.lastLab.status})` : "",
            ctx.bloodGroup ? `blood group: ${ctx.bloodGroup}` : "",
            ctx.allergies.length ? `allergies: ${ctx.allergies.join(", ")}` : "",
          ]
            .filter(Boolean)
            .join(". "),
        },
      }),
    });
    if (res.ok) {
      const json = (await res.json()) as { success?: boolean; reply?: string; mock?: boolean; provider?: string; disclaimer?: string };
      if (json.success && json.reply) {
        return {
          text: json.reply,
          mock: json.mock,
          provider: json.provider,
          disclaimer: json.disclaimer,
        };
      }
    }
  } catch {
    // fall through to the local, record-aware fallback below
  }
  return localAnswer(query, ctx);
}

/** Local record-aware fallback used when the server is unreachable. */
function localAnswer(query: string, ctx: AiRecordContext): AiReply {
  const q = query.toLowerCase();

  if (q.includes("medication") || q.includes("medicine") || q.includes("take") || q.includes("prescription")) {
    return {
      text: ctx.medications.length
        ? `Currently in your record: ${ctx.medications.join(", ")}.`
        : noRecords("medications"),
      sources: ctx.medications.length
        ? [{ label: "Medication list", value: ctx.medications.join(", "), sourceType: "clinical record" }]
        : undefined,
      mock: true,
    };
  }

  if (q.includes("appointment") || q.includes("last visit") || q.includes("visit")) {
    return {
      text: ctx.appointments.length
        ? `Your ${ctx.appointments.length === 1 ? "appointment is" : "appointments are"}: ${ctx.appointments
            .map((a) => `${a.doctor} on ${a.date} at ${a.time}`)
            .join("; ")}.`
        : noRecords("appointments"),
      sources: ctx.appointments.length
        ? [{ label: "Appointments", value: ctx.appointments.map((a) => a.doctor).join(", "), sourceType: "clinical record" }]
        : undefined,
      mock: true,
    };
  }

  if (q.includes("lab") || q.includes("report")) {
    return {
      text: ctx.lastLab
        ? `Your latest lab record is "${ctx.lastLab.title}" from ${ctx.lastLab.date} (${ctx.lastLab.status}).`
        : noRecords("lab reports"),
      sources: ctx.lastLab
        ? [{ label: "Lab report", value: ctx.lastLab.title, sourceType: "document" }]
        : undefined,
      mock: true,
    };
  }

  if (q.includes("blood")) {
    return {
      text: ctx.bloodGroup ? `Your recorded blood group is ${ctx.bloodGroup}.` : noRecords("blood group"),
      mock: true,
    };
  }

  if (q.includes("allerg")) {
    return {
      text: ctx.allergies.length
        ? `Your record lists the following allergies: ${ctx.allergies.join(", ")}.`
        : noRecords("allergies"),
      mock: true,
    };
  }

  return {
    text: "I can help with the information stored in your CareLink profile — such as your medications, lab reports, appointments, blood group and allergies. Since the app currently shows only what you have stored, if you don't see a result it means nothing has been recorded yet. Please confirm any decision with your doctor.",
    mock: true,
  };
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}