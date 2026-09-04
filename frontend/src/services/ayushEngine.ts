// ------------------------------------------------------------------
// CARELINK AYUSH INTELLIGENCE - Adaptive Interview Engine
//
// Deterministic mock engine that demonstrates real state transitions:
// patient answer → data extraction → next question selection →
// structured field update → evidence creation → summary generation
//
// No fake AI. Every state change is traceable.
// ------------------------------------------------------------------

import { uid } from "@/lib/brand/constants";
import type {
  AssessmentField,
  AyushClinicalHistory,
  AyurvedicAssessment,
  DashavidhaAssessment,
  AyushRedFlag,
  AyushQuestion,
  AyushConversationTurn,
  AyushPhysicianSummary,
  AyushInputMode,
  ConfidenceLevel,
  ExtractionSource,
  VerificationStatus,
  EvidenceItem,
} from "@/types/ayush";
import type { LanguageCode, SourceEvidence } from "@/types";

// ---- HELPERS ------------------------------------------------------

const now = () => new Date().toISOString();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

function makeField(value: string, source: ExtractionSource = "PATIENT_REPORTED", confidence: ConfidenceLevel = "medium"): AssessmentField {
  return {
    value,
    source,
    confidence,
    status: "ai_extracted",
    evidence: [],
    lastUpdated: now(),
  };
}

function makeEvidence(field: string, original: string, structured: string, source: ExtractionSource): EvidenceItem {
  return {
    id: uid("ev"),
    field,
    originalResponse: original,
    structuredInterpretation: structured,
    sourceType: source,
    timestamp: now(),
    confidence: "medium",
  };
}

function emptyClinicalHistory(): AyushClinicalHistory {
  const ef = (label: string): AssessmentField => makeField("", "PATIENT_REPORTED", "low");
  return {
    chiefComplaint: ef("Chief Complaint"),
    duration: ef("Duration"),
    onset: ef("Onset"),
    pattern: ef("Pattern"),
    character: ef("Character"),
    aggravatingFactors: ef("Aggravating Factors"),
    relievingFactors: ef("Relieving Factors"),
    associatedSymptoms: ef("Associated Symptoms"),
    severity: ef("Severity"),
    pastMedicalHistory: ef("Past Medical History"),
    pastSurgicalHistory: ef("Past Surgical History"),
    currentMedications: ef("Current Medications"),
    allergies: ef("Allergy History"),
    familyHistory: ef("Family History"),
    personalHistory: ef("Personal History"),
    dietHistory: ef("Diet History"),
    sleepHistory: ef("Sleep History"),
    bowelHistory: ef("Bowel History"),
    substanceHistory: ef("Substance History"),
    reviewOfSystems: ef("Review of Systems"),
  };
}

function emptyDashavidha(): DashavidhaAssessment {
  const ef = (label: string): AssessmentField => makeField("", "PATIENT_REPORTED", "low");
  return {
    prakriti: ef("Prakriti"),
    vikriti: ef("Vikriti"),
    sara: ef("Sara"),
    samhanana: ef("Samhanana"),
    pramana: ef("Pramana"),
    satmya: ef("Satmya"),
    sattva: ef("Sattva"),
    aharaShakti: ef("Ahara Shakti"),
    vyayamaShakti: ef("Vyayama Shakti"),
    vaya: ef("Vaya"),
  };
}

function emptyAyurvedicAssessment(): AyurvedicAssessment {
  const ef = (label: string): AssessmentField => makeField("", "PATIENT_REPORTED", "low");
  return {
    dashavidha: emptyDashavidha(),
    agni: ef("Agni"),
    koshtha: ef("Koshtha"),
    aharaVihara: ef("Ahara-Vihara"),
    nidana: ef("Nidana"),
    sampraptiContext: ef("Samprapti Context"),
  };
}

// ---- RED FLAG RULES ------------------------------------------------

const RED_FLAG_RULES: { keywords: string[]; rule: string; reason: string; level: "URGENT" | "NEEDS_REVIEW" }[] = [
  { keywords: ["severe chest pain", "chest pain radiating", "crushing chest"], rule: "Acute Cardiac Suspect", reason: "Severe chest pain may indicate acute cardiac event", level: "URGENT" },
  { keywords: ["vomiting blood", "blood in vomit", "hematemesis"], rule: "Upper GI Bleed", reason: "Hematemesis requires urgent evaluation", level: "URGENT" },
  { keywords: ["black stool", "bloody stool", "blood in stool", "melena"], rule: "GI Bleed", reason: "Melena/hematochezia requires urgent evaluation", level: "URGENT" },
  { keywords: ["cannot breathe", "severe breathing difficulty", "breathlessness at rest", "unable to breathe"], rule: "Acute Dyspnea", reason: "Severe breathlessness at rest needs immediate attention", level: "URGENT" },
  { keywords: ["loss of consciousness", "fainted", "unconscious", "seizure"], rule: "Neurological Emergency", reason: "Altered consciousness requires urgent evaluation", level: "URGENT" },
  { keywords: ["sudden weakness one side", "facial drooping", "slurred speech", "cannot move arm"], rule: "Stroke Suspect", reason: "Focal neurological deficit needs immediate evaluation", level: "URGENT" },
  { keywords: ["heavy bleeding", "uncontrolled bleeding", "bleeding won't stop"], rule: "Major Bleeding", reason: "Uncontrolled bleeding requires urgent intervention", level: "URGENT" },
  { keywords: ["severe sudden headache", "worst headache of life", "thunderclap headache"], rule: "Subarachnoid Suspect", reason: "Severe sudden headache may indicate serious pathology", level: "URGENT" },
  { keywords: ["suicidal", "want to die", "end my life", "kill myself"], rule: "Mental Health Crisis", reason: "Suicidal ideation requires immediate mental health support", level: "URGENT" },
  { keywords: ["severe abdominal pain", "rigid abdomen", "board-like abdomen"], rule: "Acute Abdomen", reason: "Severe/rigid abdomen may indicate peritonitis", level: "NEEDS_REVIEW" },
  { keywords: ["high fever more than", "fever above 103", "fever not coming down"], rule: "High Fever", reason: "Very high fever needs clinical evaluation", level: "NEEDS_REVIEW" },
  { keywords: ["severe pain", "pain 9", "pain 10", "worst pain"], rule: "Severe Pain", reason: "Severe pain reported - requires clinician assessment", level: "NEEDS_REVIEW" },
];

// ---- QUESTION BANK ------------------------------------------------

interface QuestionDef {
  id: string;
  category: string;
  phase: "complaint" | "hpi" | "systematic" | "ayurvedic";
  textByLanguage: Record<string, string>;
  answerType: "open" | "select" | "multi_select" | "scale" | "yes_no";
  options?: { label: string; value: string; labelByLanguage?: Record<string, string> }[];
  mapsToField: string;
  mapsToSection: "clinical" | "ayurvedic";
  dependsOn?: string;
  relevanceCheck?: (answers: Record<string, string>) => boolean;
  safetyKeywords?: string[];
}

