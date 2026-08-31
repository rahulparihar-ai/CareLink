// ------------------------------------------------------------------
// CARELINK SWASTHYA - Brand & Constants
// ------------------------------------------------------------------

export const BRAND = {
  name: "CareLink",
  displayName: "CARELINK",
  tagline: "Connecting Care, Enriching Lives",
  storageKey: "carelink-storage",
  demoOtp: "123456",
  demoPatientId: "CL-2026-000124",
  facility: "CareLink Health Network",
  hospitalShort: "GMH",
  hospitalFull: "Govt. Model Hospital",
  hospitalTagline: "Swasthya",
} as const;

export function generatePatientId(): string {
  return `CL-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

export function generateShareCode(): string {
  return `CL-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
