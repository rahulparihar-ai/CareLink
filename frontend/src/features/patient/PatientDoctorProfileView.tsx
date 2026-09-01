"use client";

import { motion } from "framer-motion";
import { Star, MapPin, Languages, CalendarPlus, ChevronLeft, Clock } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { demoDoctors } from "@/data/demo";

export function PatientDoctorProfileView() {
  const setView = useAppStore((s) => s.setView);
  const id = typeof window !== "undefined" ? sessionStorage.getItem("carelink-selected-doctor") : null;
  const d = demoDoctors.find((x) => x.id === id) ?? demoDoctors[0];

  return (
    <div className="pb-safe-nav">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => setView("PATIENT_DOCTORS")} aria-label="Back">
          <ChevronLeft />
        </Button>
        <CareLinkLogo size="sm" />
        <h1 className="flex-1 text-base font-semibold">Doctor Profile</h1>
      </header>

      <div className="px-4 pb-6 pt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border bg-card p-5 card-soft">
          <div className="flex items-center gap-4">
            <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-2xl font-bold text-primary-foreground">
              {d.name.replace("Dr. ", "").charAt(0)}
            </span>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{d.name}</h2>
              <p className="text-sm text-muted-foreground">{d.specialty}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-0.5 text-amber-600"><Star className="size-3.5 fill-amber-500 text-amber-500" /> {d.rating}</span>
                <span className="flex items-center gap-0.5"><MapPin className="size-3.5" /> {d.hospital}</span>
              </div>
            </div>
            <StatusBadge variant="success" dot>{d.availability.includes("today") ? "Available" : d.availability}</StatusBadge>
          </div>
          <div className="mt-4 rounded-xl bg-muted/50 p-3 text-sm">
            <p className="font-medium">{d.qualifications}</p>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5"><Languages className="size-3.5" /> {d.languages.join(" · ")}</p>
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5"><Clock className="size-3.5" /> {d.experience} experience</p>
          </div>
        </motion.div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
          <h3 className="mb-2 font-semibold">About</h3>
          <p className="text-sm text-muted-foreground">
            {d.name} is a specialist in {d.specialty.toLowerCase()} with {d.experience} of clinical experience at {d.hospital}.
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <Button className="flex-1 h-12" onClick={() => setView("PATIENT_BOOK_APPOINTMENT")}>
            <CalendarPlus className="mr-1.5 size-4" /> Book Appointment
          </Button>
          <Button variant="outline" className="flex-1 h-12" onClick={() => setView("PATIENT_APPOINTMENTS")}>My Appointments</Button>
        </div>
      </div>
    </div>
  );
}