const QUESTION_BANK: QuestionDef[] = [
  // ---- CHIEF COMPLAINT ----
  {
    id: "cc-main",
    category: "chief_complaint",
    phase: "complaint",
    textByLanguage: {
      en: "What is your main health concern today?",
      hi: "आज आपकी मुख्य स्वास्थ्य समस्या क्या है?",
      ur: "آج آپ کی مرکزی صحت کی شکایت کیا ہے؟",
      bn: "আজ আপনার প্রধান স্বাস্থ্য সমস্যা কী?",
      ta: "இன்று உங்கள் முக்கிய உடல்நலப் பிரச்சனை என்ன?",
      te: "ఈ రోజు మీ ముఖ్య ఆరోగ్య సమస్య ఏమిటి?",
      mr: "आज तुमची मुख्य आरोग्य समस्या काय आहे?",
      gu: "આજે તમારી મુખ્ય આરોગ્ય સમસ્યા શું છે?",
      kn: "ಇಂದು ನಿಮ್ಮ ಮುಖ್ಯ ಆರೋಗ್ಯ ಸಮಸ್ಯೆ ಯಾವುದು?",
      ml: "ഇന്ന് നിങ്ങളുടെ പ്രധാന ആരോഗ്യ പ്രശ്നം എന്താണ്?",
      pa: "ਅੱਜ ਤੁਹਾਡੀ ਮੁੱਖ ਸਿਹਤ ਸਮੱਸਿਆ ਕੀ ਹੈ?",
      or: "ଆଜି ଆପଣଙ୍କର ମୁଖ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ସମସ୍ୟା କଣ?",
      as: "আজি আপোনাৰ প্ৰধান স্বাস্থ্য সমস্যা কি?",
    },
    answerType: "open",
    mapsToField: "chiefComplaint",
    mapsToSection: "clinical",
    safetyKeywords: ["severe chest pain", "vomiting blood", "cannot breathe", "loss of consciousness", "severe bleeding"],
  },
  {
    id: "cc-duration",
    category: "chief_complaint",
    phase: "complaint",
    textByLanguage: {
      en: "When did this problem start?",
      hi: "यह समस्या कब शुरू हुई?",
      ur: "یہ شکایت کب شروع ہوئی؟",
      bn: "এই সমস্যা কখন শুরু হয়েছিল?",
      ta: "இந்தப் பிரச்சனை எப்போது தொடங்கியது?",
      te: "ఈ సమస్ఎప్పుడు మొదలైంది?",
      mr: "ही समस्या कधी सुरू झाली?",
      gu: "આ સમસ્યા ક્યારે શરૂ થઈ?",
      kn: "ಈ ಸಮಸ್ಯೆ ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?",
      ml: "ഈ പ്രശ്നം എപ്പോൾ തുടങ്ങി?",
      pa: "ਇਹ ਸਮੱਸਿਆ ਕਦੋਂ ਸ਼ੁਰੂ ਹੋਈ?",
      or: "ଏହି ସମସ୍ୟା କେତେବେଳେ ଆରମ୍ଭ ହେଲା?",
      as: "এই সমস্যা কেতিয়াবা আৰম্ভ হৈছিল?",
    },
    answerType: "select",
    options: [
      { label: "Today", value: "today" },
      { label: "2-3 days ago", value: "few_days" },
      { label: "About a week", value: "week" },
      { label: "2-4 weeks", value: "weeks" },
      { label: "Months ago", value: "months" },
      { label: "Years ago", value: "years" },
    ],
    mapsToField: "duration",
    mapsToSection: "clinical",
  },
  {
    id: "cc-severity",
    category: "hpi",
    phase: "hpi",
    textByLanguage: {
      en: "On a scale of 1-10, how severe is your discomfort?",
      hi: "1-10 के पैमाने पर, आपकी तकलीफ कितनी गंभीर है?",
      ur: "1-10 کے پیمانے پر، آپ کی تکلیف کتنی شدید ہے؟",
      bn: "1-10 স্কেলে, আপনার অস্বস্তি কতটা তীব্র?",
      ta: "1-10 அளவில், உங்கள் அசௌகர்யம் எவ்வளவு தீவிரமானது?",
      te: "1-10 స్కేల్‌లో, మీ అసౌకర్యం ఎంత తీవ్రంగా ఉంది?",
      mr: "1-10 च्या प्रमाणात, तुमचा अस्वस्थता किती गंभीर आहे?",
      gu: "1-10 ના પેમાણે, તમારી અસુવિધા કેટલી ગંભીર છે?",
      kn: "1-10 ಪ್ರಮಾಣದಲ್ಲಿ, ನಿಮ್ಮ ಅಸ್ವಸ್ಥತೆ ಎಷ್ಟು ತೀವ್ರವಾಗಿದೆ?",
      ml: "1-10 സ്കെയിലിൽ, നിങ്ങളുടെ അസ്വസ്ഥത എത്തത്തോളം ഗുരുതരമാണ്?",
      pa: "1-10 ਦੇ ਪੈਮਾਨੇ ਤੇ, ਤੁਹਾਡੀ ਤਕਲੀਫ ਕਿੰਨੀ ਗੰਭੀਰ ਹੈ?",
      or: "1-10 ସ୍କେଲରେ, ଆପଣଙ୍କ ଅସ୍ୱାସ୍ଥ୍ୟ କେତେ ତୀବ୍ର?",
      as: "1-10 স্কেলত, আপোনাৰ অস্বস্তি কিমান তীব্ৰ?",
    },
    answerType: "select",
    options: [
      { label: "1-3 (Mild)", value: "mild" },
      { label: "4-6 (Moderate)", value: "moderate" },
      { label: "7-10 (Severe)", value: "severe" },
    ],
    mapsToField: "severity",
    mapsToSection: "clinical",
    safetyKeywords: ["severe", "9", "10", "worst pain"],
  },
  {
    id: "cc-pattern",
    category: "hpi",
    phase: "hpi",
    textByLanguage: {
      en: "How has this problem changed over time?",
      hi: "समय के साथ यह समस्या कैसे बदली है?",
      ur: "وقت کے ساتھ یہ شکایت کیسے بدلی ہے؟",
      bn: "সময়ের সাথে এই সমস্যা কীভাবে পরিবর্তিত হয়েছে?",
      ta: "காலப்போக்கில் இந்தப் பிரச்சனை எப்படி மாறியுள்ளது?",
      te: "కాలక్రమేణా ఈ సమస్ఎలా మారింది?",
      mr: "कालांतरात ही समस्या कसे बदलली?",
      gu: "સમય સાથે આ સમસ્યા કેવી રીતે બદલાઈ?",
      kn: "ಕಾಲಾನುಕ್ರಮೇಣ ಈ ಸಮಸ್ಯೆ ಹೇಗೆ ಬದಲಾಗಿದೆ?",
      ml: "കാലക്രമേണ ഈ പ്രശ്നം എങ്ങനെ മാറി?",
      pa: "ਸਮੇਂ ਨਾਲ ਇਹ ਸਮੱਸਿਆ ਕਿਵੇਂ ਬਦਲੀ?",
      or: "ସମୟ ସହିତ ଏହି ସମସ୍ୟା କିପରି ପରିବର୍ତ୍ତିତ ହେଲା?",
      as: "সময়ৰ লগত এই সমস্যা কেনেকৈ পৰিবৰ্তন হৈছিল?",
    },
    answerType: "select",
    options: [
      { label: "Getting worse", value: "worsening" },
      { label: "Staying the same", value: "stable" },
      { label: "Getting better", value: "improving" },
      { label: "Comes and goes", value: "fluctuating" },
    ],
    mapsToField: "pattern",
    mapsToSection: "clinical",
  },
  {
    id: "cc-worse",
    category: "hpi",
    phase: "hpi",
    textByLanguage: {
      en: "What makes it worse?",
      hi: "क्या इसे और बुरा बनाता है?",
      ur: "کیا اسے اور برا بناتا ہے؟",
      bn: "কী এটাকে আরো খারাপ করে?",
      ta: "இது மோசமாக்குவது என்ன?",
      te: "దీన్ని మరింత తీవ్రంగా చేసేది ఏమిటి?",
      mr: "हे आणखी कशामुळे वाधते?",
      gu: "આને વધુ ખરાબ બનાવતું શું છે?",
      kn: "ಇದನ್ನು ಇನ್ನಷ್ಟು ಕೆಟ್ಟದಾಗಿಸುವುದು ಯಾವುದು?",
      ml: "ഇത് വഷളാക്കുന്നത് എന്താണ്?",
      pa: "ਇਸ ਨੂੰ ਹੋਰ ਵੱਧ ਬੁਰਾ ਕੀ ਬਣਾਉਂਦਾ ਹੈ?",
      or: "ଏହାକୁ ଆହୁରି ଖରାପ କରେ କଣ?",
      as: "ইয়াক অধিক খৰাপ কৰে কি?",
    },
    answerType: "open",
    mapsToField: "aggravatingFactors",
    mapsToSection: "clinical",
  },
  {
    id: "cc-better",
    category: "hpi",
    phase: "hpi",
    textByLanguage: {
      en: "What makes it better?",
      hi: "क्या इसे बेहतर बनाता है?",
      ur: "کیا اسے بہتر بناتا ہے؟",
      bn: "কী এটাকে ভালো করে?",
      ta: "இதை சிறப்பாக்குவது என்ன?",
      te: "దీన్ని మెరుగుపరిచేది ఏమిటి?",
      mr: "हे कशामुळे सुधरते?",
      gu: "આને વધુ સારું બનાવતું શું છે?",
      kn: "ಇದನ್ನು ಉತ್ತಮಗೊಳಿಸುವುದು ಯಾವುದು?",
      ml: "ഇത് മെച്ചപ്പെടുത്തുന്നത് എന്താണ്?",
      pa: "ਇਸ ਨੂੰ ਬਿਹਤਰ ਕੀ ਬਣਾਉਂਦਾ ਹੈ?",
      or: "ଏହାକୁ ଭଲ କରେ କଣ?",
      as: "ইয়াক ভাল কৰে কি?",
    },
    answerType: "open",
    mapsToField: "relievingFactors",
    mapsToSection: "clinical",
  },
  {
    id: "cc-associated",
    category: "hpi",
    phase: "hpi",
    textByLanguage: {
      en: "Do you have any other symptoms along with this? (Nausea, vomiting, fever, weakness?)",
      hi: "इसके साथ क्या आपको कोई अन्य लक्षण हैं? (जी मिचलाना, उल्टी, बुखार, कमज़ोरी?)",
      ur: "اس کے ساتھ کیا آپ کو کئی اور علامتیں ہیں؟ (جی مچلنا، الٹی، بخار، کمزوری؟)",
      bn: "এর সাথে আপনার অন্য কোনো লক্ষণ আছে কি? (বমি, জ্বর, দুর্বলতা?)",
      ta: "இதனுடன் வேறு ஏதேனும் அறிகுறிகள் உள்ளதா? (குமட்டல், வாந்தி, காய்ச்சல், பலவீனம்?)",
      te: "దీంతో పాటు వేరే లక్షణాలు ఉన్నాయా? (వికారం, వాంతులు, జ్వరం, బలహీనత?)",
      mr: "याबरोबर तुम्हाला इतर कोणतीही लक्षणे आहेत का? (जी फिरणे, उलट्या, ताप, अशक्तपणा?)",
      gu: "આ સાથે તમને બીજા કોઈ લક્ષણો છે? (મટાડો, ઉલટી, તાવ, નબળાઈ?)",
      kn: "ಇದರೊಂದಿಗೆ ಬೇರೆ ಯಾವುದಾದರೂ ಲಕ್ಷಣಗಳಿವೆಯೇ? (ವಾಕರಿಕೆ, ವಾಂತಿ, ಜ್ವರ, ದುರ್ಬಲತೆ?)",
      ml: "ഇതിനൊപ്പം മറ്റെന്തെങ്കിലും ലക്ഷണങ്ങൾ ഉണ്ടോ? (ഓക്കാനം, ഛർദ്ദി, പനി, ദൗർബല്യം?)",
      pa: "ਇਸ ਨਾਲ ਕੀ ਤੁਹਾਡੇ ਨੂੰ ਕੋਈ ਹੋਰ ਲੱਛਣ ਹਨ? (ਜੀ ਮਚਲਾਣਾ, ਉਲਟੀ, ਬੁਖ਼ਾਰ, ਕਮਜ਼ੋਰੀ?)",
      or: "ଏହା ସହିତ ଆପଣଙ୍କର ଅନ୍ୟ କିଛି ଲକ୍ଷଣ ଅଛି କି? (ବାନ୍ତି, ଜ୍ୱର, ଦୁର୍ବଳତା?)",
      as: "এৰ লগত আপোনাৰ আন কোনো লক্ষণ আছে নেকি? (বমি, জ্বৰ, দুৰ্বলতা?)",
    },
    answerType: "open",
    mapsToField: "associatedSymptoms",
    mapsToSection: "clinical",
  },
  // ---- SYSTEMATIC HISTORY ----
  {
    id: "sys-past-med",
    category: "past_medical",
    phase: "systematic",
    textByLanguage: {
      en: "Do you have any known medical conditions? (Diabetes, blood pressure, heart, thyroid?)",
      hi: "क्या आपको कोई ज्ञात चिकित्सीय स्थिति है? (मधुमेह, ब्लड प्रेशर, हृदय, थायरॉयड?)",
      ur: "کیا آپ کو کوئی معلوم طبیت حالت ہے؟ (شوگر، بلڈ پریشر، دل، تھائیرائیڈ؟)",
      bn: "আপনার কোনো পরিচিত চিকিৎসা অবস্থা আছে কি? (ডায়াবেটিস, ব্লাড প্রেশার, হৃদয়?)",
      ta: "உங்களுக்கு ஏதேனும் அறியப்பட்ட மருத்துவ நிலை உள்ளதா? (நீரிழிவு, இரத்த அழுத்தம், இதயம்?)",
      te: "మీకు తెలిసిన వైద్య పరిస్థితి ఉందా? (మధుమేహం, రక్తపోటు, గుండె, థైరాయిడ్?)",
      mr: "तुम्हाला कोणतीही ज्ञात वैद्यकीय स्थिती आहे का? (मधुमेह, ब्लड प्रेशर, हृदय, थायरॉयड?)",
      gu: "તમને કોઈ જાણીતી તબીબી સ્થિતિ છે? (ડાયાબિટીસ, બ્લડ પ્રેશર, હૃદય?)",
      kn: "ನಿಮಗೆ ತಿಳಿದಿರುವ ವೈದ್ಯಕೀಯ ಸ್ಥಿತಿ ಇದೆಯೇ? (ಮಧುಮೇಹ, ರಕ್ತದೊತ್ತಡ, ಹೃದಯ?)",
      ml: "നിങ്ങൾക്ക് അറിയാവുന്ന മെഡിക്കൽ അവസ്ഥ ഉണ്ടോ? (പ്രമേഹം, രക്തസമ്മർദ്ദം, ഹൃദയം?)",
      pa: "ਕੀ ਤੁਹਾਡੂੰ ਕੋਈ ਜਾਣੀਆਰੀ ਮੈਡੀਕਲ ਹਾਲਤ ਹੈ? (ਸ਼ੂਗਰ, ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ, ਦਿਲ?)",
      or: "ଆପଣଙ୍କର କିଛି ଜଣା ମେଡିକାଲ ସ୍ଥିତି ଅଛି କି? (ମଧୁମେହ, ରକ୍ତଚାପ, ହୃଦୟ?)",
      as: "আপোনাৰ কোনো জণা চিকিৎসা অৱস্থা আছে নেকি? (মধুমেহ, ৰক্তচাপ, হৃদয়?)",
    },
    answerType: "open",
    mapsToField: "pastMedicalHistory",
    mapsToSection: "clinical",
  },
  {
    id: "sys-meds",
    category: "drug_history",
    phase: "systematic",
    textByLanguage: {
      en: "Are you currently taking any medicines? Please name them.",
      hi: "क्या आप वर्तमान में कोई दवाइयां ले रहे हैं? कृपया उनका नाम बताएं।",
      ur: "کیا آپ فی الحال کوئی ادویات لے رہے ہیں؟ براہ کرم ان کا نام بتائیں۔",
      bn: "আপনি বর্তমানে কোনো ওষুধ খাচ্ছেন কি? দয়া করে নাম বলুন।",
      ta: "தற்போது ஏதேனும் மருந்துகள் எடுத்துக்கொள்கிறீர்களா? தயவுசெய்து பெயர்களைக் கூறுங்கள்.",
      te: "మీరు ప్రస్తుతం ఏవైనా మందులు తీసుకుంటున్నారా? దయచేసి వాటి పేర్లు చెప్పండి.",
      mr: "तुम्ही सध्या कोणत्याही औषधे घेत आहात का? कृपया त्यांचे नाव सांगा.",
      gu: "તમે હાલમાં કોઈ દવાઓ લઈ રહ્યા છો? કૃપા કરીને તેમનું નામ જણાવો.",
      kn: "ನೀವು ಪ್ರಸ್ತುತ ಯಾವುದಾದರೂ ಔಷಧಿಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ? ದಯವಿಟ್ಟು ಹೆಸರುಗಳನ್ನು ಹೇಳಿ.",
      ml: "നിങ്ങൾ ഇപ്പോൾ ഏതെങ്കിലും മരുന്നുകൾ കഴിക്കുന്നുണ്ടോ? ദയവായി പേരുകൾ പറയുക.",
      pa: "ਕੀ ਤੁਸੀਂ ਹੁਣ ਕੋਈ ਦਵਾਈਆਂ ਲੈ ਰਹੇ ਹੋ? ਕਿਰਪਾ ਕਰਕੇ ਉਨ੍ਹਾਂ ਦੇ ਨਾਮ ਦੱਸੋ।",
      or: "ଆପଣ ବର୍ତ୍ତମାନ କିଛି ଔଷଧ ଖାଉଛନ୍ତି କି? ଦୟାକରି ସେମାନଙ୍କ ନାମ କୁହ।",
      as: "আপুনি বৰ্তমানে কোনো অষুধ খাইছে নেকি? অনুগ্ৰহ কৰি তাৰ নাম কওক।",
    },
    answerType: "open",
    mapsToField: "currentMedications",
    mapsToSection: "clinical",
  },
  {
    id: "sys-allergy",
    category: "allergy",
    phase: "systematic",
    textByLanguage: {
      en: "Do you have any known allergies? (Medicines, food, anything?)",
      hi: "क्या आपको कोई ज्ञात एलर्जी है? (दवाइयां, खाना, कुछ भी?)",
      ur: "کیا آپ کو کوئی معلوم الرجی ہے؟ (ادویات، کھانا، کچھ بھی؟)",
      bn: "আপনার কোনো পরিচিত অ্যালার্জি আছে কি? (ওষুধ, খাবার, কিছুই?)",
      ta: "உங்களுக்கு ஏதேனும் அறியப்பட்ட ஒவ்வாமை உள்ளதா? (மருந்துகள், உணவு, எதுவுமா?)",
      te: "మీకు తెలిసిన అలెర్జీలు ఉన్నాయా? (మందులు, ఆహారం, ఏదైనా?)",
      mr: "तुम्हाला कोणतीही ज्ञात अॅलर्जी आहे का? (औषधे, अन्न, काहीही?)",
      gu: "તમને કોઈ જાણીતી એલર્જી છે? (દવાઓ, ખોરાક, કંઈ પણ?)",
      kn: "ನಿಮಗೆ ತಿಳಿದಿರುವ ಅಲರ್ಜಿಗಳಿವೆಯೇ? (ಔಷಧಿಗಳು, ಆಹಾರ, ಏನಾದರೂ?)",
      ml: "നിങ്ങൾക്ക് അറിയാവുന്ന അലർജികൾ ഉണ്ടോ? (മരുന്നുകൾ, ഭക്ഷണം, എന്തെങ്കിലും?)",
      pa: "ਕੀ ਤੁਹਾਡੂੰ ਕੋਈ ਜਾਣੀਆਰੀ ਐਲਰਜੀ ਹੈ? (ਦਵਾਈਆਂ, ਖਾਣਾ, ਕੁਝ ਵੀ?)",
      or: "ଆପଣଙ୍କର କିଛି ଜଣା ଆଲର୍ଜି ଅଛି କି? (ଔଷଧ, ଖାଦ୍ୟ, କିଛି ବି?)",
      as: "আপোনাৰ কোনো জণা এলাৰ্জি আছে নেকি? (অষুধ, খাদ্য, কিবা?)",
    },
    answerType: "open",
    mapsToField: "allergies",
    mapsToSection: "clinical",
  },
  {
    id: "sys-family",
    category: "family_history",
    phase: "systematic",
    textByLanguage: {
      en: "Does anyone in your family have diabetes, heart disease, or cancer?",
      hi: "क्या आपके परिवार में किसी को मधुमेह, हृदय रोग या कैंसर है?",
      ur: "کیا آپ کے خاندان میں کسی کو شوگر، دل کی بیماری یا کینسر ہے؟",
      bn: "আপনার পরিবারে কারো ডায়াবেটিস, হৃদরোগ বা ক্যান্সার আছে কি?",
      ta: "உங்கள் குடும்பத்தில் யாருக்கேனும் நீரிழிவு, இதய நோய் அல்லது புற்றுநோய் உள்ளதா?",
      te: "మీ కుటుంబంలో ఎవరికైనా మధుమేహం, గుండె జబ్బు లేదా క్యాన్సర్ ఉందా?",
      mr: "तुमच्या कुटुंबात कोणाला मधुमेह, हृदयरोग किंवा कर्करोग आहे का?",
      gu: "તમારા પરિવારમાં કોઈને ડાયાબિટીસ, હૃદयરોગ અથવા કેન્સર છે?",
      kn: "ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಯಾರಿಗಾದರೂ ಮಧುಮೇಹ, ಹೃದಯ ರೋಗ ಅಥವಾ ಕ್ಯಾನ್ಸರ್ ಇದೆಯೇ?",
      ml: "നിങ്ങളുടെ കുടുംബത്തിൽ ആർക്കെങ്കിലും പ്രമേഹം, ഹൃദയരോഗം അല്ലെങ്കിൽ കാൻസർ ഉണ്ടോ?",
      pa: "ਕੀ ਤੁਹਾਡੇ ਪਰਿਵਾਰ ਵਿੱਚ ਕਿਸੇ ਨੂੰ ਸ਼ੂਗਰ, ਦਿਲ ਦੀ ਬਿਮਾਰੀ ਜਾਂ ਕੈਂਸਰ ਹੈ?",
      or: "ଆପଣଙ୍କ ପରିବାରରେ କାହାର ମଧୁମେହ, ହୃଦୟ ରୋଗ କିମ୍ବା କ୍ୟାନ୍ସର ଅଛି କି?",
      as: "আপোনাৰ পৰিয়ালত কাৰো মধুমেহ, হৃদৰোগ বা কেন্ছৰ আছে নেকি?",
    },
    answerType: "open",
    mapsToField: "familyHistory",
    mapsToSection: "clinical",
  },
  {
    id: "sys-diet",
    category: "personal_history",
    phase: "systematic",
    textByLanguage: {
      en: "What is your typical diet like? (Vegetarian/non-vegetarian, meal timing, spicy food?)",
      hi: "आपकी सामान्य आहार कैसी है? (शाकाहारी/मांसाहारी, भोजन का समय, मसालेदार खाना?)",
      ur: "آپ کا عام طور پر خوراک کیسا ہے؟ (سبزی خور، گوشت خور، کھانے کا وقت، تیز مصالحہ؟)",
      bn: "আপনার সাধারণ খাদ্যাভ্যাস কেমন? (নিরামিষ/মাংসাহার, খাবারের সময়, ঝাল খাবার?)",
      ta: "உங்கள் வழக்கமான உணவு எப்படி இருக்கும்? (சைவம்/அசைவம், உணவு நேரம், காரமான உணவு?)",
      te: "మీ సాధారణ ఆహారం ఎలా ఉంటుంది? (శాకాహారి/మాంసాహారి, భోజన సమయం, కారంగా?)",
      mr: "तुमचा सामान्य आहार कसा असतो? (शाकाहारी/मांसाहारी, जेवणाचा वेळ, तिखट खाद्य?)",
      gu: "તમારો સામાન્ય આહાર કેવો છે? (શાકાહારી/માંસાહારી, જમવાનો સમય, તીખો ખોરાક?)",
      kn: "ನಿಮ್ಮ ಸಾಮಾನ್ಯ ಆಹಾರ ಹೇಗಿರುತ್ತದೆ? (ಸಸ್ಯಾಹಾರಿ/ಮಾಂಸಾಹಾರಿ, ಊಟದ ಸಮಯ, ಖಾರದ ಆಹಾರ?)",
      ml: "നിങ്ങളുടെ സാധാരണ ഭക്ഷണം എങ്ങനെയാണ്? (സസ്യാഹാരി/മാംസാഹാരി, ഭക്ഷണ സമയം, എരിവുള്ള ഭക്ഷണം?)",
      pa: "ਤੁਹਾਡਾ ਆਮ ਆਹਾਰ ਕਿਹੋ ਜਿਹਾ ਹੈ? (ਸ਼ਾਕਾਹਾਰੀ/ਮਾਸਾਹਾਰੀ, ਖਾਣ ਦਾ ਸਮਾਂ, ਤਿਖਾ ਖਾਣਾ?)",
      or: "ଆପଣଙ୍କ ସାଧାରଣ ଖାଦ୍ୟ କେମିତି? (ଶାକାହାରୀ/ମାଂସାହାରୀ, ଖାଇବା ସମୟ, ତୀବ୍ର ଖାଦ୍ୟ?)",
      as: "আপোনাৰ সাধাৰণ আহাৰ কেনেকৈ? (শাকাহাৰী/মাংসাহাৰী, খাদ্যৰ সময়, ঝাল খাদ্য?)",
    },
    answerType: "open",
    mapsToField: "dietHistory",
    mapsToSection: "clinical",
  },
  {
    id: "sys-sleep",
    category: "personal_history",
    phase: "systematic",
    textByLanguage: {
      en: "How is your sleep? (Hours, quality, any problems sleeping?)",
      hi: "आपकी नींद कैसी है? (घंटे, गुणवत्ता, नींद में कोई समस्या?)",
      ur: "آپ کی نیند کیسی ہے؟ (گھنٹے، معیار، نیند میں کوئی مسئلہ؟)",
      bn: "আপনার ঘুম কেমন? (ঘণ্টা, মান, ঘুমানোর সমস্যা আছে?)",
      ta: "உங்கள் தூக்கம் எப்படி இருக்கிறது? (மணிநேரம், தரம், தூக்கத்தில் பிரச்சனை?)",
      te: "మీ నిద్ర ఎలా ఉంటుంది? (గంటలు, నాణ్యత, నిద్ర సమస్యలు?)",
      mr: "तुमचा झोप कसा असतो? (तास, गुणवत्ता, झोपेत काही समस्या?)",
      gu: "તમારી ઊંઘ કેવી છે? (કલાક, ગુણવત્તા, ઊંઘમાં કોઈ સમસ્યા?)",
      kn: "ನಿಮ್ಮ ನಿದ್ರೆ ಹೇಗಿದೆ? (ಗಂಟೆಗಳು, ಗುಣಮಟ್ಟ, ನಿದ್ರೆಯ ಸಮಸ್ಯೆ?)",
      ml: "നിങ്ങളുടെ ഉറക്കം എങ്ങനെയാണ്? (മണിക്കൂറുകൾ, ഗുണം, ഉറക്ക പ്രശ്നം?)",
      pa: "ਤੁਹਾਡੀ ਨੀਂਦ ਕਿਹੋ ਜਿਹੀ ਹੈ? (ਘੰਟੇ, ਗੁਣਵੱਤਾ, ਨੀਂਦ ਵਿੱਚ ਕੋਈ ਸਮੱਸਿਆ?)",
      or: "ଆପଣଙ୍କ ନିଦ୍ରା କେମିତି? (ଘଣ୍ଟା, ମାନ, ନିଦ୍ରା ସମସ୍ୟା?)",
      as: "আপোনাৰ নিদা কেনেকৈ? (ঘণ্টা, মান, নিদাৰ সমস্যা?)",
    },
    answerType: "open",
    mapsToField: "sleepHistory",
    mapsToSection: "clinical",
  },
  {
    id: "sys-bowel",
    category: "personal_history",
    phase: "systematic",
    textByLanguage: {
      en: "How are your bowel movements? (Frequency, consistency, any issues?)",
      hi: "आपकी पेशाब और मल त्याग की आदत कैसी है? (आवृत्ति, बनावट, कोई समस्या?)",
      ur: "آپ کی مل_pfاعzl کی عادت کیسی ہے؟ (تعداد، ساخت، کوئی مسئلہ؟)",
      bn: "আপনার পায়খানার অবস্থা কেমন? (ঘনত্ব, গঠন, কোনো সমস্যা?)",
      ta: "உங்கள் மலம் கழிக்கும் பழக்கம் எப்படி இருக்கிறது? (அதிர்வெண், தன்மை, ஏதேனும் பிரச்சனை?)",
      te: "మీ మలవిసర్జన అలవాటు ఎలా ఉంటుంది? (పౌనఃపున్యం, స్థిరత్వం, సమస్యలు?)",
      mr: "तुमच्या आतड्याची हालत कशी आहे? (वारंवारता, स्थिरता, काही समस्या?)",
      gu: "તમારા આંતરડાની હાલત કેવી છે? (આવર્તન, સ્�િરતા, કોઈ સમસ્યા?)",
      kn: "ನಿಮ್ಮ ಮಲವಿಸರ್ಜನೆ ಹೇಗಿದೆ? (ಆವರ್ತನೆ, ಸ್ಥಿರತೆ, ಸಮಸ್ಯೆ?)",
      ml: "നിങ്ങളുടെ മലവിസർജ്ജന രീതി എങ്ങനെയാണ്? (ആവൃത്തി, സ്ഥിരത, പ്രശ്നം?)",
      pa: "ਤੁਹਾਡੇ ਪੇਚਿਸ਼ ਦੀ ਹਾਲਤ ਕਿਹੋ ਜਿਹੀ ਹੈ? (ਅਕਾਰ, ਸਥਿਰਤਾ, ਕੋਈ ਸਮੱਸਿਆ?)",
      or: "ଆପଣଙ୍କ ମଳତ୍ୟାଗ ଅବସ୍ଥା କେମିତି? (ଆବୃତ୍ତି, ସ୍ଥିରତା, ସମସ୍ୟା?)",
      as: "আপোনাৰ মলমূত্ৰ ত্যাগৰ অৱস্থা কেনেকৈ? (পুনৰাবৃত্তি, স্থিৰতা, সমস্যা?)",
    },
    answerType: "open",
    mapsToField: "bowelHistory",
    mapsToSection: "clinical",
  },
  // ---- AYURVEDIC ASSESSMENT ----
  {
    id: "ay-agni",
    category: "ayush_agni",
    phase: "ayurvedic",
    textByLanguage: {
      en: "How is your digestion (Agni)? Do you feel hungry at regular times? How do you feel after eating?",
      hi: "आपका पाचन (अग्नि) कैसा है? क्या आपको समय पर भूख लगती है? खाने के बाद कैसा लगता है?",
      ur: "آپ کا ہضم (اگنی) کیسا ہے؟ کیا آپ کو وقت پر بھوک لگتی ہے؟ کھانے کے بعد کیسا لگتا ہے؟",
      bn: "আপনার পাচন (অগ্নি) কেমন? নিয়মিত সময়ে ক্ষুধা লাগে? খেয়ে পরে কেমন লাগে?",
      ta: "உங்கள் செரிமானம் (அக்னி) எப்படி இருக்கிறது? சரியான நேரத்தில் பசி ஏற்படுமா? சாப்பிட்ட பிறகு எப்படி இருக்கும்?",
      te: "మీ జీర్ణక్రియ (అగ్ని) ఎలా ఉంటుంది? క్రమం తప్పకుండా ఆకలి వేస్తుందా? తిన్న తర్వాత ఎలా ఉంటుంది?",
      mr: "तुमचे पचन (अग्नि) कसे आहे? तुम्हाला वेळेवर भूक लागते का? जेवणानंतर कसे वाटते?",
      gu: "તમારું પાચન (અગ્નિ) કેવું છે? નિયમિત સમયે ભૂખ લાગે છે? ખાધા પછી કેવું લાગે છે?",
      kn: "ನಿಮ್ಮ ಜೀರ್ಣಕ್ರಿಯೆ (ಅಗ್ನಿ) ಹೇಗಿದೆ? ನಿಯಮಿತ ಸಮಯದಲ್ಲಿ ಹಸಿವು ಬರುತ್ತದೆಯೇ? ತಿಂದ ನಂತರ ಹೇಗನಿಸುತ್ತದೆ?",
      ml: "നിങ്ങളുടെ ദഹനം (അഗ്നി) എങ്ങനെയാണ്? കൃത്യസമയത്ത് വിശപ്പ് വരുമോ? കഴിച്ചതിനുശേഷം എങ്ങനെ തോന്നുന്നു?",
      pa: "ਤੁਹਾਡਾ ਪਾਚਨ (ਅੱਗਨੀ) ਕਿਹੋ ਜਿਹਾ ਹੈ? ਕੀ ਸਮੇਂ ਸਾਰ ਭੁੱਖ ਲੱਗਦੀ ਹੈ? ਖਾਣ ਤੋਂ ਬਾਅਦ ਕਿਹੋ ਜਿਹਾ ਲੱਗਦਾ ਹੈ?",
      or: "ଆପଣଙ୍କ ପାଚନ (ଅଗ୍ନି) କେମିତି? ନିୟମିତ ସମୟରେ ଭୋକ ଲାଗେ? ଖାଇବା ପରେ କେମିତି ଲାଗେ?",
      as: "আপোনাৰ পাচন (অগ্নি) কেনেকৈ? নিয়মীত সময়ত ক্ষুধা লাগে? খাই পৰা কেনেকৈ লাগে?",
    },
    answerType: "open",
    mapsToField: "agni",
    mapsToSection: "ayurvedic",
  },
  {
    id: "ay-koshtha",
    category: "ayush_koshtha",
    phase: "ayurvedic",
    textByLanguage: {
      en: "How would you describe your bowel nature (Koshtha)? Regular, constipated, or loose?",
      hi: "आप अपनी आंत की प्रकृति (कोष्ठ) कैसे वर्णित करेंगे? नियमित, कब्ज़, या ढीली?",
      ur: "آپ اپنی آنتوں کی قدرت (کوشتھ) کیسے بیان کریں گے؟ باقاعدہ، قبض، یا ڈھیلی؟",
      bn: "আপনার অন্ত্রের প্রকৃতি (কোষ্ঠ) কেমন বলবেন? নিয়মিত, কোষ্টক, নাকি শিথিল?",
      ta: "உங்கள் குடல் இயல்பு (கோஷ்டம்) எப்படி விவரிப்பீர்கள்? சீரானது, மலச்சிக்கல், அல்லது தளர்வானது?",
      te: "మీ ప్రేగు స్వభావాన్ని (కోష్ఠ) ఎలా వివరిస్తారు? క్రమబద్ధం, మలబద్ధత, లేదా విపరీతం?",
      mr: "तुमची आतड्यांची प्रकृती (कोष्ठ) कशी सांगाल? नियमित, कब्ज, किंवा ढीली?",
      gu: "તમારું આંતરડાનું સ્વભાવ (કોષ્ઠ) કેવું કહેશો? નિયમિત, કબજિયાત, કે ઢીલું?",
      kn: "ನಿಮ್ಮ ಕರುಳಿನ ಸ್ವಭಾವ (ಕೋಷ್ಠ) ಹೇಗೆ ವಿವರಿಸುತ್ತೀರಿ? ನಿಯಮಿತ, ಮಲಬದ್ಧತೆ, ಅಥವಾ ಸಡಿಲ?",
      ml: "നിങ്ങളുടെ കുടൽ സ്വഭാവം (കോഷ്ഠ) എങ്ങനെ വിവരിക്കും? കൃത്യമായ, മലബന്ധം, അല്ലെങ്കിൽ അയഞ്ഞ?",
      pa: "ਤੁਸੀਂ ਆਪਣੀ ਅੰਦਰੂਨੀ ਪ੍ਰਕਿਰਤੀ (ਕੋਸ਼ਠ) ਕਿਵੇਂ ਦੱਸੋਗੇ? ਨਿਯਮਤ, ਕਬਜ਼, ਜਾਂ ਢਿੱਲੀ?",
      or: "ଆପଣ ଆପଣଙ୍କ ଅନ୍ତର ସ୍ଵଭାବ (କୋଷ୍ଠ) କେମିତି ବର୍ଣ୍ଣନା କରିବେ? ନିୟମିତ, କୋଷ୍ଠ, ନା ଶିଥିଳ?",
      as: "আপোনাৰ অন্ত্ৰৰ প্ৰকৃতি (কোষ্ঠ) কেনেকৈ বৰ্ণনা কৰিব? নিয়মিত, কোষ্ট, নাইতা ঢিলা?",
    },
    answerType: "select",
    options: [
      { label: "Madhyama (Regular)", value: "madhyama" },
      { label: "Krura (Hard/Constipated)", value: "krura" },
      { label: "Mridu (Loose/Soft)", value: "mridu" },
      { label: "Not sure", value: "unsure" },
    ],
    mapsToField: "koshtha",
    mapsToSection: "ayurvedic",
  },
  {
    id: "ay-prakriti",
    category: "ayush_prakriti",
    phase: "ayurvedic",
    textByLanguage: {
      en: "Do you know your body constitution (Prakriti)? Which dosha do you identify with most?",
      hi: "क्या आप अपनी शारीरिक प्रकृति (प्रकृति) जानते हैं? आप किस दोष से सबसे अधिक संबंधित महसूस करते हैं?",
      ur: "کیا آپ اپنی جسمانی قدرت (پراکرتی) جانتے ہیں؟ آپ کس دورش سے سب سے زیادہ متعلق محسوس کرتے ہیں؟",
      bn: "আপনি আপনার শারীরিক প্রকৃতি (প্রকৃতি) জানেন? কোন দোষ দিয়ে আপনি সবচেয়ে বেশি পরিচিত?",
      ta: "உங்கள் உடல் இயல்பு (பிரகிருதி) தெரியுமா? எந்த தோஷத்துடன் அதிகம் தொடர்புபடுகிறீர்கள்?",
      te: "మీ శరీర స్వభావం (ప్రకృతి) తెలుసా? ఏ దోషంతో ఎక్కువగా సంబంధం ఉన్నట్లు భావిస్తారు?",
      mr: "तुम्हाला तुमची शारीरिक प्रकृती (प्रकृती) माहीत आहे का? तुम्हाला कोणत्या दोषाशी सर्वाधिक संबंध वाटतो?",
      gu: "તમે તમારી શારીરિક પ્રકૃતિ (પ્રકૃતિ) જાણો છો? તમે કયા દોષ સાથે સૌથી વધુ ઓળખો છો?",
      kn: "ನಿಮ್ಮ ದೇಹ ಪ್ರಕೃತಿ (ಪ್ರಕೃತಿ) ತಿಳಿದಿದೆಯೇ? ಯಾವ ದೋಷದೊಂದಿಗೆ ಹೆಚ್ಚು ಗುರುತಿಸುತ್ತೀರಿ?",
      ml: "നിങ്ങളുടെ ശരീര പ്രകൃതി (പ്രകൃതി) അറിയാമോ? ഏത് ദോഷവുമായി ഏറ്റവും കൂടുതൽ തിരിച്ചറിയുന്നു?",
      pa: "ਕੀ ਤੁਸੀਂ ਆਪਣੀ ਸਰੀਰ ਪ੍ਰਕ੍ਰਿਤੀ (ਪ੍ਰਕ੍ਰਿਤੀ) ਜਾਣਦੇ ਹੋ? ਤੁਸੀਂ ਕਿਸ ਦੋਸ਼ ਨਾਲ ਸਭ ਤੋਂ ਵੱਧ ਸੰਬੰਧਿਤ ਮਹਿਸੂਸ ਕਰਦੇ ਹੋ?",
      or: "ଆପଣ ଆପଣଙ୍କ ଶାରୀରିକ ପ୍ରକୃତି (ପ୍ରକୃତି) ଜାଣନ୍ତି କି? କେଉଁ ଦୋଷ ସହିତ ସବୁଠାରୁ ବେଶୀ ପରିଚିତ ଅନୁଭବ କରନ୍ତି?",
      as: "আপোনাৰ শাৰীৰিক প্ৰকৃতি (প্ৰকৃতি) চান নেকি? কোন দোষৰ লগত আপুনি আটাইতকৈ বেছি পৰিচিত অনুভৱ কৰে?",
    },
    answerType: "select",
    options: [
      { label: "Vata (Air + Space)", value: "vata" },
      { label: "Pitta (Fire + Water)", value: "pitta" },
      { label: "Kapha (Earth + Water)", value: "kapha" },
      { label: "Vata-Pitta", value: "vata_pitta" },
      { label: "Pitta-Kapha", value: "pitta_kapha" },
      { label: "Vata-Kapha", value: "vata_kapha" },
      { label: "Not sure / Never assessed", value: "unsure" },
    ],
    mapsToField: "prakriti",
    mapsToSection: "ayurvedic",
  },
  {
    id: "ay-nidana",
    category: "ayush_nidana",
    phase: "ayurvedic",
    textByLanguage: {
      en: "What do you think triggered or worsened this condition? (Diet, weather, stress, lifestyle?)",
      hi: "आपको क्या लगता है कि इस स्थिति को किसने ट्रिगर किया या बिगाड़ा? (आहार, मौसम, तनाव, जीवनशैली?)",
      ur: "آپ کو کیا لگتا ہے کہ اس حالت کو کس نے ٹرگر کیا یا خراب کیا؟ (خوراک، موسم، تناؤ، طرز زندگی؟)",
      bn: "আপনার মনে হয় কী এই অবস্থা কী ট্রিগার করেছে বা খারাপ করেছে? (খাদ্য, আবহাওয়া, স্ট্রেস, জীবনযাত্রা?)",
      ta: "இந்த நிலையை யார் தூண்டியது அல்லது மோசமாக்கியது என்று நீங்கள் நினைக்கிறீர்கள்? (உணவு, வானிலை, மன அழுத்தம், வாழ்க்கை முறை?)",
      te: "ఈ పరిస్థితిని ఎవరు ప్రేరేపించారు లేదా మరింత తీవ్రం చేశారు అని మీరు భావిస్తున్నారు? (ఆహారం, వాతావరణం, ఒత్తిడి, జీవనశైలి?)",
      mr: "तुम्हाला काय वाटते की या स्थितीला कोणी ट्रिगर केले किंवा वाईट केले? (आहार, हवामान, तणाव, जीवनशैली?)",
      gu: "તમને શું લાગે છે કે આ સ્થિતિને કોણે ટ્રિગર કરી કે ખરાબ કરી? (ખોરાક, હવામાન, તાણ, જીવનશૈલી?)",
      kn: "ಈ ಸ್ಥಿತಿಯನ್ನು ಯಾರು ಪ್ರೇರೇಪಿಸಿದರು ಅಥವಾ ಕೆಟ್ಟದಾಗಿಸಿದರು ಎಂದು ನೀವು ಭಾವಿಸುತ್ತೀರಿ? (ಆಹಾರ, ಹವಾಮಾನ, ಒತ್ತಡ, ಜೀವನಶೈಲಿ?)",
      ml: "ഈ അവസ്ഥയെ എന്ത് പ്രകോപിപ്പിച്ചു അല്ലെങ്കിൽ വഷളാക്കി എന്ന് തോന്നുന്നു? (ഭക്ഷണം, കാലാവസ്ഥ, സ്ട്രെസ്, ജീവിതശൈലി?)",
      pa: "ਤੁਹਾਨੂੰ ਕੀ ਲੱਗਦਾ ਹੈ ਕਿ ਇਸ ਹਾਲਤ ਨੂੰ ਕਿਸ ਨੇ ਟਰਿਗਰ ਕੀਤਾ ਜਾਂ ਵੱਧ ਬੁਰਾ ਬਣਾਇਆ? (ਆਹਾਰ, ਮੌਸਮ, ਤਣਾਅ, ਜੀਵਨ ਸ਼ੈਲੀ?)",
      or: "ଏହି ଅବସ୍ଥାକୁ କିଏ ଟ୍ରିଗର କଲା କିମ୍ବା ଖରାପ କଲା ବୋଲି ଆପଣ ମନେ କରୁଛନ୍ତି? (ଖାଦ୍ୟ, ପାଗ, ଚାପ, ଜୀବନଶୈଳୀ?)",
      as: "এই অৱস্থা কিয়ে ট্ৰিগাৰ কৰিল বা খৰাপ কৰিল আপুনি কি মনে কৰে? (আহাৰ, বতৰা, মানসিক চাপ, জীৱনশৈলী?)",
    },
    answerType: "open",
    mapsToField: "nidana",
    mapsToSection: "ayurvedic",
  },
  {
    id: "ay-ahara-vihara",
    category: "ayush_ahara_vihara",
    phase: "ayurvedic",
    textByLanguage: {
      en: "Describe your daily routine (Dinacharya). Wake time, meals, exercise, sleep schedule.",
      hi: "अपनी दैनिक दिनचर्या बताएं। उठने का समय, भोजन, व्यायाम, नींद का समय।",
      ur: "اپنی روزانہ روٹین بتائیں۔ اٹھنے کا وقت، کھانا، ورزش، سونے کا شیڈول۔",
      bn: "আপনার দৈনিক দিনচর্যা বলুন। ওঠার সময়, খাবার, ব্যায়াম, ঘুমের সময়সূচী।",
      ta: "உங்கள் தினசரி நடைமுறையை (தினசரியா) விவரிக்கவும். எழுந்திருக்கும் நேரம், உணவு, உடற்பயிற்சி, தூக்க அட்டவணை.",
      te: "మీ రోజువారీ దినచర్య (దినచర్య) గురించి చెప్పండి. లేచే సమయం, భోజనం, వ్యాయామం, నిద్ర షెడ్యూల్.",
      mr: "तुमची दैनिक दिनचर्या सांगा. उठण्याचा वेळ, जेवण, व्यायाम, झोपेचा वेळापत्रक.",
      gu: "તમારી દૈનિક દિનચર્યા જણાવો. ઊઠવાનો સમય, ખોરાક, કસરત, ઊંઘનો સમય.",
      kn: "ನಿಮ್ಮ ದೈನಂದಿನ ದಿನಚರ್ಯ ಹೇಳಿ. ಏಳುವ ಸಮಯ, ಊಟ, ವ್ಯಾಯಾಮ, ನಿದ್ರೆಯ ವೇಳಾಪಟ್ಟಿ.",
      ml: "നിങ്ങളുടെ ദൈനംദിന ദിനചര്യ (ദിനചര്യ) വിവരിക്കുക. ഉണരുന്ന സമയം, ഭക്ഷണം, വ്യായാമം, ഉറക്ക ഷെഡ്യൂൾ.",
      pa: "ਆਪਣੀ ਰੋਜ਼ਾਨਾ ਦਿਨਚਰ੍ਯਾ ਦੱਸੋ। ਉੱਣ ਦਾ ਸਮਾਂ, ਖਾਣਾ, ਕਸਰਤ, ਨੀਂਦ ਦਾ ਸਮਾਂ।",
      or: "ଆପଣଙ୍କ ଦୈନିକ ଦିନଚର୍ଯ୍ୟା କୁହ। ଉଠିବା ସମୟ, ଖାଇବା, ବ୍ୟାୟାମ, ନିଦ୍ରା ସୂଚୀ।",
      as: "আপোনাৰ দৈনিক দিনচৰ্যা কওক। উঠাৰ সময়, খাদ্য, ব্যায়াম, নিদাৰ সূচী।",
    },
    answerType: "open",
    mapsToField: "aharaVihara",
    mapsToSection: "ayurvedic",
  },
  {
    id: "ay-sattva",
    category: "ayush_sattva",
    phase: "ayurvedic",
    textByLanguage: {
      en: "How would you describe your mental constitution (Sattva)? Calm, anxious, or passionate?",
      hi: "आप अपनी मानसिक प्रकृति (सत्त्व) कैसे वर्णित करेंगे? शांत, चिंतित, या जोशपूर्ण?",
      ur: "آپ اپنی ذہینی قدرت (ستوہ) کیسے بیان کریں گے؟ پرسکون، پریشان، یا پرجوش؟",
      bn: "আপনার মানসিক প্রকৃতি (সত্ত্ব) কেমন বলবেন? শান্ত, উদ্বিগ্ন, নাকি উত্সাহী?",
      ta: "உங்கள் மன இயல்பு (சத்துவம்) எப்படி விவரிப்பீர்கள்? அமைதியானது, கவலையானது, அல்லது உற்சாகமானது?",
      te: "మీ మానసిక స్వభావాన్ని (సత్త్వ) ఎలా వివరిస్తారు? ప్రశాంతం, ఆందోళన, లేదా ఉత్సాహంగా?",
      mr: "तुमची मानसिक प्रकृती (सत्त्व) कशी सांगाल? शांत, चिंतित, किंवा उत्साही?",
      gu: "તમારું માનસિક સ્વભાવ (સત્ત્વ) કેવું કહેશો? શાંત, ચિંતિત, કે ઉत્સાહી?",
      kn: "ನಿಮ್ಮ ಮಾನಸಿಕ ಸ್ವಭಾವ (ಸತ್ತ್ವ) ಹೇಗೆ ವಿವರಿಸುತ್ತೀರಿ? ಶಾಂತ, ಚಿಂತಿತ, ಅಥವಾ ಉತ್ಸಾಹಿ?",
      ml: "നിങ്ങളുടെ മാനസിക സ്വഭാവം (സത്ത്വം) എങ്ങനെ വിവരിക്കും? ശാന്തം, ഉത്കണ്ഠ, അല്ലെങ്കിൽ ഉത്സാഹം?",
      pa: "ਤੁਸੀਂ ਆਪਣੀ ਮਾਨਸਿਕ ਪ੍ਰਕ੍ਰਿਤੀ (ਸੱਤਵ) ਕਿਵੇਂ ਦੱਸੋਗੇ? ਸ਼ਾਂਤ, ਚਿੰਤਿਤ, ਜਾਂ ਜੋਸ਼ੀਲੀ?",
      or: "ଆପଣ ଆପଣଙ୍କ ମାନସିକ ସ୍ଵଭାବ (ସତ୍ତ୍ୱ) କେମିତି ବର୍ଣ୍ଣନା କରିବେ? ଶାନ୍ତ, ଚିନ୍ତିତ, ନା ଉତ୍ସାହୀ?",
      as: "আপোনাৰ মানসিক প্ৰকৃতি (সত্ত্ব) কেনেকৈ বৰ্ণনা কৰিব? শান্ত, চিন্তিত, নাইতা উৎসাহী?",
    },
    answerType: "select",
    options: [
      { label: "Sattvic (Calm/Balanced)", value: "sattvic" },
      { label: "Rajasic (Active/Anxious)", value: "rajasic" },
      { label: "Tamasic (Dull/Lethargic)", value: "tamasic" },
      { label: "Not sure", value: "unsure" },
    ],
    mapsToField: "sattva",
    mapsToSection: "ayurvedic",
  },
  {
    id: "ay-vyayama",
    category: "ayush_vyayama_shakti",
    phase: "ayurvedic",
    textByLanguage: {
      en: "What is your exercise capacity (Vyayama Shakti)? How much physical activity can you do comfortably?",
      hi: "आपकी व्यायाम शक्ति कैसी है? आप कितनी शारीरिक गतिविधि आराम से कर सकते हैं?",
      ur: "آپ کی ورزش صلاحیت (ویام شکتی) کیسی ہے؟ آپ کتنا جسمانی حرکت آرام سے کر سکتے ہیں؟",
      bn: "আপনার ব্যায়াম ক্ষমতা (ব্যায়াম শক্তি) কেমন? কতটা শারীরিক কার্যকলাপ আরামে করতে পারেন?",
      ta: "உங்கள் உடற்பயிற்சி திறன் (வியாயம சக்தி) எப்படி? எவ்வளவு உடல் செயல்பாட்டை வசதியாக செய்ய முடியும்?",
      te: "మీ వ్యాయామ సామర్థ్యం (వ్యాయామ శక్తి) ఎలా ఉంటుంది? ఎంత శారీరక శ్రమను సౌకర్యంగా చేయగలరు?",
      mr: "तुमची व्यायाम शक्ती कशी आहे? तुम्ही किती शारीरिक हालचाल आरामातून करू शकता?",
      gu: "તમારી કસરત શક્તિ કેવી છે? તમે કેટલી શારીરિક પ્રવૃત્તિ આરામથી કરી શકો છો?",
      kn: "ನಿಮ್ಮ ವ್ಯಾಯಾಮ ಸಾಮರ್ಥ್ಯ (ವ್ಯಾಯಾಮ ಶಕ್ತಿ) ಹೇಗಿದೆ? ಎಷ್ಟು ದೈಹಿಕ ಚಟುವಟಿಕೆಯನ್ನು ಸೌಕರ್ಯವಾಗಿ ಮಾಡಬಹುದು?",
      ml: "നിങ്ങളുടെ വ്യായാം ശേഷി (വ്യായാമ ശക്തി) എങ്ങനെയാണ്? എത്ര ശാരീരിക പ്രവർത്തനം സൗകര്യപൂർവം ചെയ്യാൻ കഴിയും?",
      pa: "ਤੁਹਾਡੀ ਕਸਰਤ ਸਮਰੱਥਾ (ਵਿਯਾਮ ਸ਼ਕਤੀ) ਕਿਹੋ ਜਿਹੀ ਹੈ? ਤੁਸੀਂ ਕਿੰਨੀ ਸਰੀਰਕ ਗਤੀਵਿਧੀ ਆਰਾਮ ਨਾਲ ਕਰ ਸਕਦੇ ਹੋ?",
      or: "ଆପଣଙ୍କ ବ୍ୟାୟାମ କ୍ଷମତା (ବ୍ୟାୟାମ ଶକ୍ତି) କେମିତି? କେତେ ଶାରୀରିକ କାର୍ଯ୍ୟକଳାପ ଆରାମରେ କରିପାରିବେ?",
      as: "আপোনাৰ ব্যায়াম ক্ষমতা (ব্যায়াম শক্তি) কেনেকৈ? কিমান শাৰীৰিক কাৰ্যকলাপ আৰামে কৰিব পাৰে?",
    },
    answerType: "select",
    options: [
      { label: "High (Very Active)", value: "high" },
      { label: "Medium (Moderately Active)", value: "medium" },
      { label: "Low (Sedentary/Limited)", value: "low" },
    ],
    mapsToField: "vyayamaShakti",
    mapsToSection: "ayurvedic",
  },
];

