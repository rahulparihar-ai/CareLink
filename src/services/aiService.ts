// ------------------------------------------------------------------
// CARELINK - Mock AI Assistant Service
// Frontend simulation. Outputs are static/demo.
// ------------------------------------------------------------------

export interface AiReply {
  text: string;
  patterns?: { label: string; evidence: string[] }[];
  sources?: { label: string; value: string; sourceType: string; confidence?: number }[];
}

const answers: Record<string, string> = {
  medication: "Currently in your record: Amlodipine 5 mg once daily and Metformin 500 mg twice daily.",
  appointment: "Your most recent appointment was with Dr. Mehta on 5 March 2026, and your next one is on 30 August 2026 at 10:30 AM.",
  lab: "Your last lab report is a Complete Blood Count from 18 Aug 2026. Hb 12.4 g/dL, WBC 7.2 ×10⁹/L, Platelets 245 ×10⁹/L — all within normal range.",
  blood: "Your recorded blood group is B+.",
  allergy: "Your record lists a known allergy to Penicillin (moderate severity).",
  term: "A 'CBC' (Complete Blood Count) measures red cells, white cells and platelets. It is a common screening test. For a full explanation, please discuss with your doctor.",
};

export async function askAi(query: string): Promise<AiReply> {
  await delay(700);
  const q = query.toLowerCase();
  const qa: Record<string, string> = {
    "medication": "medication",
    "medicine": "medication",
    "take": "medication",
    "appointment": "appointment",
    "last visit": "appointment",
    "lab": "lab",
    "report": "lab",
    "blood": "blood",
    "allerg": "allergy",
    "term": "term",
    "meaning": "term",
  };
  let reply = "That's a general health question. I can help with your stored records. Here is some general guidance — please confirm with your doctor for any decisions. Your records show an allergy to Penicillin and medications Amlodipine and Metformin.";
  const patterns: AiReply["patterns"] = [
    { label: "Historical pattern: seasonal flu visits", evidence: ["Visits in Oct 2025, Oct 2024"] },
  ];
  const sources: AiReply["sources"] = [
    { label: "Medication list", value: "Amlodipine 5mg, Metformin 500mg", sourceType: "clinical record", confidence: 0.99 },
  ];

  for (const [kw, key] of Object.entries(qa)) {
    if (q.includes(kw)) {
      reply = answers[key];
      break;
    }
  }
  return { text: reply, patterns, sources };
}

export function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
