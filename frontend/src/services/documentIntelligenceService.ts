import type { DocumentIntelligence, ExtractedClinicalEntity } from "@/types";
import { uid } from "@/lib/brand/constants";

// ------------------------------------------------------------------
// MEDIKIOSK - Medical Document Digitization & Intelligence
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
    title: "Dr. prescription - Metformin + Amlodipine",
    ocrConfidence: 0.94,
    entities: [
      { type: "doctor_name", value: "Dr. Arjun Mehta", confidence: 0.97 },
      { type: "diagnosis", value: "Type 2 Diabetes Mellitus", confidence: 0.9 },
      { type: "diagnosis", value: "Hypertension", confidence: 0.88 },
      { type: "medication", value: "Metformin 500mg - BD after meals", confidence: 0.93 },
      { type: "medication", value: "Amlodipine 5mg - OD morning", confidence: 0.92 },
      { type: "medication", value: "Atorvastatin 10mg - HS", confidence: 0.9 },
      { type: "date", value: "12 Mar 2026", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "2026-03-12",
  },
  lab_report: {
    type: "Lab Report",
    title: "CBC + Lipid Profile - abnormality flagged",
    ocrConfidence: 0.91,
    entities: [
      { type: "hospital_name", value: "CareLink Diagnostics", confidence: 0.95 },
      { type: "investigation", value: "Haemoglobin 11.2 g/dL (13-17)", confidence: 0.94, normalRange: "13-17", flag: "low" },
      { type: "investigation", value: "Fasting Glucose 186 mg/dL (70-100)", confidence: 0.93, normalRange: "70-100", flag: "high" },
      { type: "investigation", value: "Total Cholesterol 232 mg/dL (<200)", confidence: 0.92, normalRange: "<200", flag: "high" },
      { type: "investigation", value: "LDL 158 mg/dL (<100)", confidence: 0.9, normalRange: "<100", flag: "high" },
      { type: "investigation", value: "HDL 38 mg/dL (>40)", confidence: 0.91, normalRange: ">40", flag: "low" },
      { type: "date", value: "10 Mar 2026", confidence: 0.98 },
    ],
    abnormalities: ["Low Haemoglobin (anaemia)", "High Fasting Glucose (186)", "High LDL (158) - dyslipidaemia"],
    interactions: [],
    chronologicalDate: "2026-03-10",
  },
  discharge_summary: {
    type: "Discharge Summary",
    title: "Discharge - Laparoscopic Appendectomy",
    ocrConfidence: 0.89,
    entities: [
      { type: "doctor_name", value: "Dr. Rohan Gupta", confidence: 0.9 },
      { type: "diagnosis", value: "Acute Appendicitis", confidence: 0.93 },
      { type: "procedure", value: "Laparoscopic Appendectomy (2024)", confidence: 0.95 },
      { type: "medication", value: "Ciprofloxacin 500mg BD x 5 days post-op", confidence: 0.9 },
      { type: "hospital_name", value: "CareLink Health Network", confidence: 0.97 },
      { type: "date", value: "18 Nov 2024", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "2024-11-18",
  },
  imaging: {
    type: "Imaging",
    title: "Chest X-ray - Normal study",
    ocrConfidence: 0.88,
    entities: [
      { type: "hospital_name", value: "CareLink Radiology", confidence: 0.95 },
      { type: "diagnosis", value: "Chest X-ray - no acute abnormality", confidence: 0.9 },
      { type: "date", value: "05 Mar 2026", confidence: 0.98 },
    ],
    abnormalities: [],
    interactions: [],
    chronologicalDate: "2026-03-05",
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
