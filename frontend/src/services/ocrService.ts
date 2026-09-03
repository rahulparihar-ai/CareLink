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
  { id: "f1", label: "Patient Name", value: "— (from scanned document)", confidence: 0.98, needsVerification: true },
  { id: "f2", label: "Date", value: "—", confidence: 0.95, needsVerification: true },
  { id: "f3", label: "Test / Document type", value: "—", confidence: 0.99, needsVerification: true },
  { id: "f4", label: "Field 1", value: "— (extracted value)", confidence: 0.93, needsVerification: true },
  { id: "f5", label: "Field 2", value: "— (extracted value)", confidence: 0.9, needsVerification: true },
  { id: "f6", label: "Field 3", value: "— (extracted value)", confidence: 0.89, needsVerification: true },
  { id: "f7", label: "Provider / Reference", value: "—", confidence: 0.82, needsVerification: true },
];

export const ocrSteps: OcrStep[] = [
  "uploading",
  "extracting_text",
  "identifying_entities",
  "organising",
];

export async function runOcrPipeline(): Promise<OcrResult> {
  await delay(300);
  // extracting
  await delay(900);
  // identifying
  await delay(900);
  // organising
  await delay(600);
  return {
    title: "Scanned Document",
    docType: "Report",
    date: "—",
    hospital: "CareLink",
    fields: demoFields,
    rawText:
      "OCR pipeline output. Fields are placeholders — a scanned document would provide the actual patient, date, provider and values. Backend capable of real OCR is not wired yet.",
    confidenceOverall: 0.92,
    source: "OCR",
  };
}
