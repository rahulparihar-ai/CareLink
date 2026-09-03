// ------------------------------------------------------------------
// CARELINK - Reference / UI option data
// Only reference option lists (departments, time slots, symptom chips,
// body areas). No fabricated patient or personal medical data.
// ------------------------------------------------------------------

export const departments: { name: string; icon: string }[] = [
  { name: "General Medicine", icon: "stethoscope" },
  { name: "Cardiology", icon: "heart" },
  { name: "Dermatology", icon: "sparkles" },
  { name: "Pediatrics", icon: "baby" },
  { name: "Orthopedics", icon: "bone" },
  { name: "Gynecology", icon: "flask" },
  { name: "ENT", icon: "ear" },
  { name: "Ophthalmology", icon: "eye" },
  { name: "Neurology", icon: "brain" },
  { name: "Psychiatry", icon: "smile" },
];

export const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM",
  "05:00 PM", "05:30 PM",
];

export const symptomChips = [
  "Fever", "Cough", "Headache", "Stomach pain", "Dizziness",
  "Chest pain", "Nausea", "Fatigue", "Breathlessness", "Body ache",
  "Skin rash", "Sore throat", "Joint pain", "Palpitations", "Constipation",
];

export const bodyAreas = [
  "Head", "Eyes", "Ears", "Throat", "Chest", "Abdomen",
  "Upper back", "Lower back", "Arms", "Hands", "Legs", "Feet",
];
