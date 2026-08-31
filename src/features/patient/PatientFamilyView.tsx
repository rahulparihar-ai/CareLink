"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { Button } from "@/components/ui/button";

const relations = ["Father", "Mother", "Sibling", "Grandparent", "Other Relative"];

export function PatientFamilyView() {
  const setView = useAppStore((s) => s.setView);
  const family = useAppStore((s) => s.familyHealth);
  const addFamilyMember = useAppStore((s) => s.addFamilyMember);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ relationship: "Father", condition: "", age: "", notes: "" });

  const add = () => {
    if (!form.condition.trim()) return;
    addFamilyMember({
      id: "fam-" + Date.now(),
      relationship: form.relationship,
      condition: form.condition,
      status: "Known",
      notes: form.notes,
      source: "Patient input",
      ageAtDiagnosis: form.age ? Number(form.age) : undefined,
    });
    setForm({ relationship: "Father", condition: "", age: "", notes: "" });
    setShowAdd(false);
  };

  return (
    <PatientPageShell
      title="Family Health"
      currentTab="PATIENT_HISTORY"
      onBack={() => setView("PATIENT_HISTORY")}
      right={
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
          <Plus className="size-3.5" /> Add
        </button>
      }
    >
      {showAdd && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 card-soft">
          <p className="font-semibold">Add Family Member</p>
          <div className="mt-3 space-y-2.5">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {relations.map((r) => (
                <button key={r} onClick={() => setForm({ ...form, relationship: r })}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${form.relationship === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  {r}
                </button>
              ))}
            </div>
            <input value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} placeholder="Condition (e.g. Hypertension)" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, "") })} placeholder="Age at diagnosis (optional)" inputMode="numeric" className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Notes (optional)" rows={2} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm outline-none focus:border-ring" />
            <Button onClick={add} className="w-full">Save</Button>
          </div>
        </div>
      )}

      {family.length === 0 ? (
        <EmptyState title="No family history added" hint="Add family health history to give doctors important context." action="Add family member" onAction={() => setShowAdd(true)} icon={Users} />
      ) : (
        <div className="space-y-2.5">
          {family.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border bg-card p-4 card-soft">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{UsersRelationIcon()}</span>
                <div className="flex-1">
                  <p className="font-semibold">{f.relationship}</p>
                  <p className="text-sm text-muted-foreground">{f.condition}</p>
                  {f.notes && <p className="mt-1 text-xs text-muted-foreground">{f.notes}</p>}
                </div>
                {f.ageAtDiagnosis && (
                  <span className="text-xs text-muted-foreground">@ age {f.ageAtDiagnosis}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}

function UsersRelationIcon() {
  return <Users className="size-5" />;
}
