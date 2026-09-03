import type {
  ClinicalHistory,
  ConversationTurn,
  HistoryQuestionCategory,
  RedFlagAlert,
} from "@/types";
import { uid } from "@/lib/brand/constants";

// Partial AYUSH record (all fields optional during collection)
type AyushRecord = Partial<import("@/types").AyushHistory>;

// ------------------------------------------------------------------
// CARE LINK - Conversational Clinical History Engine
// Simulates an adaptive AI that conducts a structured history interview
// following the SOCRATES framework and medical history ontology.
// ------------------------------------------------------------------

export interface HistoryQuestion {
  id: string;
  category: HistoryQuestionCategory;
  prompt: string;
  audioPrompt?: string;
  suggestions: string[];
  isOpenEnded?: boolean;
  feature?: string;
}

// Branching logic based on chief complaint
const COMPLAINT_BRANCHES: Record<string, { feature: string; questions: HistoryQuestion[] }> = {
  "chest pain": {
    feature: "SOCRATES - Chest Pain",
    questions: [
      { id: "cp-onset", category: "hpi", prompt: "When did the chest pain start?", suggestions: ["Suddenly today", "Gradually over days", "Hours ago"], isOpenEnded: true },
      { id: "cp-character", category: "hpi", prompt: "How would you describe the pain? (Press/stabbing/burning?)", suggestions: ["Pressing / tight", "Stabbing", "Burning", "Sharp"], isOpenEnded: true },
      { id: "cp-radiation", category: "hpi", prompt: "Does the pain spread to your arms, neck, jaw or back?", suggestions: ["No, stays in chest", "Left arm", "Neck/Jaw", "Back"], isOpenEnded: true },
      { id: "cp-aggravating", category: "hpi", prompt: "What makes the pain worse? (Exertion, breathing, lying down?)", suggestions: ["Walking/exertion", "Deep breathing", "Lying flat", "Nothing specific"], isOpenEnded: true },
      { id: "cp-relieving", category: "hpi", prompt: "What makes it better? (Rest, medicines, sitting up?)", suggestions: ["Rest", "Nitroglycerin", "Sitting up", "Nothing"], isOpenEnded: true },
      { id: "cp-severity", category: "hpi", prompt: "On a scale of 1 to 10, how severe is the pain?", suggestions: ["1-3 (mild)", "4-6 (moderate)", "7-10 (severe)"], isOpenEnded: true },
    ],
  },
  "stomach pain": {
    feature: "SOCRATES - Abdominal Pain",
    questions: [
      { id: "ap-onset", category: "hpi", prompt: "When did the stomach pain begin?", suggestions: ["Today", "A few days ago", "Weeks ago"], isOpenEnded: true },
      { id: "ap-location", category: "hpi", prompt: "Where exactly is the pain? (Upper, lower, right, left?)", suggestions: ["Upper abdomen", "Lower abdomen", "Right side", "Left side"], isOpenEnded: true },
      { id: "ap-character", category: "hpi", prompt: "How does the pain feel?", suggestions: ["Cramping", "Burning", "Dull ache", "Sharp"], isOpenEnded: true },
      { id: "ap-food", category: "hpi", prompt: "Is it related to eating?", suggestions: ["Yes, after meals", "No relation", "Helps when I eat"], isOpenEnded: true },
      { id: "ap-relieving", category: "hpi", prompt: "What makes it better?", suggestions: ["Nothing", "Antacids", "Empty stomach", "Sitting up"], isOpenEnded: true },
    ],
  },
  "headache": {
    feature: "Headache Assessment",
    questions: [
      { id: "h-onset", category: "hpi", prompt: "When did the headache start?", suggestions: ["Today", "This week", "Recurrent for months"], isOpenEnded: true },
      { id: "h-location", category: "hpi", prompt: "Where is the headache? (One side, whole head, back of head?)", suggestions: ["One side", "Whole head", "Back of head", "Front/temples"], isOpenEnded: true },
      { id: "h-throbbing", category: "hpi", prompt: "Is it throbbing/pulsating or constant pressure?", suggestions: ["Throbbing", "Constant pressure", "Tight band", "Sharp"], isOpenEnded: true },
      { id: "h-triggers", category: "hpi", prompt: "Do you notice any triggers (stress, light, food, sleep loss)?", suggestions: ["Stress", "Bright light", "Hunger", "Poor sleep"], isOpenEnded: true },
      { id: "h-neck", category: "hpi", prompt: "Any neck stiffness or vision changes with the headache?", suggestions: ["No", "Neck stiffness", "Blurred vision", "Both"], isOpenEnded: true },
    ],
  },
  "fever": {
    feature: "Fever Assessment",
    questions: [
      { id: "f-onset", category: "hpi", prompt: "When did the fever start?", suggestions: ["Today", "Yesterday", "2-3 days", "Over a week"], isOpenEnded: true },
      { id: "f-temp", category: "hpi", prompt: "How high has the fever been? Have you measured it?", suggestions: ["Below 100 F", "100-102 F", "Above 102 F", "Not measured"], isOpenEnded: true },
      { id: "f-pattern", category: "hpi", prompt: "Is the fever continuous or does it come and go?", suggestions: ["Continuous", "Comes and goes", "Only at night", "Only during day"], isOpenEnded: true },
      { id: "f-symptoms", category: "hpi", prompt: "Any other symptoms with the fever? (Cough, chills, body ache, rash?)", suggestions: ["Cough", "Chills", "Body ache", "Rash"], isOpenEnded: true },
      { id: "f-urine", category: "hpi", prompt: "Any burning while passing urine?", suggestions: ["No", "Yes, burning", "Increased frequency"], isOpenEnded: true },
    ],
  },
  "breathlessness": {
    feature: "Dyspnea Assessment",
    questions: [
      { id: "d-onset", category: "hpi", prompt: "When did breathlessness start?", suggestions: ["Suddenly today", "Over days", "Gradually weeks"], isOpenEnded: true },
      { id: "d-exertion", category: "hpi", prompt: "Does it happen at rest or only on exertion?", suggestions: ["At rest", "On walking", "Climbing stairs", "Always"], isOpenEnded: true },
      { id: "d-lieflat", category: "hpi", prompt: "Do you have difficulty breathing when lying flat at night?", suggestions: ["No", "Yes, need extra pillows", "Must sit up"], isOpenEnded: true },
      { id: "d-cough", category: "hpi", prompt: "Any cough or sputum with it?", suggestions: ["No", "Dry cough", "Cough with sputum"], isOpenEnded: true },
      { id: "d-wheeze", category: "hpi", prompt: "Any wheezing or history of asthma?", suggestions: ["No", "Yes, known asthma", "Whistling sound"], isOpenEnded: true },
    ],
  },
};

