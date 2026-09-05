// ------------------------------------------------------------------
// CARELINK - Thor Page Details (bilingual knowledge base)
//
// Gives Thor complete, talking-point-rich knowledge of every app screen so
// he can narrate the full details of whichever page the user opens — not
// just its name. Content is provided in Hindi and English (the two primary
// narration languages); other app languages fall back to English, matching
// the existing mock/fallback pattern in the AI layer.
//
// The narration ends with "How can I help you?" (localized via `thor.askHelp`).
// ------------------------------------------------------------------

import type { View } from "@/store";

export interface ThorPageDetail {
  /** Short page name (used to greet before the points). */
  name: { en: string; hi: string };
  /** Talking points that fully describe the page contents. */
  points: { en: string[]; hi: string[] };
}

export const THOR_PAGE_DETAILS: Partial<Record<View, ThorPageDetail>> = {
  WELCOME: {
    name: { en: "Welcome", hi: "स्वागत" },
    points: {
      en: [
        "This is the CareLink welcome screen with the CareLink logo and tagline.",
        "In the middle you have two big login buttons: Patient Login and Doctor Login.",
        "Below them there is a row of three round buttons: Language, Accessibility, and Help.",
        "Tap Patient Login to continue as a patient, or Doctor Login to continue as a doctor.",
      ],
      hi: [
        "यह CareLink का स्वागत स्क्रीन है, जिसमें CareLink लोगो और टैगलाइन है।",
        "बीच में दो बड़े लॉगिन बटन हैं: मरीज़ लॉगिन और डॉक्टर लॉगिन।",
        "उनके नीचे तीन गोल बटनों की कतार है: भाषा, एक्सेसिबिलिटी और मदद।",
        "मरीज़ के रूप में आगे बढ़ने के लिए मरीज़ लॉगिन दबाएँ, या डॉक्टर के लिए डॉक्टर लॉगिन दबाएँ।",
      ],
    },
  },
  ROLE_SELECT: {
    name: { en: "Choose your role", hi: "अपनी भूमिका चुनें" },
    points: {
      en: [
        "Here you choose whether you are a Patient or a Doctor.",
        "The Patient card gives access to health records, appointments, documents and AI health.",
        "The Doctor card manages the patient queue, clinical reviews, notes and prescriptions.",
        "At the bottom there is a Language button to change the app language.",
      ],
      hi: [
        "यहाँ आप चुनते हैं कि आप मरीज़ हैं या डॉक्टर।",
        "मरीज़ कार्ड में स्वास्थ्य रिकॉर्ड, अपॉइंटमेंट, दस्तावेज़ और AI स्वास्थ्य की सुविधा है।",
        "डॉक्टर कार्ड में मरीज़ कतार, क्लिनिकल समीक्षा, नोट्स और नुस्ख़े हैं।",
        "नीचे ऐप की भाषा बदलने के लिए भाषा बटन है।",
      ],
    },
  },
  LOGIN: {
    name: { en: "Patient Login", hi: "मरीज़ लॉगिन" },
    points: {
      en: [
        "This is the Patient Login page for CareLink.",
        "Enter your 10-digit mobile number and press Continue to receive an OTP.",
        "There are two quick options below the button: Login with Mobile and Login with Aadhaar.",
        "There is also a Returning User option to sign in with your Patient ID and password.",
        "At the very bottom you will see the terms and conditions hint.",
      ],
      hi: [
        "यह CareLink का मरीज़ लॉगिन पेज है।",
        "अपना 10 अंकों का मोबाइल नंबर डालें और OTP पाने के लिए जारी रखें दबाएँ।",
        "बटन के नीचे दो विकल्प हैं: मोबाइल से लॉगिन और आधार से लॉगिन।",
        "वापसी उपयोगकर्ता विकल्प से आप मरीज़ ID और पासवर्ड से साइन इन कर सकते हैं।",
        "सबसे नीचे नियम और शर्तों की जानकारी दिखती है।",
      ],
    },
  },
  DOCTOR_LOGIN: {
    name: { en: "Doctor Login", hi: "डॉक्टर लॉगिन" },
    points: {
      en: [
        "This is the Doctor Login page for CareLink.",
        "Enter your doctor ID / mobile and password to sign in to the doctor portal.",
        "Use it to access your patient queue, clinical reviews, notes and prescriptions.",
      ],
      hi: [
        "यह CareLink का डॉक्टर लॉगिन पेज है।",
        "डॉक्टर पोर्टल में साइन इन करने के लिए अपनी डॉक्टर ID या मोबाइल और पासवर्ड डालें।",
        "इससे आप मरीज़ कतार, क्लिनिकल समीक्षा, नोट्स और नुस्ख़े देख सकते हैं।",
      ],
    },
  },
  OTP: {
    name: { en: "Verify OTP", hi: "OTP सत्यापित करें" },
    points: {
      en: [
        "This is the OTP verification step for CareLink login.",
        "Enter the six-digit code sent to your mobile number in the boxes on screen.",
        "Once entered correctly, you will move to completing your profile.",
      ],
      hi: [
        "यह CareLink लॉगिन का OTP सत्यापन चरण है।",
        "आपके मोबाइल नंबर पर भेजा गया छह अंकों का कोड स्क्रीन के बॉक्स में डालें।",
        "सही दर्ज करने पर आप अपनी प्रोफ़ाइल पूरी करने के लिए आगे बढ़ेंगे।",
      ],
    },
  },
  REGISTER: {
    name: { en: "Your Profile", hi: "आपकी प्रोफ़ाइल" },
    points: {
      en: [
        "This is the profile registration form for a new patient.",
        "Fill in your name, date of birth, gender, blood group and other health details.",
        "Your details are saved only on this device and connect to your CareLink profile.",
      ],
      hi: [
        "यह नए मरीज़ के लिए प्रोफ़ाइल पंजीकरण फ़ॉर्म है।",
        "अपना नाम, जन्म तिथि, लिंग, ब्लड ग्रुप और अन्य स्वास्थ्य विवरण भरें।",
        "आपकी जानकारी केवल इस डिवाइस पर सहेजी जाती है और आपकी CareLink प्रोफ़ाइल से जुड़ती है।",
      ],
    },
  },
  DOCTOR_REGISTER: {
    name: { en: "Doctor Registration", hi: "डॉक्टर पंजीकरण" },
    points: {
      en: [
        "This is the doctor registration form for the doctor portal.",
        "Add your name, registration number, speciality and practice details.",
        "Once saved, you can access the doctor dashboard and patient queue.",
      ],
      hi: [
        "यह डॉक्टर पोर्टल के लिए डॉक्टर पंजीकरण फ़ॉर्म है।",
        "अपना नाम, पंजीकरण संख्या, विशेषज्ञता और अभ्यास विवरण जोड़ें।",
        "सहेजने के बाद आप डॉक्टर डैशबोर्ड और मरीज़ कतार देख सकते हैं।",
      ],
    },
  },
  LANGUAGE: {
    name: { en: "Choose language", hi: "भाषा चुनें" },
    points: {
      en: [
        "This is the language selection screen.",
        "CareLink supports 13 Indian languages including English, Hindi, Urdu, Bengali, Tamil and more.",
        "Select the language you are most comfortable with; the whole app will switch to it.",
      ],
      hi: [
        "यह भाषा चयन स्क्रीन है।",
        "CareLink 13 भारतीय भाषाओं में उपलब्ध है, जिसमें अंग्रेज़ी, हिंदी, उर्दू, बंगाली, तमिल आदि शामिल हैं।",
        "जिस भाषा में आप सहज हैं उसे चुनें; पूरा ऐप उसी भाषा में बदल जाएगा।",
      ],
    },
  },
  ACCESSIBILITY: {
    name: { en: "Accessibility", hi: "एक्सेसिबिलिटी" },
    points: {
      en: [
        "This is the Accessibility settings screen.",
        "You can enable reduced motion to tone down animations.",
        "High-contrast mode and large text make the app easier to read.",
        "Audio-guided mode lets the app speak information aloud to you.",
      ],
      hi: [
        "यह एक्सेसिबिलिटी सेटिंग्स स्क्रीन है।",
        "एनिमेशन कम करने के लिए आप रियुस्ड मोशन चालू कर सकते हैं।",
        "हाई-कॉन्ट्रास्ट मोड और बड़ा टेक्स्ट ऐप को पढ़ने में आसान बनाते हैं।",
        "ऑडियो गाइडेड मोड ऐप को जानकारी आवाज़ में बोलने देता है।",
      ],
    },
  },
  THEME: {
    name: { en: "Theme", hi: "थीम" },
    points: {
      en: [
        "This is the theme selection screen.",
        "Choose from light, dark, black and several accent color themes.",
        "Your selected theme applies across the whole app instantly.",
      ],
      hi: [
        "यह थीम चयन स्क्रीन है।",
        "लाइट, डार्क, ब्लैक और कई रंगीन थीम में से चुनें।",
        "चुनी गई थीम तुरंत पूरे ऐप में लागू होती है।",
      ],
    },
  },
  HELP: {
    name: { en: "Help", hi: "मदद" },
    points: {
      en: [
        "This is the Help screen.",
        "You can read how to use CareLink, common questions and support information.",
        "A built-in help assistant is also available to answer your questions.",
      ],
      hi: [
        "यह मदद स्क्रीन है।",
        "यहाँ CareLink उपयोग, सामान्य प्रश्न और सहायता की जानकारी मिलती है।",
        "आपके प्रश्नों का उत्तर देने के लिए एक सहायक भी उपलब्ध है।",
      ],
    },
  },
  AI_ASSISTANT: {
    name: { en: "AI Assistant", hi: "AI सहायक" },
    points: {
      en: [
        "This is the CareLink AI startup assistant.",
        "It helps you set up the app and guides you step by step.",
        "You can type or speak your questions and the assistant replies in your language.",
      ],
      hi: [
        "यह CareLink AI स्टार्टअप सहायक है।",
        "यह ऐप सेट करने में मदद करता है और कदम-दर-कदम मार्गदर्शन करता है।",
        "आप अपने प्रश्न टाइप या बोल सकते हैं और सहायक आपकी भाषा में उत्तर देता है।",
      ],
    },
  },
  PATIENT_HOME: {
    name: { en: "Patient Home", hi: "मरीज़ मुखपृष्ठ" },
    points: {
      en: [
        "This is your patient home dashboard.",
        "At the top you have a health snapshot showing your blood group, allergies and latest visit.",
        "Below, quick categories let you jump to Medical History, Timeline, Medications, Allergies, Vaccinations, Appointments, Prescriptions, Lab Reports and Documents.",
        "There is also an ABHA Health ID, Insurance, Family Health, AYUSH History, AI Guidance, Steps, Sleep and Nutrition section.",
        "Use the bottom navigation or the menu button to move around easily.",
      ],
      hi: [
        "यह आपका मरीज़ होम डैशबोर्ड है।",
        "ऊपर स्वास्थ्य स्नैपशॉट में ब्लड ग्रुप, एलर्जी और पिछली मुलाक़ात दिखती है।",
        "नीचे मेडिकल हिस्ट्री, टाइमलाइन, दवाइयाँ, एलर्जी, टीके, अपॉइंटमेंट, नुस्ख़े, लैब रिपोर्ट और दस्तावेज़ के विकल्प हैं।",
        "ABHA हेल्थ ID, बीमा, पारिवारिक स्वास्थ्य, आयुष इतिहास, AI मार्गदर्शन, कदम, नींद और पोषण भी हैं।",
        "नीचे की नेविगेशन या मेनू बटन से आसानी से घूमें।",
      ],
    },
  },
  PATIENT_PROFILE: {
    name: { en: "Your Profile", hi: "आपकी प्रोफ़ाइल" },
    points: {
      en: [
        "This is your personal profile page.",
        "View and edit your name, contact details, blood group and health information.",
        "Your Aadhaar link and ABHA Health ID status are shown here.",
      ],
      hi: [
        "यह आपका व्यक्तिगत प्रोफ़ाइल पेज है।",
        "अपना नाम, संपर्क विवरण, ब्लड ग्रुप और स्वास्थ्य जानकारी देखें और बदलें।",
        "यहाँ आपकी आधार लिंक और ABHA हेल्थ ID की स्थिति दिखती है।",
      ],
    },
  },
  PATIENT_SETTINGS: {
    name: { en: "Settings", hi: "सेटिंग्स" },
    points: {
      en: [
        "This is the Settings page.",
        "Change app language, theme, accessibility and audio guidance from here.",
        "You can also manage privacy and security options like the app PIN lock.",
      ],
      hi: [
        "यह सेटिंग्स पेज है।",
        "यहाँ से ऐप भाषा, थीम, एक्सेसिबिलिटी और ऑडियो मार्गदर्शन बदलें।",
        "आप ऐप PIN लॉक जैसे गोपनीयता और सुरक्षा विकल्प भी प्रबंधित कर सकते हैं।",
      ],
    },
  },
  PATIENT_HISTORY: {
    name: { en: "Medical History", hi: "मेडिकल हिस्ट्री" },
    points: {
      en: [
        "This is your Medical History page.",
        "It lists your past health conditions and clinical history.",
        "Everything here is entered by you or your doctor and kept only in the app.",
      ],
      hi: [
        "यह आपका मेडिकल हिस्ट्री पेज है।",
        "इसमें आपके पिछले स्वास्थ्य और नैदानिक इतिहास की सूची है।",
        "यहाँ सब कुछ आपके या आपके डॉक्टर के द्वारा दर्ज रहता है और केवल ऐप में रखा जाता है।",
      ],
    },
  },
  PATIENT_TIMELINE: {
    name: { en: "Timeline", hi: "टाइमलाइन" },
    points: {
      en: [
        "This is your health Timeline.",
        "It shows important moments of your health journey in date order.",
        "New events appear here as your care progresses.",
      ],
      hi: [
        "यह आपका स्वास्थ्य टाइमलाइन है।",
        "इसमें आपकी स्वास्थ्य यात्रा के महत्वपूर्ण क्षण तारीख़ के क्रम में दिखते हैं।",
        "जैसे-जैसे आपकी देखभाल आगे बढ़ती है, नई घटनाएँ यहाँ जुड़ती हैं।",
      ],
    },
  },
  PATIENT_DOCUMENTS: {
    name: { en: "Documents", hi: "दस्तावेज़" },
    points: {
      en: [
        "This is your Documents vault.",
        "Upload and view reports, prescriptions and health documents here.",
        "There is also a scanning option to read text from document photos.",
      ],
      hi: [
        "यह आपका दस्तावेज़ भंडार है।",
        "यहाँ रिपोर्ट, नुस्ख़े और स्वास्थ्य दस्तावेज़ अपलोड करें और देखें।",
        "दस्तावेज़ की फ़ोटो से पाठ पढ़ने के लिए स्कैनिंग विकल्प भी है।",
      ],
    },
  },
  PATIENT_OCR: {
    name: { en: "Scan & Read Document", hi: "दस्तावेज़ स्कैन करें" },
    points: {
      en: [
        "This page scans a document photo and reads the text from it.",
        "Upload an image of a report or prescription to extract its contents.",
        "Review the extracted text before saving it to your documents.",
      ],
      hi: [
        "यह पेज दस्तावेज़ की फ़ोटो स्कैन कर उसका पाठ पढ़ता है।",
        "रिपोर्ट या नुस्ख़े की तस्वीर अपलोड करें, उसमें से जानकारी निकाले।",
        "सहेजने से पहले निकाले गए पाठ की समीक्षा करें।",
      ],
    },
  },
  PATIENT_MEDICATIONS: {
    name: { en: "Medications", hi: "दवाइयाँ" },
    points: {
      en: [
        "This is your Medications page.",
        "Add and manage all the medicines you currently take.",
        "Each record keeps the medicine name, dose and schedule that you enter.",
      ],
      hi: [
        "यह आपकी दवाइयों का पेज है।",
        "अपनी सभी चालू दवाइयाँ यहाँ जोड़ें और प्रबंधित करें।",
        "हर रिकॉर्ड में दवा का नाम, मात्रा और समय रहता है।",
      ],
    },
  },
  PATIENT_ALLERGIES: {
    name: { en: "Allergies", hi: "एलर्जी" },
    points: {
      en: [
        "This page records your allergies.",
        "Add any drug, food or environmental substances you are allergic to.",
        "This information stays only in your app and can be shown to your doctor.",
      ],
      hi: [
        "यह पेज आपकी एलर्जी दर्ज करता है।",
        "जिन दवाओं, खाद्य या पर्यावरणीय चीज़ों से एलर्जी है उन्हें जोड़ें।",
        "यह जानकारी केवल ऐप में रहती है और डॉक्टर को दिखाई जा सकती है।",
      ],
    },
  },
  PATIENT_FAMILY: {
    name: { en: "Family Health", hi: "पारिवारिक स्वास्थ्य" },
    points: {
      en: [
        "This page manages your family's health records.",
        "Add family members and their health details in one place.",
        "It helps you keep the whole family's care organised.",
      ],
      hi: [
        "यह पेज आपके परिवार के स्वास्थ्य रिकॉर्ड प्रबंधित करता है।",
        "परिवार के सदस्यों और उनके स्वास्थ्य विवरण एक ही जगह जोड़ें।",
        "इससे पूरे परिवार की देखभाल व्यवस्थित रहती है।",
      ],
    },
  },
  PATIENT_ABHA: {
    name: { en: "ABHA Health ID", hi: "ABHA हेल्थ ID" },
    points: {
      en: [
        "This is your ABHA (Ayushman Bharat Health Account) page.",
        "It shows your ABHA reference and linked status.",
        "You can use it to manage your national digital health identity.",
      ],
      hi: [
        "यह आपका ABHA (आयुष्मान भारत स्वास्थ्य खाता) पेज है।",
        "इसमें आपका ABHA संदर्भ और लिंक स्थिति दिखती है।",
        "आप इससे अपनी राष्ट्रीय डिजिटल स्वास्थ्य पहचान प्रबंधित कर सकते हैं।",
      ],
    },
  },
  PATIENT_INSURANCE: {
    name: { en: "Insurance", hi: "बीमा" },
    points: {
      en: [
        "This page stores your insurance policies.",
        "Add policy number, provider and coverage details.",
        "Keep all your health insurance documents together in one place.",
      ],
      hi: [
        "यह पेज आपकी बीमा पॉलिसियाँ सहेजता है।",
        "पॉलिसी नंबर, कंपनी और कवरेज विवरण जोड़ें।",
        "अपने सभी स्वास्थ्य बीमा दस्तावेज़ एक ही जगह रखें।",
      ],
    },
  },
  PATIENT_VACCINATION: {
    name: { en: "Vaccinations", hi: "टीकाकरण" },
    points: {
      en: [
        "This page records your vaccinations.",
        "Add each vaccine with its date and dose details.",
        "Keep your immunisation history up to date here.",
      ],
      hi: [
        "यह पेज आपके टीकाकरण दर्ज करता है।",
        "हर टीका उसकी तारीख़ और मात्रा के साथ जोड़ें।",
        "अपना टीकाकरण इतिहास यहाँ अपडेट रखें।",
      ],
    },
  },
  PATIENT_APPOINTMENTS: {
    name: { en: "Appointments", hi: "अपॉइंटमेंट" },
    points: {
      en: [
        "This is your Appointments page.",
        "Book new appointments and view your upcoming visits.",
        "Previous and completed appointments are also listed here.",
      ],
      hi: [
        "यह आपका अपॉइंटमेंट पेज है।",
        "नए अपॉइंटमेंट बुक करें और आगामी मुलाक़ातें देखें।",
        "पिछले और पूरे हुए अपॉइंटमेंट भी यहाँ सूचीबद्ध हैं।",
      ],
    },
  },
  PATIENT_AI: {
    name: { en: "AI Guidance", hi: "AI मार्गदर्शन" },
    points: {
      en: [
        "This is the CareLink AI health guidance page.",
        "Ask general questions about wellness, lifestyle and health habits.",
        "The AI gives educational information only and never diagnoses.",
        "For personal medical advice, always consult a qualified doctor.",
      ],
      hi: [
        "यह CareLink AI स्वास्थ्य मार्गदर्शन पेज है।",
        "वेलनेस, जीवनशैली और स्वास्थ्य आदतों के बारे में सामान्य प्रश्न पूछें।",
        "AI केवल शैक्षिक जानकारी देता है और कभी निदान नहीं करता।",
        "व्यक्तिगत चिकित्सा सलाह के लिए हमेशा किसी योग्य डॉक्टर से मिलें।",
      ],
    },
  },
  PATIENT_INTAKE: {
    name: { en: "Quick Check", hi: "त्वरित जाँच" },
    points: {
      en: [
        "This is the Quick Check intake flow.",
        "It takes a guided health history by asking questions one by one.",
        "You can answer by voice or by typing, in your preferred language.",
      ],
      hi: [
        "यह त्वरित जाँच इंटेक फ़्लो है।",
        "यह एक-एक करके सवाल पूछकर निर्देशित स्वास्थ्य इतिहास लेता है।",
        "आप आवाज़ से या टाइप करके, अपनी भाषा में उत्तर दे सकते हैं।",
      ],
    },
  },
  PATIENT_WELLNESS: {
    name: { en: "Wellness", hi: "वेलनेस" },
    points: {
      en: [
        "This is the Wellness page.",
        "It provides general health-habit and lifestyle guidance.",
        "Keep your daily wellness routines tracked here.",
      ],
      hi: [
        "यह वेलनेस पेज है।",
        "यह सामान्य स्वास्थ्य आदतों और जीवनशैली का मार्गदर्शन देता है।",
        "अपनी दैनिक वेलनेस दिनचर्या यहाँ ट्रैक करें।",
      ],
    },
  },
  PATIENT_STEPS: {
    name: { en: "Steps", hi: "कदम" },
    points: {
      en: [
        "This page tracks your daily steps.",
        "See your step count and activity progress.",
        "Use it to stay active and reach your daily movement goals.",
      ],
      hi: [
        "यह पेज आपके दैनिक कदम ट्रैक करता है।",
        "अपने कदमों की संख्या और गतिविधि प्रगति देखें।",
        "सक्रिय रहने और दैनिक लक्ष्य तक पहुँचने के लिए इसका उपयोग करें।",
      ],
    },
  },
  PATIENT_SLEEP: {
    name: { en: "Sleep", hi: "नींद" },
    points: {
      en: [
        "This page tracks your sleep.",
        "Log your sleep hours and view your rest patterns.",
        "Good sleep keeps your health and energy strong.",
      ],
      hi: [
        "यह पेज आपकी नींद ट्रैक करता है।",
        "अपनी नींद के घंटे दर्ज करें और आराम का पैटर्न देखें।",
        "अच्छी नींद आपके स्वास्थ्य और ऊर्जा को मजबूत रखती है।",
      ],
    },
  },
  PATIENT_GUIDANCE: {
    name: { en: "Health Guidance", hi: "स्वास्थ्य मार्गदर्शन" },
    points: {
      en: [
        "This page gives you general health guidance.",
        "It shares educational tips about staying healthy.",
        "Remember to consult a doctor for personal medical advice.",
      ],
      hi: [
        "यह पेज आपको सामान्य स्वास्थ्य मार्गदर्शन देता है।",
        "इसमें स्वस्थ रहने के शैक्षिक सुझाव हैं।",
        "व्यक्तिगत चिकित्सा सलाह के लिए डॉक्टर से मिलना याद रखें।",
      ],
    },
  },
  PATIENT_NUTRITION: {
    name: { en: "Nutrition", hi: "पोषण" },
    points: {
      en: [
        "This is the Nutrition page.",
        "Track your meals and get diet suggestions.",
        "Balanced nutrition keeps your body strong and healthy.",
      ],
      hi: [
        "यह पोषण पेज है।",
        "अपने भोजन को ट्रैक करें और आहार सुझाव पाएँ।",
        "संतुलित पोषण आपके शरीर को मजबूत और स्वस्थ रखता है।",
      ],
    },
  },
  PATIENT_LAB: {
    name: { en: "Lab Reports", hi: "लैब रिपोर्ट" },
    points: {
      en: [
        "This page stores your lab test reports.",
        "View your test results and their dates.",
        "Keep your laboratory history complete and organised.",
      ],
      hi: [
        "यह पेज आपकी लैब परीक्षण रिपोर्ट सहेजता है।",
        "अपने परीक्षण परिणाम और तारीख़ें देखें।",
        "अपना प्रयोगशाला इतिहास पूर्ण और व्यवस्थित रखें।",
      ],
    },
  },
  NOTIFICATION_CENTER: {
    name: { en: "Notifications", hi: "सूचनाएँ" },
    points: {
      en: [
        "This is your Notification Center.",
        "It shows alerts about appointments, documents, sharing and reminders.",
        "You can mark notifications as read or manage your preferences.",
      ],
      hi: [
        "यह आपका नोटिफिकेशन केंद्र है।",
        "इसमें अपॉइंटमेंट, दस्तावेज़, साझाकरण और रिमाइंडर की सूचनाएँ आती हैं।",
        "आप सूचनाएँ पढ़ी हुई चिह्नित कर सकते हैं या वरीयताएँ प्रबंधित कर सकते हैं।",
      ],
    },
  },
  PATIENT_AYUSH: {
    name: { en: "AYUSH History", hi: "आयुष इतिहास" },
    points: {
      en: [
        "This is the AYUSH Intelligence page.",
        "It covers Ayurveda, Yoga, Unani, Siddha and Homoeopathy.",
        "You can start a guided AYUSH consultation or view previous visit summaries.",
      ],
      hi: [
        "यह आयुष इंटेलिजेंस पेज है।",
        "इसमें आयुर्वेद, योग, यूनानी, सिद्ध और होम्योपैथी शामिल हैं।",
        "आप निर्देशित आयुष परामर्श शुरू कर सकते हैं या पिछली मुलाक़ातों के सारांश देख सकते हैं।",
      ],
    },
  },
  PATIENT_AYUSH_INTERVIEW: {
    name: { en: "AYUSH Interview", hi: "आयुष साक्षात्कार" },
    points: {
      en: [
        "This is the guided AYUSH consultation interview.",
        "Answer questions step by step about your health and lifestyle.",
        "You can respond by voice or typing in your language.",
      ],
      hi: [
        "यह निर्देशित आयुष परामर्श साक्षात्कार है।",
        "अपने स्वास्थ्य और जीवनशैली के बारे में कदम-दर-कदम सवालों के उत्तर दें।",
        "आप अपनी भाषा में आवाज़ या टाइप से उत्तर दे सकते हैं।",
      ],
    },
  },
  PATIENT_AYUSH_SUMMARY: {
    name: { en: "AYUSH Summary", hi: "आयुष सारांश" },
    points: {
      en: [
        "This page shows your AYUSH consultation summary.",
        "Review the captured health details before sharing with the doctor.",
        "It presents the AYUSH practitioner a complete picture of your health.",
      ],
      hi: [
        "यह पेज आपका आयुष परामर्श सारांश दिखाता है।",
        "डॉक्टर से साझा करने से पहले दर्ज स्वास्थ्य विवरण की समीक्षा करें।",
        "यह आयुष चिकित्सक को आपके स्वास्थ्य की पूरी तस्वीर देता है।",
      ],
    },
  },
  DOCTOR_HOME: {
    name: { en: "Doctor Home", hi: "डॉक्टर मुखपृष्ठ" },
    points: {
      en: [
        "This is the doctor dashboard.",
        "It shows your patient queue, priority alerts and today's workload.",
        "From here you can open patient reviews, cases, notes, prescriptions and follow-ups.",
      ],
      hi: [
        "यह डॉक्टर डैशबोर्ड है।",
        "इसमें मरीज़ कतार, प्राथमिकता अलर्ट और आज का काम दिखता है।",
        "यहाँ से आप मरीज़ समीक्षा, केस, नोट्स, नुस्ख़े और फॉलो-अप खोल सकते हैं।",
      ],
    },
  },
  DOCTOR_SETTINGS: {
    name: { en: "Doctor Settings", hi: "डॉक्टर सेटिंग्स" },
    points: {
      en: [
        "This is the doctor settings page.",
        "Manage your profile, language and app preferences.",
        "Your practice details stay saved in the doctor portal.",
      ],
      hi: [
        "यह डॉक्टर सेटिंग्स पेज है।",
        "अपनी प्रोफ़ाइल, भाषा और ऐप वरीयताएँ प्रबंधित करें।",
        "आपके अभ्यास विवरण डॉक्टर पोर्टल में सहेजे रहते हैं।",
      ],
    },
  },
  DOCTOR_QUEUE: {
    name: { en: "Patient Queue", hi: "मरीज़ कतार" },
    points: {
      en: [
        "This is your patient queue.",
        "It lists patients waiting for your consultation.",
        "Tap a patient to open their full clinical record.",
      ],
      hi: [
        "यह आपकी मरीज़ कतार है।",
        "इसमें आपके परामर्श की प्रतीक्षा कर रहे मरीज़ों की सूची है।",
        "किसी मरीज़ पर टैप करने से उसका पूरा नैदानिक रिकॉर्ड खुलता है।",
      ],
    },
  },
  DOCTOR_PRIORITY: {
    name: { en: "Priority Queue", hi: "प्राथमिकता कतार" },
    points: {
      en: [
        "This page highlights your priority patients.",
        "Urgent or high-priority cases appear here first.",
        "Attend to these patients before the regular queue.",
      ],
      hi: [
        "यह पेज आपके प्राथमिकता वाले मरीज़ों को उजागर करता है।",
        "तत्काल या उच्च-प्राथमिकता वाले मामले पहले यहाँ दिखते हैं।",
        "सामान्य कतार से पहले इन मरीज़ों पर ध्यान दें।",
      ],
    },
  },
  DOCTOR_PATIENT: {
    name: { en: "Patient Review", hi: "मरीज़ समीक्षा" },
    points: {
      en: [
        "This is a patient's full clinical review.",
        "See their history, medications, notes and prescriptions.",
        "Use it to make your clinical decisions and record care.",
      ],
      hi: [
        "यह एक मरीज़ का पूरा नैदानिक समीक्षा पेज है।",
        "उनका इतिहास, दवाइयाँ, नोट्स और नुस्ख़े देखें।",
        "इससे अपने नैदानिक निर्णय लें और देखभाल दर्ज करें।",
      ],
    },
  },
  DOCTOR_CASES: {
    name: { en: "Cases", hi: "केस" },
    points: {
      en: [
        "This page lists patient cases captured through intake.",
        "Each case shows the captured health history and status.",
        "Open a case to review and update the patient's care.",
      ],
      hi: [
        "यह पेज इंटेक द्वारा दर्ज मरीज़ केस सूचीबद्ध करता है।",
        "हर केस में दर्ज स्वास्थ्य इतिहास और स्थिति दिखती है।",
        "समीक्षा करने और मरीज़ की देखभाल अपडेट करने के लिए केस खोलें।",
      ],
    },
  },
  DOCTOR_NOTES: {
    name: { en: "Clinical Notes", hi: "क्लिनिकल नोट्स" },
    points: {
      en: [
        "This page is for writing clinical notes.",
        "Record your observations for each patient.",
        "Notes are saved with the patient's record in the portal.",
      ],
      hi: [
        "यह पेज क्लिनिकल नोट्स लिखने के लिए है।",
        "हर मरीज़ के लिए अपनी टिप्पणियाँ दर्ज करें।",
        "नोट्स पोर्टल में मरीज़ के रिकॉर्ड के साथ सहेजे जाते हैं।",
      ],
    },
  },
  DOCTOR_PRESCRIPTIONS: {
    name: { en: "Prescriptions", hi: "नुस्ख़े" },
    points: {
      en: [
        "This page manages patient prescriptions.",
        "Draft medicines and dosage instructions for your patients.",
        "Prescriptions attach to the patient's record for safe follow-up.",
      ],
      hi: [
        "यह पेज मरीज़ों के नुस्ख़े प्रबंधित करता है।",
        "अपने मरीज़ों के लिए दवाइयाँ और मात्रा निर्देश तैयार करें।",
        "नुस्ख़े मरीज़ के रिकॉर्ड से जुड़ते हैं ताकि फॉलो-अप सुरक्षित रहे।",
      ],
    },
  },
  DOCTOR_FOLLOWUPS: {
    name: { en: "Follow-ups", hi: "फॉलो-अप" },
    points: {
      en: [
        "This page tracks patient follow-ups.",
        "Schedule and review follow-up visits for your patients.",
        "It helps you keep every patient's care on track.",
      ],
      hi: [
        "यह पेज मरीज़ों के फॉलो-अप ट्रैक करता है।",
        "अपने मरीज़ों के लिए फॉलो-अप मुलाक़ातें तय करें और समीक्षा करें।",
        "इससे हर मरीज़ की देखभाल सही दिशा में बनी रहती है।",
      ],
    },
  },
  DOCTOR_CONSULTATION: {
    name: { en: "Consultation", hi: "परामर्श" },
    points: {
      en: [
        "This is the active consultation screen.",
        "Work on a patient's case with notes and decisions in one place.",
        "Finalize the consultation when your review is complete.",
      ],
      hi: [
        "यह सक्रिय परामर्श स्क्रीन है।",
        "एक ही जगह नोट्स और निर्णय के साथ मरीज़ के केस पर काम करें।",
        "समीक्षा पूरी होने पर परामर्श समाप्त करें।",
      ],
    },
  },
  DOCTOR_CLINICAL: {
    name: { en: "Clinical Intelligence", hi: "क्लिनिकल इंटेलिजेंस" },
    points: {
      en: [
        "This page shows captured clinical case intelligence.",
        "Review the patient's structured health history and summary.",
        "It presents everything your doctor needs in one place.",
      ],
      hi: [
        "यह पेज दर्ज नैदानिक केस इंटेलिजेंस दिखाता है।",
        "मरीज़ के संरचित स्वास्थ्य इतिहास और सारांश की समीक्षा करें।",
        "यह डॉक्टर के लिए सब कुछ एक ही स्थान पर प्रस्तुत करता है।",
      ],
    },
  },
  DOCTOR_AYUSH_REVIEW: {
    name: { en: "AYUSH Review", hi: "आयुष समीक्षा" },
    points: {
      en: [
        "This page lets doctors review AYUSH consultations.",
        "Verify the captured summary before approval.",
        "Approved summaries give the patient a complete AYUSH picture.",
      ],
      hi: [
        "यह पेज डॉक्टरों को आयुष परामर्श की समीक्षा करने देता है।",
        "अनुमोदन से पहले दर्ज सारांश की पुष्टि करें।",
        "अनुमोदित सारांश मरीज़ को आयुष की पूरी तस्वीर देते हैं।",
      ],
    },
  },
  HOSPITAL_HOME: {
    name: { en: "Hospital Home", hi: "अस्पताल मुखपृष्ठ" },
    points: {
      en: [
        "This is the hospital operations dashboard.",
        "Register new patients from this screen.",
        "Manage lab reports and scan prescriptions from here.",
      ],
      hi: [
        "यह अस्पताल संचालन डैशबोर्ड है।",
        "इस स्क्रीन से नए मरीज़ पंजीकृत करें।",
        "यहाँ से लैब रिपोर्ट और नुस्ख़े स्कैन प्रबंधित करें।",
      ],
    },
  },
  REGISTER_PATIENT: {
    name: { en: "Register Patient", hi: "मरीज़ पंजीकरण" },
    points: {
      en: [
        "This page registers a new patient in the hospital system.",
        "Fill in the patient's details to create their record.",
        "Once saved, the patient appears in the hospital flow.",
      ],
      hi: [
        "यह पेज अस्पताल प्रणाली में नए मरीज़ का पंजीकरण करता है।",
        "मरीज़ का रिकॉर्ड बनाने के लिए विवरण भरें।",
        "सहेजने के बाद मरीज़ अस्पताल प्रवाह में दिखता है।",
      ],
    },
  },
  LAB_REPORTS: {
    name: { en: "Lab Reports", hi: "लैब रिपोर्ट" },
    points: {
      en: [
        "This page manages laboratory test reports.",
        "Record and view patient lab results.",
        "Keep the hospital's lab data complete and accessible.",
      ],
      hi: [
        "यह पेज प्रयोगशाला परीक्षण रिपोर्ट प्रबंधित करता है।",
        "मरीज़ों के लैब परिणाम दर्ज करें और देखें।",
        "अस्पताल का लैब डेटा पूर्ण और सुलभ रखें।",
      ],
    },
  },
  SCAN_PRESCRIPTION: {
    name: { en: "Scan Prescription", hi: "नुस्ख़ा स्कैन" },
    points: {
      en: [
        "This page scans a printed prescription.",
        "Upload a prescription photo to read its text.",
        "Review the extracted medicines before saving.",
      ],
      hi: [
        "यह पेज छपे हुए नुस्ख़े को स्कैन करता है।",
        "नुस्ख़े की फ़ोटो अपलोड कर उसका पाठ पढ़ें।",
        "सहेजने से पहले निकाली गई दवाइयाँ देखें।",
      ],
    },
  },
  INTAKE_HOME: {
    name: { en: "Intake Start", hi: "इंटेक प्रारंभ" },
    points: {
      en: [
        "This is the Care Link intake portal start screen.",
        "Begin a guided session to capture a patient's health story.",
        "The flow supports voice or typed answers in any language.",
      ],
      hi: [
        "यह Care Link इंटेक पोर्टल की प्रारंभिक स्क्रीन है।",
        "मरीज़ की स्वास्थ्य कहानी दर्ज करने के लिए निर्देशित सत्र शुरू करें।",
        "यह आवाज़ या टाइप हर भाषा में उत्तर सपोर्ट करता है।",
      ],
    },
  },
  INTAKE_IDENTIFY: {
    name: { en: "Identify Patient", hi: "मरीज़ की पहचान" },
    points: {
      en: [
        "Here you identify who is being registered — self or family.",
        "Tell the intake what relation the patient is to you.",
        "This links the session to the right person.",
      ],
      hi: [
        "यहाँ आप बताते हैं कि किसका पंजीकरण हो रहा है — स्वयं या परिवार।",
        "इंटेक को बताएँ कि मरीज़ आपसे क्या संबंध है।",
        "इससे सत्र सही व्यक्ति से जुड़ता है।",
      ],
    },
  },
  INTAKE_CONSENT: {
    name: { en: "Consent", hi: "सहमति" },
    points: {
      en: [
        "This step asks for the patient's consent.",
        "Review what will be captured in the session.",
        "Consent is recorded before any history is taken.",
      ],
      hi: [
        "यह चरण मरीज़ की सहमति माँगता है।",
        "समीक्षा करें कि सत्र में क्या दर्ज होगा।",
        "इतिहास लेने से पहले सहमति दर्ज की जाती है।",
      ],
    },
  },
  INTAKE_HISTORY: {
    name: { en: "Health History", hi: "स्वास्थ्य इतिहास" },
    points: {
      en: [
        "This is the guided history-taking screen.",
        "Answer chief complaint, duration and symptom questions.",
        "You can speak answers with voice or type them.",
      ],
      hi: [
        "यह निर्देशित इतिहास संग्रह स्क्रीन है।",
        "मुख्य शिकायत, अवधि और लक्षणों के सवालों के उत्तर दें।",
        "आप आवाज़ से बोलकर या टाइप करके उत्तर दे सकते हैं।",
      ],
    },
  },
  INTAKE_DOCUMENTS: {
    name: { en: "Documents", hi: "दस्तावेज़" },
    points: {
      en: [
        "This step collects supporting documents.",
        "Upload reports or prescriptions for the intake record.",
        "Captured documents attach to the patient's session.",
      ],
      hi: [
        "यह चरण सहायक दस्तावेज़ एकत्र करता है।",
        "इंटेक रिकॉर्ड के लिए रिपोर्ट या नुस्ख़े अपलोड करें।",
        "दस्तावेज़ मरीज़ के सत्र से जुड़ते हैं।",
      ],
    },
  },
  INTAKE_SUMMARY: {
    name: { en: "Intake Summary", hi: "इंटेक सारांश" },
    points: {
      en: [
        "This page shows the physician summary of the intake.",
        "Review the captured history before completion.",
        "The summary is ready for the treating doctor.",
      ],
      hi: [
        "यह पेज इंटेक का चिकित्सक सारांश दिखाता है।",
        "पूर्ण करने से पहले दर्ज इतिहास की समीक्षा करें।",
        "सारांश उपचार करने वाले डॉक्टर के लिए तैयार है।",
      ],
    },
  },
  INTAKE_COMPLETE: {
    name: { en: "Intake Complete", hi: "इंटेक पूर्ण" },
    points: {
      en: [
        "This is the intake completion screen.",
        "Your health story has been captured successfully.",
        "The doctor's team now has the full picture to help you.",
      ],
      hi: [
        "यह इंटेक पूर्णता स्क्रीन है।",
        "आपकी स्वास्थ्य कहानी सफलतापूर्वक दर्ज हो गई है।",
        "डॉक्टर की टीम के पास अब आपकी मदद के लिए पूरी जानकारी है।",
      ],
    },
  },
};

/** Fallback when a view has no dedicated detail entry. */
const FALLBACK_NAME = { en: "this page", hi: "यह पेज" };

/**
 * Build Thor's full narration for a page: greet + complete points + the
 * closing "How can I help you?" question, localised.
 *
 * @param view the current app view
 * @param language app language code
 * @param askHelp localized closing question (from i18n `thor.askHelp`)
 */
export function buildThorNarration(view: View, language: string, askHelp: string): string {
  const detail = THOR_PAGE_DETAILS[view];
  const isHindi = language === "hi";
  if (!detail) {
    return `${FALLBACK_NAME[isHindi ? "hi" : "en"]}. ${askHelp}`;
  }
  const name = isHindi ? detail.name.hi : detail.name.en;
  const points = isHindi ? detail.points.hi : detail.points.en;
  const body = points.length ? points.join(" ") : "";
  return `${name}. ${body} ${askHelp}`.replace(/\s+/g, " ").trim();
}