// ------------------------------------------------------------------
// CARELINK - Healthcare Professional Types & Credential Schemas
//
// Profession selection drives which professional-registration / HPR
// fields the doctor fills in (spec §1, §4). These are DEMO options and
// credential fields; they are NOT a real NMC/ABDM/HPR registry.
// Verification adapters (see /services) can be wired later without
// changing this UI model.
// ------------------------------------------------------------------

export type ProfessionType = "medical-doctor" | "nurse" | "allied" | "other";

export interface ProfessionTypeMeta {
  value: ProfessionType;
  label: string;
  shortLabel: string;
  desc: string;
}

// Professional type options shown in Step 1 (spec §1).
export const PROFESSION_TYPES: ProfessionTypeMeta[] = [
  { value: "medical-doctor", label: "Medical Doctor", shortLabel: "Doctor", desc: "MBBS / MD specialisation" },
  { value: "nurse", label: "Nurse", shortLabel: "Nurse", desc: "Registered nurse / nurse practitioner" },
  { value: "allied", label: "Allied Healthcare Professional", shortLabel: "Allied", desc: "Physio, pharmacy, lab, radiology etc." },
  { value: "other", label: "Other Healthcare Professional", shortLabel: "Other", desc: "Other regulated or non-regulated roles" },
];

// Fields relevant to each profession for Step 4 (spec §4). Field labels use
// i18n keys; each profession can show/hide/re-order them.
export interface CredentialField {
  key: "council" | "registrationNumber" | "registrationDate" | "qualification" | "specialization" | "experience";
}

export const CREDENTIAL_FIELDS: Record<ProfessionType, CredentialField["key"][]> = {
  // Medical Doctor (spec §4): State Medical Council, Reg/IMR number, date,
  // qualification, specialization, experience.
  "medical-doctor": [
    "council",
    "registrationNumber",
    "registrationDate",
    "qualification",
    "specialization",
    "experience",
  ],
  // Nurse: nursing council + registration + qualification.
  nurse: ["council", "registrationNumber", "qualification", "specialization", "experience"],
  // Allied health professional: professional council / HPR + registration.
  allied: ["council", "registrationNumber", "qualification", "specialization", "experience"],
  // Other healthcare professional: generic professional registration / HPR.
  other: ["council", "registrationNumber", "qualification", "specialization", "experience"],
};

// Default council options per profession (editable; not a real registry).
export const COUNCILS: Record<ProfessionType, string[]> = {
  "medical-doctor": ["State Medical Council", "NMC", "State Reg. Council"],
  nurse: ["Nursing Council", "State Nursing Council"],
  allied: ["Allied Health Professional Council", "State AHP Council"],
  other: ["Hospital In-House Registration", "Professional Body"],
};

const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra",
  "Odisha", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export const INDIAN_STATES = STATES;