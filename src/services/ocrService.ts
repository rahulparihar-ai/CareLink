// ------------------------------------------------------------------
// CARELINK - Mock OCR Pipeline Service
// Simulates document scanning and extraction.
// ------------------------------------------------------------------

import { delay } from "./aiService";

export type OcrStep =
  | "uploading"
  | "extracting_text"
  | "identifying_entities"
  | "organising"
  | "done";

export interface OcrExtractedField {
  id: string;
  label: string;
  value: string;
  confidence: number;
  needsVerification: boolean;
}

export interface OcrResult {
  title: string;
  docType: string;
  date: string;
  hospital?: string;
  fields: OcrExtractedField[];
  rawText: string;
  confidenceOverall: number;
  source: string;
}

const demoFields: OcrExtractedField[] = [
  { id: "f1", label: "Patient Name", value: "Rahul Sharma", confidence: 0.98, needsVerification: false },
  { id: "f2", label: "Date", value: "18 Aug 2026", confidence: 0.95, needsVerification: false },
  { id: "f3", label: "Test", value: "Complete Blood Count (CBC)", confidence: 0.99, needsVerification: false },
  { id: "f4", label: "Hb", value: "12.4 g/dL", confidence: 0.93, needsVerification: false },
  { id: "f5", label: "WBC", value: "7.2 ×10⁹/L", confidence: 0.9, needsVerification: false },
  { id: "f6", label: "Platelets", value: "245 ×10⁹/L", confidence: 0.89, needsVerification: false },
  { id: "f7", label: "Doctor Ref", value: "Dr. Arjun Mehta", confidence: 0.82, needsVerification: true },
];

export const ocrSteps: OcrStep[] = [
  "uploading",
  "extracting_text",
  "identifying_entities",
  "organising",
];

export function runOcrPipeline(): Promise<OcrResult> {
  return new Promise(async (resolve) => {
    await delay(300);
    // extracting
    await delay(900);
    // identifying
    await delay(900);
    // organising
    await delay(600);
    resolve({
      title: "Complete Blood Count",
      docType: "Lab Report",
      date: "18 Aug 2026",
      hospital: "CareLink Lab",
      fields: demoFields,
      rawText:
        "Complete Blood Count\nPatient: Rahul Sharma   Age: 34\nHb 12.4 g/dL\nWBC 7.2 x10^9/L\nPlatelets 245 x10^9/L\nRef: Dr. Arjun Mehta",
      confidenceOverall: 0.92,
      source: "OCR",
    });
  });
}