// Generic follow-up for other complaints
const GENERIC_FOLLOWUPS: HistoryQuestion[] = [
  { id: "g-onset", category: "hpi", prompt: "When did this problem begin?", suggestions: ["Today", "A few days ago", "Weeks ago", "Months ago"], isOpenEnded: true },
  { id: "g-duration", category: "hpi", prompt: "How long has it been going on?", suggestions: ["Less than a day", "2-3 days", "A week", "Over a month"], isOpenEnded: true },
  { id: "g-severity", category: "hpi", prompt: "On a scale of 1 to 10, how severe is it?", suggestions: ["1-3 (mild)", "4-6 (moderate)", "7-10 (severe)"], isOpenEnded: true },
  { id: "g-progress", category: "hpi", prompt: "Is it getting better, worse, or staying the same?", suggestions: ["Getting worse", "Getting better", "Same", "Comes and goes"], isOpenEnded: true },
];

// AYUSH Dashavidha Pariksha questions - extended history mode
const AYUSH_QUESTIONS: Record<string, HistoryQuestion> = {
  prakriti: { id: "ay-prakriti", category: "ayush_prakriti", prompt: "What is your Prakriti (body constitution - Vata/Pitta/Kapha)?", suggestions: ["Vata", "Pitta", "Kapha", "Vata-Pitta", "Kapha-Pitta", "Not sure"], isOpenEnded: true },
  vikriti: { id: "ay-vikriti", category: "ayush_vikriti", prompt: "What is your current Vikriti (dosha imbalance) per your assessment?", suggestions: ["Vata imbalance", "Pitta imbalance", "Kapha imbalance", "Not assessed"], isOpenEnded: true },
  agni: { id: "ay-agni", category: "ayush_agni", prompt: "How is your Agni (digestive capacity)?", suggestions: ["Strong (good appetite)", "Irregular", "Weak (poor appetite)", "Tikshna (sharp)"], isOpenEnded: true },
  koshtha: { id: "ay-koshtha", category: "ayush_koshtha", prompt: "What is your Koshtha (bowel nature)?", suggestions: ["Krura (constipated)", "Madhyama (regular)", "Mridu (loose)"], isOpenEnded: true },
  ahara_vihara: { id: "ay-ahara", category: "ayush_ahara_vihara", prompt: "Describe your diet and lifestyle (Ahara-Vihara).", suggestions: ["Vegetarian, mostly homemade", "Non-vegetarian", "Irregular meals", "High-spice/fried food"], isOpenEnded: true },
  nidana: { id: "ay-nidana", category: "ayush_nidana", prompt: "What is the Nidana (causative factor) you feel triggered this?", suggestions: ["Diet", "Weather/climate", "Stress/lifestyle", "Injury", "Not sure"], isOpenEnded: true },
  samprapti: { id: "ay-samprapti", category: "ayush_samprapti", prompt: "How did this condition develop over time (Samprapti)?", suggestions: ["Sudden onset", "Gradual build-up", "Linked to a specific event"], isOpenEnded: true },
  sar: { id: "ay-sar", category: "ayush_sara", prompt: "How is your Sara (tissue quality / essence)?", suggestions: ["Good (strong)", "Medium", "Poor (weak)"], isOpenEnded: true },
  samhanana: { id: "ay-samhanana", category: "ayush_samhanana", prompt: "What is your Samhanana (physique/body frame)?", suggestions: ["Strong build", "Medium", "Lean/weak"], isOpenEnded: true },
  pramana: { id: "ay-pramana", category: "ayush_pramana", prompt: "What is your Pramana (body proportion/measurement)?", suggestions: ["Proportionate", "Overweight", "Underweight"], isOpenEnded: true },
  satmya: { id: "ay-satmya", category: "ayush_satmya", prompt: "What is your Satmya (wholesome compatibility to foods/climate)?", suggestions: ["Most foods suit me", "Only certain foods", "Climate sensitive"], isOpenEnded: true },
  sattva: { id: "ay-sattva", category: "ayush_sattva", prompt: "What is your Sattva (mental constitution)?", suggestions: ["Calm/sattvic", "Anxious/active", "Irritable/passionate"], isOpenEnded: true },
  ahara_shakti: { id: "ay-ahara-shakti", category: "ayush_ahara_shakti", prompt: "What is your Ahara Shakti (digestive strength)?", suggestions: ["Strong", "Average", "Weak"], isOpenEnded: true },
  vyayama_shakti: { id: "ay-vyayama", category: "ayush_vyayama_shakti", prompt: "What is your Vyayama Shakti (exercise capacity)?", suggestions: ["High", "Medium", "Low"], isOpenEnded: true },
  vaya: { id: "ay-vaya", category: "ayush_vaya", prompt: "What is your Vaya (age stage per Ayurveda)?", suggestions: ["Balya (childhood)", "Madhya (middle)", "Jara (old age)"], isOpenEnded: true },
};

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const HISTORY_SERVICE = {
  /** Generate adaptive follow-up questions based on chief complaint */
  getInitialQuestions(chiefComplaint: string): HistoryQuestion[] {
    const cc = chiefComplaint.toLowerCase();
    for (const key of Object.keys(COMPLAINT_BRANCHES)) {
      if (cc.includes(key)) {
        return COMPLAINT_BRANCHES[key].questions;
      }
    }
    return GENERIC_FOLLOWUPS;
  },

  /** Get the base systematic history sections (always asked) */
  getSystematicHistory(): { category: HistoryQuestionCategory; prompt: string; suggestions: string[] }[] {
    return [
      { category: "past_medical", prompt: "Do you have any known medical conditions? (Diabetes, BP, heart, thyroid?)", suggestions: ["Diabetes", "Hypertension", "Heart disease", "Thyroid", "None"] },
      { category: "past_surgical", prompt: "Have you had any surgeries in the past?", suggestions: ["None", "Appendectomy", "C-section", "Gallbladder", "Other"] },
      { category: "drug_history", prompt: "Are you currently taking any regular medicines?", suggestions: ["None", "Blood pressure", "Diabetes", "Thyroid", "Pain relief"] },
      { category: "allergy", prompt: "Do you have any allergies to medicines or foods?", suggestions: ["None known", "Penicillin", "Sulfa", "Iodine", "Food allergy"] },
      { category: "family_history", prompt: "Does anyone in your family have heart disease, diabetes or cancer?", suggestions: ["Hypertension", "Diabetes", "Heart disease", "Cancer", "None"] },
      { category: "lifestyle", prompt: "Do you smoke, drink alcohol, or have any lifestyle habits?", suggestions: ["None", "Smoking", "Alcohol", "Tobacco", "Both"] },
      { category: "occupation", prompt: "What is your occupation?", suggestions: ["Office work", "Farming", "Student", "Labour", "Retired", "Homemaker"] },
    ];
  },

  /** Get AYUSH questions when in Ayush mode */
  getAyushQuestions(): HistoryQuestion[] {
    return Object.values(AYUSH_QUESTIONS);
  },

  /** Detect red flags from responses */
  detectRedFlag(
    category: HistoryQuestionCategory,
    response: string,
    chiefComplaint: string
  ): RedFlagAlert | null {
    const rs = response.toLowerCase();
    const cc = chiefComplaint.toLowerCase();

    // Cardiac red flags
    if (cc.includes("chest pain") && (rs.includes("left arm") || rs.includes("7") || rs.includes("8") || rs.includes("9") || rs.includes("10") || rs.includes("severe"))) {
      return {
        id: uid("rf"),
        rule: "Acute Coronary Syndrome suspicion",
        reason: "Chest pain with severe intensity / radiation - needs urgent cardiac evaluation",
        level: "URGENT",
        timestamp: new Date().toISOString(),
        sourceFields: ["chief_complaint", "hpi"],
        triggered: true,
      };
    }
    // Stroke red flags
    if ((cc.includes("weakness") || cc.includes("speech") || cc.includes("facial") || cc.includes("numb")) && (rs.includes("sudden") || rs.includes("one side"))) {
      return {
        id: uid("rf"),
        rule: "Stroke symptoms",
        reason: "Sudden focal neurological deficit - possible CVA, needs immediate attention",
        level: "URGENT",
        timestamp: new Date().toISOString(),
        sourceFields: ["chief_complaint", "hpi"],
        triggered: true,
      };
    }
    // Fever + neck stiffness = meningitis risk
    if (cc.includes("fever") && (rs.includes("neck stiffness") || rs.includes("confusion") || rs.includes("seizure"))) {
      return {
        id: uid("rf"),
        rule: "Meningitis suspicion",
        reason: "Fever with neck stiffness / altered sensorium - needs urgent evaluation",
        level: "URGENT",
        timestamp: new Date().toISOString(),
        sourceFields: ["chief_complaint", "hpi"],
        triggered: true,
      };
    }
    // Breathlessness at rest
    if (cc.includes("breathless") && rs.includes("at rest")) {
      return {
        id: uid("rf"),
        rule: "Acute dyspnea",
        reason: "Breathlessness at rest - respiratory/cardiac cause needs evaluation",
        level: "URGENT",
        timestamp: new Date().toISOString(),
        sourceFields: ["chief_complaint", "hpi"],
        triggered: true,
      };
    }
    // High fever
    if (cc.includes("fever") && rs.includes("above 102") && rs.includes("chills")) {
      return {
        id: uid("rf"),
        rule: "High-grade fever with chills",
        reason: "High fever with chills - possible infection, needs review",
        level: "NEEDS_REVIEW",
        timestamp: new Date().toISOString(),
        sourceFields: ["hpi"],
        triggered: true,
      };
    }
    return null;
  },

  /** Build a structured ClinicalHistory from conversation turns + explicit answers */
  buildClinicalHistory(
    turns: ConversationTurn[],
    explicit: Partial<ClinicalHistory>,
    historyMode: "allopathic" | "ayush"
  ): ClinicalHistory {
    const history: ClinicalHistory = {
      chiefComplaint: explicit.chiefComplaint ?? "",
      hpi: explicit.hpi ?? "",
      onset: explicit.onset,
      duration: explicit.duration,
      character: explicit.character,
      radiation: explicit.radiation,
      aggravatingFactors: explicit.aggravatingFactors ?? [],
      relievingFactors: explicit.relievingFactors ?? [],
      severity: explicit.severity,
      pastMedicalHistory: explicit.pastMedicalHistory ?? [],
      pastSurgicalHistory: explicit.pastSurgicalHistory ?? [],
      currentMedications: explicit.currentMedications ?? [],
      allergies: explicit.allergies ?? [],
      familyHistory: explicit.familyHistory ?? [],
      personalHistory: explicit.personalHistory ?? {},
      reviewOfSystems: explicit.reviewOfSystems ?? {},
    };

    // Gather answers from turns by category
    for (const turn of turns) {
      if (turn.role !== "patient" || !turn.questionCategory) continue;
      const cat = turn.questionCategory;
      const ans = turn.content;
      if (cat === "hpi") {
        if (!history.hpi) history.hpi = ans;
        else if (!history.character && (ans.includes("pain") || ans.includes("ache") || ans.includes("pressure") || ans.includes("burn"))) history.character = ans;
        else if (!history.duration && (ans.includes("day") || ans.includes("week") || ans.includes("month") || ans.includes("hour") || ans.includes("2-"))) history.duration = ans;
        else if (!history.radiation) history.radiation = ans;
      }
      if (cat === "past_medical" && ans.toLowerCase() !== "none") {
        for (const cond of ans.split(/[,\s]+and\s+|[,\s]+/)) {
          if (cond.trim() && !history.pastMedicalHistory.includes(cond.trim())) {
            history.pastMedicalHistory.push(cond.trim());
          }
        }
      }
      if (cat === "past_surgical" && ans.toLowerCase() !== "none" && !history.pastSurgicalHistory.includes(ans)) {
        history.pastSurgicalHistory.push(ans);
      }
      if (cat === "allergy" && ans.toLowerCase() !== "none known" && ans.toLowerCase() !== "none") {
        history.allergies.push({ substance: ans, reaction: "Unknown", severity: "Unspecified" });
      }
    }

    if (historyMode === "ayush") {
      const ayush: AyushRecord = {};
      for (const turn of turns) {
        if (turn.role !== "patient" || !turn.questionCategory) continue;
        const ans = turn.content;
        switch (turn.questionCategory) {
          case "ayush_prakriti": ayush.prakriti = ans; break;
          case "ayush_vikriti": ayush.vikriti = ans; break;
          case "ayush_agni": ayush.agni = ans; break;
          case "ayush_koshtha": ayush.koshtha = ans; break;
          case "ayush_ahara_vihara": ayush.aharaVihara = ans; break;
          case "ayush_nidana": ayush.nidana = ans; break;
          case "ayush_samprapti": ayush.samprapti = ans; break;
          case "ayush_sara": ayush.sar = ans; break;
          case "ayush_samhanana": ayush.samhanana = ans; break;
          case "ayush_pramana": ayush.pramana = ans; break;
          case "ayush_satmya": ayush.satmya = ans; break;
          case "ayush_sattva": ayush.sattva = ans; break;
          case "ayush_ahara_shakti": ayush.aharaShakti = ans; break;
          case "ayush_vyayama_shakti": ayush.vyayamaShakti = ans; break;
          case "ayush_vaya": ayush.vaya = ans; break;
        }
      }
      history.ayush = ayush as import("@/types").AyushHistory;
    }

    return history;
  },

  async transcribeVoice(): Promise<string> {
    await delay(1500);
    // Mock voice transcription. Returns no prefabricated patient utterance;
    // real STT (Web Speech / Bhashini) would supply the actual spoken text.
    return "";
  },
};
