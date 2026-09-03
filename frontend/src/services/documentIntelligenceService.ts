import type { DocumentIntelligence, ExtractedClinicalEntity } from "@/types";
import { uid } from "@/lib/brand/constants";

// ------------------------------------------------------------------
// CARE LINK - Medical Document Digitization & Intelligence
// Simulates high-accuracy OCR + clinical entity extraction for
// handwritten/printed prescriptions, lab reports and discharge summaries.
// ------------------------------------------------------------------

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export type ScanSource = "prescription" | "lab_report" | "discharge_summary" | "imaging";

export interface ScanResult {
  document: DocumentIntelligence;
  abnormalities: string[];
  potentialInteractions: string[];
}

interface MockScan {
  type: string;
  title: string;
  ocrConfidence: number;
  entities: ExtractedClinicalEntity[];
  abnormalities: string[];
  interactions: string[];
  chronologicalDate: string;
}

const MOCK_SCANS: Record<string, MockScan> = {
  prescription: {
    type: "Prescription",
    title: "Prescription - scanned document",
    ocrConfidence: 0.94,
    entities: [
      { type: "medication", value: "Medication 1 - dosage as prescribed", confidence: 0.93 },
      { type: "medication", value: "Medication 2 - dosage as prescribed", confidence: 0.9 },
      { type: "date", value: "Scan date", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "",
  },
  lab_report: {
    type: "Lab Report",
    title: "Lab Report - scanned document",
    ocrConfidence: 0.91,
    entities: [
      { type: "investigation", value: "Investigation result 1", confidence: 0.94 },
      { type: "investigation", value: "Investigation result 2", confidence: 0.9 },
      { type: "date", value: "Report date", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "",
  },
  discharge_summary: {
    type: "Discharge Summary",
    title: "Discharge Summary - scanned document",
    ocrConfidence: 0.89,
    entities: [
      { type: "diagnosis", value: "Diagnosis (as per document)", confidence: 0.93 },
      { type: "medication", value: "Prescribed medication - dosage as per document", confidence: 0.9 },
      { type: "date", value: "Discharge date", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "",
  },
  imaging: {
    type: "Imaging",
    title: "Imaging report - scanned document",
    ocrConfidence: 0.88,
    entities: [
      { type: "diagnosis", value: "Imaging finding (as per document)", confidence: 0.9 },
      { type: "date", value: "Study date", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "",
  },
};

export const DOCUMENT_INTELLIGENCE = {
  /** Run the document AI pipeline on a given document type */
  async process(source: ScanSource): Promise<ScanResult> {
    // Simulate pipeline steps
    await delay(600); // capture
    await delay(800); // OCR
    await delay(700); // entity extraction
    await delay(500); // structuring

    const mock = MOCK_SCANS[source];

    const document: DocumentIntelligence = {
      id: uid("doc"),
      originalName: mock.title,
      type: source,
      uploadDate: new Date().toISOString(),
      ocrStatus: "completed",
      ocrConfidence: mock.ocrConfidence,
      extractedText: mock.entities.map((e) => e.value).join("\n"),
      entities: mock.entities,
      chronologicalDate: mock.chronologicalDate,
      abnormalities: mock.abnormalities,
      potentialInteractions: mock.interactions,
    };

    return {
      document,
      abnormalities: mock.abnormalities,
      potentialInteractions: mock.interactions,
    };
  },

  /** Choose the mock scan by user-selected type */
  getMockForType(type: string): MockScan {
    return MOCK_SCANS[type] ?? MOCK_SCANS.prescription;
  },

  /** Check for potential drug interactions across documents + current meds */
  checkInteractions(medications: string[], existingMeds: string[]): string[] {
    const interactions: string[] = [];
    const interactionRules: [string, string, string][] = [
      ["Metformin", "Atorvastatin", "Metformin + Atorvastatin: monitor renal function"],
      ["Amlodipine", "Atorvastatin", "Amlodipine + Atorvastatin: generally safe, low risk"],
      ["Metformin", "Ciprofloxacin", "Metformin + Ciprofloxacin: monitor glucose, avoid in renal impairment"],
      ["Warfarin", "Ciprofloxacin", "Warfarin + Ciprofloxacin: increased bleeding risk"],
    ];
    for (const [a, b, msg] of interactionRules) {
      const ca = medications.some((m) => m.toLowerCase().includes(a.toLowerCase()));
      const cb = medications.some((m) => m.toLowerCase().includes(b.toLowerCase())) ||
        existingMeds.some((m) => m.toLowerCase().includes(b.toLowerCase()));
      if (ca && cb) interactions.push(msg);
    }
    return interactions;
  },
};
