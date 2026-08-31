"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Stethoscope, Camera, AlertTriangle, Loader2, Clock,
} from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";

const demoPrescriptions = [
  { id: "rp1", patient: "Sunita Devi", age: 62, gender: "Female", date: "Today · 09:18", source: "Aadhaar QR", status: "new", medicines: ["Furosemide 40 mg — Once daily"], complaint: "Shortness of breath" },
  { id: "rp2", patient: "Amit Verma", age: 29, gender: "Male", date: "Today · 09:25", source: "Self", status: "new", medicines: ["Pantoprazole 40 mg — Once daily", "Antacid PRN"], complaint: "Stomach pain for 3 days" },
  { id: "rp3", patient: "Ravi Kumar", age: 47, gender: "Male", date: "Yesterday", source: "Aadhaar QR", status: "reviewed", medicines: ["Aspirin 75 mg — Once daily", "Atorvastatin 10 mg — Nightly"], complaint: "Chest pain radiating to left arm" },
  { id: "rp4", patient: "Kiran Patel", age: 38, gender: "Male", date: "Aug 29", source: "Self", status: "reviewed", medicines: ["Metformin 500 mg — Twice daily"], complaint: "Diabetic review" },
];

export function DoctorDeskView() {
  const setView = useAppStore((s) => s.setView);
  const role = useAppStore((s) => s.role);
  const setRole = useAppStore((s) => s.setRole);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<"all" | "new" | "reviewed">("all");

  const filtered = demoPrescriptions.filter((p) => filter === "all" || p.status === filter);
  const newCount = demoPrescriptions.filter((p) => p.status === "new").length;

  if (role !== "DOCTOR") {
    return (
      <DoctorPageShell title="Doctor Desk" currentTab="DOCTOR_HOME" onBack={() => setView("HOSPITAL_HOME")}>
        <div className="flex flex-col items-center py-16 text-center">
          <Stethoscope className="size-12 text-muted-foreground" />
          <p className="mt-3 text-sm font-semibold">Doctor access required</p>
          <p className="mt-1 text-xs text-muted-foreground">Doctor Desk is for verified clinicians only.</p>
          <button onClick={() => { setRole("DOCTOR"); setView("DOCTOR_HOME"); }}
            className="mt-4 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Enter as Doctor</button>
        </div>
      </DoctorPageShell>
    );
  }

  const handleUpload = async () => {
    setUploading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setUploading(false);
  };

  return (
    <DoctorPageShell title="Doctor Desk" currentTab="DOCTOR_HOME" sub={`${newCount} new prescription(s)`}
      onBack={() => setView("DOCTOR_HOME")}
      right={<StatusBadge variant="warning" dot>{newCount} new</StatusBadge>}>

      {/* Upload prescription */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <p className="mb-2 text-sm font-semibold">Upload patient prescription</p>
        <p className="mb-3 text-xs text-muted-foreground">Scan or upload a prescription image from a patient.</p>
        <Button onClick={handleUpload} disabled={uploading} className="w-full">
          {uploading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Scanning…</> : <><Camera className="mr-2 size-4" /> Scan prescription image</>}
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="mb-3 flex gap-1.5 rounded-xl bg-muted/70 p-1">
        {(["all", "new", "reviewed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium capitalize transition-colors ${filter === f ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Prescription list */}
      <div className="space-y-2.5">
        {filtered.map((p, i) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 card-soft">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {p.patient.split(" ").map((w) => w[0]).slice(0, 2).join("")}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate font-semibold">{p.patient}</p>
                  <span className="text-xs text-muted-foreground">· {p.age} · {p.gender[0]}</span>
                </div>
                <p className="text-xs text-muted-foreground">{p.complaint}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> {p.date} · {p.source}</p>
              </div>
              <StatusBadge variant={p.status === "new" ? "warning" : "success"} dot>{p.status}</StatusBadge>
            </div>
            <ul className="mt-2.5 space-y-1 border-t border-border pt-2.5">
              {p.medicines.map((m, j) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />{m}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary" />
        Doctor Desk is a simulated view. No real prescription images are stored or transmitted.
      </div>
    </DoctorPageShell>
  );
}