// ---- MOCK AI ENGINE -----------------------------------------------

export const AyushAiEngine = {
  /** Get question by ID */
  getQuestion(id: string): QuestionDef | undefined {
    return QUESTION_BANK.find((q) => q.id === id);
  },

  /** Get all questions for a phase */
  getQuestionsForPhase(phase: QuestionDef["phase"]): QuestionDef[] {
    return QUESTION_BANK.filter((q) => q.phase === phase);
  },

  /** Get the initial question (chief complaint) */
  getInitialQuestion(lang: LanguageCode): QuestionDef {
    return QUESTION_BANK[0];
  },

  /** Adaptive next question selection based on answers already given */
  getNextQuestion(
    askedIds: string[],
    answers: Record<string, string>,
    lang: LanguageCode
  ): QuestionDef | null {
    // Phase progression: complaint -> hpi -> systematic -> ayurvedic
    const allPhases: QuestionDef["phase"][] = ["complaint", "hpi", "systematic", "ayurvedic"];

    for (const phase of allPhases) {
      const phaseQuestions = QUESTION_BANK.filter((q) => q.phase === phase);
      for (const q of phaseQuestions) {
        if (askedIds.includes(q.id)) continue;
        // Check relevance
        if (q.dependsOn && !answers[q.dependsOn]) continue;
        if (q.relevanceCheck && !q.relevanceCheck(answers)) continue;
        return q;
      }
    }
    return null;
  },

  /** Process a patient response and extract structured data */
  processResponse(
    question: QuestionDef,
    response: string,
    currentHistory: AyushClinicalHistory,
    currentAssessment: AyurvedicAssessment
  ): {
    updatedHistory: AyushClinicalHistory;
    updatedAssessment: AyurvedicAssessment;
    evidence: EvidenceItem;
    redFlag: AyushRedFlag | null;
    confidence: ConfidenceLevel;
    aiSummary: string;
  } {
    const responseLower = response.toLowerCase();
    let confidence: ConfidenceLevel = "medium";
    let updatedHistory = { ...currentHistory };
    const updatedAssessment = { ...currentAssessment };

    // Determine confidence based on response quality
    if (response.length > 50) confidence = "high";
    else if (response.length < 5) confidence = "low";

    // Extract and structure based on field mapping
    if (question.mapsToSection === "clinical") {
      const field = question.mapsToField as keyof AyushClinicalHistory;
      const evidence = makeEvidence(
        field,
        response,
        `Patient reported: ${response}`,
        "PATIENT_REPORTED"
      );
      updatedHistory = {
        ...updatedHistory,
        [field]: {
          value: response,
          source: "PATIENT_REPORTED",
          confidence,
          status: "ai_extracted",
          evidence: [...(updatedHistory[field]?.evidence || []), evidence],
          lastUpdated: now(),
          originalResponse: response,
        },
      };
    } else if (question.mapsToSection === "ayurvedic") {
      const field = question.mapsToField as keyof Omit<AyurvedicAssessment, "dashavidha">;
      if (field in updatedAssessment) {
        const evidence = makeEvidence(
          field,
          response,
          `Patient described: ${response}`,
          "PATIENT_REPORTED"
        );
        const rec = updatedAssessment as unknown as Record<string, AssessmentField>;
        rec[field] = {
          value: response,
          source: "PATIENT_REPORTED",
          confidence,
          status: "ai_extracted",
          evidence: [rec[field]?.evidence?.[0] || evidence],
          lastUpdated: now(),
          originalResponse: response,
        };
      }
      // Handle dashavidha sub-fields
      if (question.category.startsWith("ayush_")) {
        const dashKey = question.mapsToField;
        const dashavidhaKeys: Record<string, keyof DashavidhaAssessment> = {
          prakriti: "prakriti",
          sattva: "sattva",
          vyayamaShakti: "vyayamaShakti",
        };
        if (dashavidhaKeys[dashKey]) {
          const dk = dashavidhaKeys[dashKey];
          const evidence = makeEvidence(dk, response, `Patient assessment: ${response}`, "PATIENT_REPORTED");
          updatedAssessment.dashavidha = {
            ...updatedAssessment.dashavidha,
            [dk]: {
              value: response,
              source: "PATIENT_REPORTED",
              confidence,
              status: "ai_extracted",
              evidence: [evidence],
              lastUpdated: now(),
              originalResponse: response,
            },
          };
        }
      }
    }

    // Create evidence
    const evidence: EvidenceItem = makeEvidence(
      question.mapsToField,
      response,
      `Structured from patient response: "${response}"`,
      "PATIENT_REPORTED"
    );

    // Check red flags
    let redFlag: AyushRedFlag | null = null;
    if (question.safetyKeywords) {
      for (const kw of question.safetyKeywords) {
        if (responseLower.includes(kw.toLowerCase())) {
          const rule = RED_FLAG_RULES.find((r) =>
            r.keywords.some((rk) => responseLower.includes(rk.toLowerCase()) || kw.toLowerCase().includes(rk))
          );
          if (rule) {
            redFlag = {
              id: uid("rf"),
              rule: rule.rule,
              reason: rule.reason,
              level: rule.level,
              timestamp: now(),
              sourceFields: [question.category],
              patientResponse: response,
              status: "open",
            };
            break;
          }
        }
      }
    }
    // Also check response against all red flag rules
    if (!redFlag) {
      for (const rule of RED_FLAG_RULES) {
        if (rule.keywords.some((kw) => responseLower.includes(kw.toLowerCase()))) {
          redFlag = {
            id: uid("rf"),
            rule: rule.rule,
            reason: rule.reason,
            level: rule.level,
            timestamp: now(),
            sourceFields: [question.category],
            patientResponse: response,
            status: "open",
          };
          break;
        }
      }
    }

    // Generate AI summary for this response
    const aiSummary = `Extracted from "${question.category}": ${response}. Confidence: ${confidence}.`;

    return { updatedHistory, updatedAssessment, evidence, redFlag, confidence, aiSummary };
  },

  /** Calculate history completion percentage */
  calculateCompletion(
    history: AyushClinicalHistory,
    assessment: AyurvedicAssessment
  ): number {
    const clinicalFields = Object.values(history).filter(
      (f): f is AssessmentField => typeof f === "object" && f !== null && "value" in f
    );
    const ayushFields = [
      assessment.agni,
      assessment.koshtha,
      assessment.aharaVihara,
      assessment.nidana,
      ...Object.values(assessment.dashavidha),
    ];

    const total = clinicalFields.length + ayushFields.length;
    const filled = [
      ...clinicalFields.filter((f) => f.value && f.value.length > 0),
      ...ayushFields.filter((f) => f.value && f.value.length > 0),
    ].length;

    return Math.round((filled / total) * 100);
  },

  /** Generate physician-ready summary */
  generatePhysicianSummary(
    patientId: string,
    patientName: string,
    patientAge: number,
    patientGender: string,
    lang: LanguageCode,
    history: AyushClinicalHistory,
    assessment: AyurvedicAssessment,
    redFlags: AyushRedFlag[],
    turns: AyushConversationTurn[]
  ): AyushPhysicianSummary {
    const evidenceItems: SourceEvidence[] = [];
    // Collect all evidence from clinical history
    for (const [key, field] of Object.entries(history)) {
      if (typeof field === "object" && field !== null && "evidence" in field) {
        const f = field as AssessmentField;
        if (f.evidence?.length) {
          for (const ev of f.evidence) {
            evidenceItems.push({
              field: key,
              value: f.value,
              source: ev.sourceType === "PATIENT_REPORTED" ? "Patient Interview" : ev.sourceType,
              sourceType: ev.sourceType,
              confidence: ev.confidence === "high" ? 90 : ev.confidence === "medium" ? 70 : 40,
              status: f.status === "ai_extracted" ? "ai-generated" : "needs-verification",
            });
          }
        }
      }
    }
    // Collect ayurvedic evidence
    for (const [key, field] of Object.entries(assessment)) {
      if (key === "dashavidha") {
        for (const [dk, df] of Object.entries(assessment.dashavidha)) {
          if (typeof df === "object" && df !== null && "evidence" in df) {
            const f = df as AssessmentField;
            if (f.evidence?.length) {
              for (const ev of f.evidence) {
                evidenceItems.push({
                  field: `dashavidha.${dk}`,
                  value: f.value,
                  source: "Patient Interview",
                  sourceType: "PATIENT_REPORTED",
                  confidence: f.confidence === "high" ? 90 : f.confidence === "medium" ? 70 : 40,
                  status: "ai-generated",
                });
              }
            }
          }
        }
      } else if (typeof field === "object" && field !== null && "evidence" in field) {
        const f = field as AssessmentField;
        if (f.evidence?.length) {
          for (const ev of f.evidence) {
            evidenceItems.push({
              field: key,
              value: f.value,
              source: "Patient Interview",
              sourceType: "PATIENT_REPORTED",
              confidence: f.confidence === "high" ? 90 : f.confidence === "medium" ? 70 : 40,
              status: "ai-generated",
            });
          }
        }
      }
    }

    // Build AI summary text
    const parts: string[] = [];
    if (history.chiefComplaint.value) parts.push(`Chief Complaint: ${history.chiefComplaint.value}`);
    if (history.duration.value) parts.push(`Duration: ${history.duration.value}`);
    if (history.severity.value) parts.push(`Severity: ${history.severity.value}`);
    if (history.currentMedications.value) parts.push(`Medications: ${history.currentMedications.value}`);
    if (assessment.agni.value) parts.push(`Agni: ${assessment.agni.value}`);
    if (assessment.koshtha.value) parts.push(`Koshtha: ${assessment.koshtha.value}`);
    if (assessment.dashavidha.prakriti.value) parts.push(`Prakriti: ${assessment.dashavidha.prakriti.value}`);

    return {
      id: uid("sum"),
      patientId,
      patientName,
      patientAge,
      patientGender,
      generatedAt: now(),
      language: lang,
      clinicalHistory: history,
      ayurvedicAssessment: assessment,
      redFlags,
      aiSummaryText: parts.join(". ") + ".",
      sourceEvidence: evidenceItems,
      verificationStatus: "pending",
    };
  },

  /** Get localized question text */
  getLocalizedText(question: QuestionDef, lang: LanguageCode): string {
    return question.textByLanguage[lang] || question.textByLanguage.en || question.id;
  },

  /** Get localized options */
  getLocalizedOptions(
    question: QuestionDef,
    lang: LanguageCode
  ): { label: string; value: string }[] {
    if (!question.options) return [];
    return question.options.map((opt) => ({
      label: opt.labelByLanguage?.[lang] || opt.label,
      value: opt.value,
    }));
  },
};
