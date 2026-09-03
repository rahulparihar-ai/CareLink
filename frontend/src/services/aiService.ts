// ------------------------------------------------------------------
// CARELINK - AI Health Assistant Service (client mock)
// Answers from the user's ACTUAL stored records passed in by the caller.
// It never fabricates personal or medical data; when no record exists it
// returns honest, neutral guidance.
// ------------------------------------------------------------------

export interface AiReply {
  text: string;
  sources?: { label: string; value: string; sourceType: string; confidence?: number }[];
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
  await delay(700);
  const q = query.toLowerCase();

  if (q.includes("medication") || q.includes("medicine") || q.includes("take") || q.includes("prescription")) {
    return {
      text: ctx.medications.length
        ? `Currently in your record: ${ctx.medications.join(", ")}.`
        : noRecords("medications"),
      sources: ctx.medications.length
        ? [{ label: "Medication list", value: ctx.medications.join(", "), sourceType: "clinical record" }]
        : undefined,
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
    };
  }

  if (q.includes("blood")) {
    return {
      text: ctx.bloodGroup ? `Your recorded blood group is ${ctx.bloodGroup}.` : noRecords("blood group"),
    };
  }

  if (q.includes("allerg")) {
    return {
      text: ctx.allergies.length
        ? `Your record lists the following allergies: ${ctx.allergies.join(", ")}.`
        : noRecords("allergies"),
    };
  }

  // Generic fallback — general guidance only, no assumptions about records.
  return {
    text: "I can help with the information stored in your CareLink profile — such as your medications, lab reports, appointments, blood group and allergies. Since the app currently shows only what you have stored, if you don't see a result it means nothing has been recorded yet. Please confirm any decision with your doctor.",
  };
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}