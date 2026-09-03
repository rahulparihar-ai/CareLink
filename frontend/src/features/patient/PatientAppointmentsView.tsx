"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Stethoscope, CheckCircle2, XCircle } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import { cn } from "@/utils";
import type { Appointment } from "@/types";

const tabs = ["upcoming", "completed", "cancelled"] as const;

export function PatientAppointmentsView() {
  const setView = useAppStore((s) => s.setView);
  const appointments = useAppStore((s) => s.appointments);
  const cancelAppointment = useAppStore((s) => s.cancelAppointment);
  const [tab, setTab] = useState<(typeof tabs)[number]>("upcoming");
  const [manageId, setManageId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const filtered = appointments.filter((a) => a.status === tab);

  const doCancel = (id: string) => {
    cancelAppointment(id);
    setManageId(null);
    setConfirmed(true);
    setTimeout(() => setConfirmed(false), 2000);
  };

  const addToCalendar = (a: Appointment) => {
    const start = `${a.date.replace(/,/g, "")} ${a.time.replace(" ", "T").replace(/:\d+ (AM|PM)/, ":00$1")}`;
    const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `SUMMARY:${a.doctorName} - ${a.specialty}`, `DTSTART:${start}`, `LOCATION:${a.location}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "appointment.ics";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PatientPageShell
      title="Appointments"
      currentTab="PATIENT_APPOINTMENTS"
      onBack={() => setView("PATIENT_HOME")}
    >
      {confirmed && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700">
          <CheckCircle2 className="size-4" /> Appointment cancelled.
        </div>
      )}
      <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("rounded-lg py-1.5 text-xs font-medium capitalize transition-colors", tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground")}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={`No ${tab} appointments`} icon={CalendarDays} />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((a, i) => (
            <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4 card-soft">
              <div className="flex items-start gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Stethoscope className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{a.doctorName}</p>
                  <p className="text-xs text-muted-foreground">{a.specialty}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-foreground"><CalendarDays className="size-3.5" /> {a.date}</span>
                    <span>{a.time}</span>
                    <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {a.location}</span>
                  </div>
                  {a.consultationMode && (
                    <span className="mt-1.5 inline-block rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{a.consultationMode}</span>
                  )}
                </div>
                <StatusBadge variant={statusVariant(a.status)} dot className="capitalize">{a.status}</StatusBadge>
              </div>
              {tab === "upcoming" && (
                <div className="mt-3 flex gap-2 border-t border-border pt-3">
                  <button onClick={() => setManageId(manageId === a.id ? null : a.id)} className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground">Manage</button>
                  <button onClick={() => addToCalendar(a)} className="flex-1 rounded-lg bg-muted py-2 text-xs font-medium text-muted-foreground">Add to Calendar</button>
                </div>
              )}
              {manageId === a.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden">
                  <div className="mt-2 rounded-xl border border-border bg-muted/40 p-3">
                    <button onClick={() => doCancel(a.id)} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2 text-sm font-medium text-red-600">
                      <XCircle className="size-4" /> Cancel this appointment
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {(tab === "completed" || tab === "cancelled") && filtered.length > 0 && (
        <p className="mt-4 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          {tab === "completed" ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
          Showing {filtered.length} {tab} appointment(s)
        </p>
      )}
    </PatientPageShell>
  );
}
