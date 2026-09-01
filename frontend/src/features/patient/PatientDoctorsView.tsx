"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Star } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { demoDoctors } from "@/data/demo";

export function PatientDoctorsView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const [search, setSearch] = useState("");

  const filtered = demoDoctors.filter((d) =>
    (d.name + d.specialty).toLowerCase().includes(search.toLowerCase())
  );

  const select = (id: string) => {
    // Track selected doctor via patientId slot is wrong; just navigate
    setSelectedPatientId(null);
    setView("PATIENT_DOCTOR_PROFILE");
    sessionStorage.setItem("carelink-selected-doctor", id);
  };

  return (
    <PatientPageShell title="Doctors" currentTab="PATIENT_HOME" onBack={() => setView("PATIENT_HOME")}>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctors, specialties…"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring"
        />
      </div>

      <div className="space-y-2.5">
        {filtered.map((d, i) => (
          <motion.button key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.99 }} onClick={() => select(d.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {d.name.replace("Dr. ", "").charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.specialty} · {d.experience}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex items-center gap-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Star className="size-3.5 fill-amber-500 text-amber-500" /> {d.rating}
                </span>
                <span className="text-[10px] text-muted-foreground">{d.languages.join(", ")}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge variant="success" dot>{d.availability.includes("today") ? "Available" : d.availability}</StatusBadge>
              <span className="text-[10px] text-muted-foreground">{d.hospital}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </PatientPageShell>
  );
}
