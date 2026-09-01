"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronRight, Stethoscope, CalendarDays, Clock, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { Button } from "@/components/ui/button";
import { demoDoctors, departments, timeSlots } from "@/data/demo";
import { uid } from "@/lib/brand/constants";
import { cn } from "@/lib/utils";

type Step = "dept" | "doctor" | "datetime" | "confirm" | "done";
const steps: Step[] = ["dept", "doctor", "datetime", "confirm", "done"];

export function PatientBookAppointmentView() {
  const setView = useAppStore((s) => s.setView);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const addNotification = useAppStore((s) => s.addNotification);

  const [step, setStep] = useState<Step>("dept");
  const [dept, setDept] = useState<string | null>(null);
  const [doctor, setDoctor] = useState<typeof demoDoctors[number] | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [mode, setMode] = useState("In-clinic");

  const deptDoctors = demoDoctors.filter((d) => d.specialty === dept || !dept).slice(0, 3);
  const dates = nextDays(7);

  const confirm = () => {
    addAppointment({
      id: uid("apt"),
      doctorName: doctor!.name,
      specialty: doctor!.specialty,
      date: date!,
      time: time!,
      location: doctor!.hospital,
      status: "upcoming",
      consultationMode: mode,
    });
    addNotification({ id: uid("nf"), type: "appointment", title: "Appointment Booked", body: `${doctor!.name} · ${date} at ${time}`, timestamp: new Date().toISOString(), read: false, category: "appointment" });
    setStep("done");
  };

  const stepIndex = steps.indexOf(step);

  return (
    <PatientPageShell title="Book Appointment" currentTab="PATIENT_APPOINTMENTS" onBack={() => setView("PATIENT_APPOINTMENTS")} noBottomNav>
      {/* Progress */}
      <div className="mb-5 flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-1">
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold transition-colors", i <= stepIndex ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
              {i < stepIndex ? <Check className="size-3.5" /> : i + 1}
            </span>
            {i < steps.length - 1 && <div className={cn("h-0.5 flex-1 rounded", i < stepIndex ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP: department */}
        {step === "dept" && (
          <motion.div key="dept" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="mb-3 font-bold">Select Department</h2>
            <div className="grid grid-cols-2 gap-2.5">
              {departments.map((d) => (
                <button key={d.name} onClick={() => { setDept(d.name); setStep("doctor"); }}
                  className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3 text-left card-soft hover:border-primary/40">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Stethoscope className="size-4" /></span>
                  <span className="text-[13px] font-medium">{d.name}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP: doctor */}
        {step === "doctor" && (
          <motion.div key="doctor" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="mb-1 font-bold">{dept}</h2>
            <p className="mb-3 text-xs text-muted-foreground">Choose a doctor</p>
            <div className="space-y-2.5">
              {deptDoctors.map((d) => (
                <button key={d.id} onClick={() => { setDoctor(d); setStep("datetime"); }}
                  className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{d.name.replace("Dr. ", "").charAt(0)}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{d.name}</p>
                    <p className="text-xs text-muted-foreground">{d.specialty} · {d.experience}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* STEP: datetime */}
        {step === "datetime" && (
          <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="mb-1 font-bold">{doctor?.name}</h2>
            <p className="mb-4 text-xs text-muted-foreground">{doctor?.specialty} · {doctor?.hospital}</p>

            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><CalendarDays className="size-4" /> Select Date</p>
            <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
              {dates.map((d) => (
                <button key={d.full} onClick={() => setDate(d.full)}
                  className={cn("flex shrink-0 flex-col items-center rounded-xl border px-3 py-2", date === d.full ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                  <span className="text-[10px] uppercase">{d.dow}</span>
                  <span className="text-sm font-bold">{d.day}</span>
                </button>
              ))}
            </div>

            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><Clock className="size-4" /> Select Time</p>
            <div className="grid grid-cols-3 gap-2">
              {timeSlots.map((t) => (
                <button key={t} onClick={() => setTime(t)}
                  className={cn("rounded-lg border py-2 text-xs font-medium", time === t ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")}>
                  {t}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {["In-clinic", "Video"].map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={cn("rounded-lg border py-2 text-sm font-medium", mode === m ? "border-primary bg-primary/5 text-primary" : "border-border bg-card")}>
                  {m}
                </button>
              ))}
            </div>

            <Button className="mt-5 h-13 w-full" disabled={!date || !time} onClick={() => setStep("confirm")}>Continue</Button>
          </motion.div>
        )}

        {/* STEP: confirm */}
        {step === "confirm" && doctor && (
          <motion.div key="confirm" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="mb-4 font-bold">Confirm Appointment</h2>
            <div className="rounded-2xl border border-border bg-card p-4 card-soft">
              <div className="flex items-center gap-3">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{doctor.name.replace("Dr. ", "").charAt(0)}</span>
                <div>
                  <p className="font-semibold">{doctor.name}</p>
                  <p className="text-xs text-muted-foreground">{doctor.specialty}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <Row label="Date" value={date ?? ""} />
                <Row label="Time" value={time ?? ""} />
                <Row label="Mode" value={mode} />
                <Row label="Location" value={doctor.hospital} />
              </div>
            </div>
            <Button onClick={confirm} className="mt-5 h-13 w-full text-base">Confirm Booking</Button>
          </motion.div>
        )}

        {/* STEP: done */}
        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-16 text-center">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }} className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
              <CheckCircle2 className="size-10" />
            </motion.div>
            <h2 className="mt-5 text-lg font-bold">Appointment booked!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{doctor?.name} · {date} at {time}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" onClick={() => setView("PATIENT_APPOINTMENTS")}>My Appointments</Button>
              <Button onClick={() => setView("PATIENT_HOME")}>Done</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PatientPageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function nextDays(n: number) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const out: { dow: string; day: string; full: string }[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    out.push({
      dow: i === 0 ? "Today" : days[d.getDay()],
      day: String(d.getDate()),
      full: `${d.getDate()} ${months[d.getMonth()]} 2026`,
    });
  }
  return out;
}
