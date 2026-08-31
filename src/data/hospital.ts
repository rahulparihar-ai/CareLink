// ------------------------------------------------------------------
// CARELINK - Hospital (Swasthya-style) Demo Data
// Department-wise consultant schedules, tariffs & duty roster.
// All values are synthetic for demo purposes.
// ------------------------------------------------------------------

export interface Consultant {
  id: string;
  name: string;
  designation: string; // e.g. Professor, Assoc. Professor
  qualification: string;
  schedule: { day: string; time: string; opd: boolean }[];
}

export interface Department {
  id: string;
  name: string;
  short: string;
  consultants: Consultant[];
  tariffs: { service: string; ots: string; general: string; note?: string }[];
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weeklySchedule(startIdx: number): Consultant["schedule"] {
  return days.map((day, i) => ({
    day,
    time: `${9 + ((i + startIdx) % 4)}:00 AM – ${2 + ((i + startIdx) % 3)}:00 PM`,
    opd: (i + startIdx) % 3 !== 0,
  }));
}

export const hospitalDepartments: Department[] = [
  {
    id: "dept-gen",
    name: "General Medicine",
    short: "MED",
    consultants: [
      { id: "c1", name: "Dr. Arjun Mehta", designation: "Professor", qualification: "MD (Medicine)", schedule: weeklySchedule(0) },
      { id: "c2", name: "Dr. Neha Kapoor", designation: "Assoc. Professor", qualification: "MD, DM (Cardio)", schedule: weeklySchedule(2) },
    ],
    tariffs: [
      { service: "New Patient Registration", ots: "₹10", general: "₹10" },
      { service: "OPD Consultation", ots: "₹40", general: "₹30" },
      { service: "Follow-up Visit", ots: "₹40", general: "₹30" },
      { service: "ECG", ots: "₹50", general: "₹50" },
      { service: "Blood Sugar (Fasting)", ots: "₹25", general: "₹25" },
    ],
  },
  {
    id: "dept-card",
    name: "Cardiology",
    short: "CAR",
    consultants: [
      { id: "c3", name: "Dr. Neha Kapoor", designation: "Professor", qualification: "MD, DM (Cardiology)", schedule: weeklySchedule(1) },
    ],
    tariffs: [
      { service: "OPD Consultation", ots: "₹60", general: "₹40" },
      { service: "Echocardiography", ots: "₹900", general: "₹500" },
      { service: "Treadmill Test (TMT)", ots: "₹1,200", general: "₹650" },
      { service: "ECG", ots: "₹60", general: "₹50" },
    ],
  },
  {
    id: "dept-derm",
    name: "Dermatology",
    short: "DER",
    consultants: [
      { id: "c4", name: "Dr. Suresh Iyer", designation: "Professor", qualification: "MD (Dermatology)", schedule: weeklySchedule(3) },
    ],
    tariffs: [
      { service: "OPD Consultation", ots: "₹40", general: "₹30" },
      { service: "Skin Biopsy", ots: "₹300", general: "₹180" },
      { service: "Patch Testing", ots: "₹650", general: "₹400" },
    ],
  },
  {
    id: "dept-ped",
    name: "Pediatrics",
    short: "PED",
    consultants: [
      { id: "c5", name: "Dr. Anita Rao", designation: "Professor", qualification: "MD (Pediatrics)", schedule: weeklySchedule(2) },
    ],
    tariffs: [
      { service: "OPD Consultation", ots: "₹40", general: "₹30" },
      { service: "Neonatal Care (Day)", ots: "₹1,500", general: "₹800" },
      { service: "Vaccination (Basic)", ots: "₹100", general: "₹60" },
    ],
  },
  {
    id: "dept-ortho",
    name: "Orthopedics",
    short: "ORT",
    consultants: [
      { id: "c6", name: "Dr. Rohan Gupta", designation: "Assoc. Professor", qualification: "MS (Orthopedics)", schedule: weeklySchedule(4) },
    ],
    tariffs: [
      { service: "OPD Consultation", ots: "₹50", general: "₹35" },
      { service: "X-Ray (Single View)", ots: "₹120", general: "₹80" },
      { service: "Plaster Application", ots: "₹200", general: "₹120" },
    ],
  },
  {
    id: "dept-gyne",
    name: "Gynecology",
    short: "GYN",
    consultants: [
      { id: "c7", name: "Dr. Priya Nair", designation: "Professor", qualification: "MS (OBG)", schedule: weeklySchedule(1) },
    ],
    tariffs: [
      { service: "OPD Consultation", ots: "₹50", general: "₹35" },
      { service: "Ultrasound (Obstetric)", ots: "₹450", general: "₹300" },
      { service: "PAP Smear", ots: "₹250", general: "₹150" },
    ],
  },
];

// Duty roster enquiry (doctor on duty per dept per day)
export const dutyRoster = days.map((day) => ({
  day,
  entries: hospitalDepartments.slice(0, 5).map((dept, i) => ({
    dept: dept.name,
    doctor: day === "Sat" ? `${dept.consultants[0].name} (On-call)` : `${dept.consultants[i % dept.consultants.length].name}`,
    shift: day === "Sun" ? "Holiday" : day === "Sat" ? "On-call" : "AM 9–5",
    emergency: day === "Sun" ? "Emergency" : "Emergency available",
  })),
}));
