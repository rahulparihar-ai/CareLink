// ------------------------------------------------------------------
// CARELINK - Mock Health Assistant Service
// ------------------------------------------------------------------

import { delay } from "./aiService";

export interface GuidanceResponse {
  title: string;
  points: string[];
  disclaimer: string;
}

export async function getGuidance(topic: string): Promise<GuidanceResponse> {
  await delay(700);
  if (topic.includes("routine")) {
    return {
      title: "General daily routine guidance",
      points: [
        "Aim for a consistent sleep and wake time.",
        "Include regular movement as tolerated.",
        "Stay hydrated and eat a balanced diet.",
        "Take medications as prescribed — never adjust without your doctor.",
      ],
      disclaimer: "This is educational guidance, not a medical prescription. Discuss your plan with your doctor.",
    };
  }
  if (topic.includes("sleep")) {
    return {
      title: "Habits that may support better sleep",
      points: [
        "Keep a regular sleep schedule.",
        "Limit caffeine in the evening.",
        "Reduce screen time before bed.",
        "Keep the bedroom cool, dark and quiet.",
      ],
      disclaimer: "Educational guidance only. Persistent sleep issues should be discussed with a doctor.",
    };
  }
  return {
    title: "Talking points for your doctor",
    points: [
      "Review current medications and any side effects.",
      "Discuss any new or recurring symptoms.",
      "Ask about your latest test results.",
      "Confirm the right follow-up interval.",
    ],
    disclaimer: "Educational guidance only.",
  };
}

export async function getNutritionGuidance(): Promise<GuidanceResponse> {
  await delay(700);
  return {
    title: "General healthy eating principles",
    points: [
      "Include a variety of vegetables and fruits.",
      "Prefer whole grains over refined grains.",
      "Choose lean proteins and healthy fats.",
      "Limit added sugar, salt and processed foods.",
      "General guidance only — specific dietary advice should come from your doctor or dietitian.",
    ],
    disclaimer: "This is educational. For personalized nutrition, discuss with your doctor or a registered dietitian.",
  };
}
