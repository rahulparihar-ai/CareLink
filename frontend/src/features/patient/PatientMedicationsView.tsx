"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pill, Plus, Clock, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

export function PatientMedicationsView() {
  const setView = useAppStore((s) => s.setView);
  const medications = useAppStore((s) => s.medications);
  const addMedication = useAppStore((s) => s.addMedication);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", strength: "", frequency: "", duration: "" });

  const current = medications.filter((m) => m.status === "current");
  const past = medications.filter((m) => m.status === "past");

  const add = () => {
    if (!form.name.trim()) return;
    addMedication({
      id: "med-" + Date.now(),
      name: form.name,
      strength: form.strength,
      frequency: form.frequency,
      duration: form.duration,
      status: "current",
      source: "Patient input",
      sourceType: "input",
    });
    setForm({ name: "", strength: "", frequency: "", duration: "" });
    setShowAdd(false);
  };

  return (
    <PatientPageShell
      title="Medications"
      currentTab="PATIENT_HISTORY"
      onBack={() => setView("PATIENT_HISTORY")}
      right={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Plus className="size-3.5" /> Add
        </button>
      }
    >
      {showAdd && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 card-soft">
          <p className="font-semibold">Add Medication</p>
          <div className="mt-3 space-y-2.5">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Medicine name" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <div className="grid grid-cols-2 gap-2">
              <input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="Strength" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
              <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="Frequency" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            </div>
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Duration" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <Button onClick={add} className="w-full">Save Medication</Button>
          </div>
        </div>
      )}

      <SectionTitle>Current Medications</SectionTitle>
      {current.length === 0 ? (
        <EmptyState title="No current medications recorded" icon={Pill} />
      ) : (
        <div className="space-y-2.5">
          {current.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-3.5 card-soft">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Pill className="size-5" /></span>
                <div className="flex-1">
                  <p className="font-semibold">{m.name} <span className="text-muted-foreground">{m.strength}</span></p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> {m.frequency} · {m.duration}</p>
                </div>
                <StatusBadge variant="success" dot>Current</StatusBadge>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
                <span>Source: {m.source}</span>
                {m.startDate && <span>Since {m.startDate}</span>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <SectionTitle>Past Medications</SectionTitle>
        {past.length === 0 ? (
          <EmptyState title="No past medications" icon={CheckCircle2} />
        ) : (
          <div className="space-y-2.5">
            {past.map((m) => (
              <div key={m.id} className="rounded-2xl border border-border bg-card p-3.5 card-soft opacity-80">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><Pill className="size-5" /></span>
                  <div className="flex-1">
                    <p className="font-semibold">{m.name} <span className="text-muted-foreground">{m.strength}</span></p>
                    <p className="text-xs text-muted-foreground">{m.frequency} · {m.duration}</p>
                  </div>
                  <StatusBadge variant="muted">Past</StatusBadge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientPageShell>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 mt-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{children}</h2>;
}
