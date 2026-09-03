// ------------------------------------------------------------------
// CARELINK SWASTHYA - Brand & Constants
// ------------------------------------------------------------------

export const BRAND = {
  name: "CareLink",
  displayName: "CARELINK",
  tagline: "Connecting Care, Enriching Lives",
  storageKey: "carelink-storage",
  demoOtp: "123456",
  facility: "CareLink Health Network",
  hospitalShort: "GMH",
  hospitalFull: "Govt. Model Hospital",
  hospitalTagline: "Swasthya",
} as const;

// Demo/synthetic data is only ever surfaced when the app is explicitly running
// in development with the demo flag enabled. In production (or when the flag is
// not set) no mock healthcare data reaches a user's screen.
export function isDemoMode(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_DOCTOR_DEMO_CASES === "1"
  );
}

export function generatePatientId(): string {
  return `CL-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
}

export function generateShareCode(): string {
  return `CL-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function uid(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}
