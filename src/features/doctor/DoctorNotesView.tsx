"use client";

import { useState } from "react";
import { FileText, Plus, ChevronRight } from "lucide-react";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { Button } from "@/components/ui/button";

export function DoctorNotesView() {
  const [composing, setComposing] = useState(false);

  return (
    <DoctorPageShell title="Notes & Templates" currentTab="DOCTOR_NOTES"
      right={<Button size="sm" variant="outline" onClick={() => setComposing(true)}><Plus className="size-4 mr-1" /> New</Button>}>
      {composing ? (
        <div className="rounded-2xl border border-border bg-card p-4 card-soft">
          <textarea rows={5} placeholder="Draft clinical note…" className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring" />
          <p className="mt-2 text-xs text-muted-foreground">Templates: Assessment · Plan · Follow-up · Referral</p>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1">Save note</Button>
            <Button variant="outline" onClick={() => setComposing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          <button onClick={() => setComposing(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3.5 text-left text-sm font-medium text-primary">
            <Plus className="size-5" /> Create a new note
          </button>
          <NoteCard title="Assessment — Ravi Kumar" preview="Chest pain with radiation… rule out ACS." date="Today · 09:12" />
          <NoteCard title="Follow-up — Sunita Devi" preview="Review dyspnea + edema, plan echo." date="Today · 09:18" />
          <NoteCard title="Plan — Amit Verma" preview="Dietary advice + OTC for gastritis." date="Today · 09:25" />
        </div>
      )}
    </DoctorPageShell>
  );
}

function NoteCard({ title, preview, date }: { title: string; preview: string; date: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
      <span className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><FileText className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{preview}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{date}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
