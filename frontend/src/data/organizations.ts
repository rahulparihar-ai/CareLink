// ------------------------------------------------------------------
// CARELINK - Practice Type & Workplace / Organization options (Demo)
//
// These are clearly-labelled DEMO organizations for the frontend.
// They are informational only and are NOT presented as verified real
// registries/hospitals. Real affiliation/verification requires backend
// integration with authentic registries and organization directories.
// ------------------------------------------------------------------

export type PracticeType = "government" | "private" | "clinic" | "independent";

export const PRACTICE_TYPES: {
  value: PracticeType;
  label: string;
  desc: string;
}[] = [
  { value: "government", label: "Government Hospital", desc: "Public/state health facility" },
  { value: "private", label: "Private Hospital", desc: "Registered private hospital" },
  { value: "clinic", label: "Clinic", desc: "Own clinic or existing clinic" },
  { value: "independent", label: "Independent Practice", desc: "No hospital or clinic affiliation" },
];

// Demo organization directory. Not a verified registry.
export const DEMO_ORGANIZATIONS: {
  id: string;
  name: string;
  city: string;
  type: "government" | "private" | "clinic";
}[] = [
  { id: "org-1", name: "Demo District Hospital", city: "Jaipur", type: "government" },
  { id: "org-2", name: "Demo Civil Hospital", city: "Lucknow", type: "government" },
  { id: "org-3", name: "Demo Community Health Centre", city: "Nagpur", type: "government" },
  { id: "org-4", name: "Demo Apollo Residency", city: "Delhi", type: "private" },
  { id: "org-5", name: "Demo Shanti Multispecialty", city: "Mumbai", type: "private" },
  { id: "org-6", name: "Demo City Care Hospital", city: "Pune", type: "private" },
  { id: "org-7", name: "Demo Wellness Clinic", city: "Bengaluru", type: "clinic" },
  { id: "org-8", name: "Demo First Care Clinic", city: "Hyderabad", type: "clinic" },
];

// Demo professional verification outcome. In production this is issued by a
// registry adapter (NMC/state council / AYUSH). Here it is a labelled demo.
export const PROFESSIONAL_VERIFICATION_MODE = "demo";

export function verificationLabel(status: "verified" | "pending" | "failed"): string {
  return status === "verified" ? "Demo Verified" : "Verification Pending";
}