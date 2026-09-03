"use client";

import { useState } from "react";
import { FileText, Plus, ChevronRight, CheckCircle2 } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { Button } from "@/components/ui/button";
import { uid } from "@/lib/brand/constants";

interface Note {
  id: string;
  patient: string;
  content: string;
  ts: string;
}

export function DoctorNotesView() {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);
  const [localNotes, setLocalNotes] = useState<Note[]>([]);

  // Pull real clinical notes from case records the doctor has worked on.
  const caseQueue = useAppStore((s) => s.caseQueue);
  const caseNotes: Note[] = caseQueue
    .flatMap((c) =>
      (c.notes ?? [])
        .filter((n) => n.type !== "follow-up")
        .map((n) => ({
          id: n.id,
          patient: c.name,
          content: n.content,
          ts: new Date(n.timestamp).toLocaleString(),
        }))
    )
    .sort((a, b) => (a.ts < b.ts ? 1 : -1));

  const notes = [...localNotes, ...caseNotes];

  const saveNote = () => {
    if (!draft.trim()) return;
    setLocalNotes((n) => [{ id: uid("note"), patient: "—", content: draft.trim(), ts: "just now" }, ...n]);
    setDraft("");
    setComposing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <DoctorPageShell title="Notes & Templates" currentTab="DOCTOR_NOTES"
      right={<Button size="sm" variant="outline" onClick={() => setComposing(true)}><Plus className="size-4 mr-1" /> New</Button>}>
      {saved && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700">
          <CheckCircle2 className="size-4" /> Note saved.
        </div>
      )}
      {composing ? (
        <div className="rounded-2xl border border-border bg-card p-4 card-soft">
          <textarea
            rows={5}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Draft clinical note…"
            className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring"
          />
          <p className="mt-2 text-xs text-muted-foreground">Templates: Assessment · Plan · Follow-up · Referral</p>
          <div className="mt-3 flex gap-2">
            <Button className="flex-1" disabled={!draft.trim()} onClick={saveNote}>Save note</Button>
            <Button variant="outline" onClick={() => { setComposing(false); setDraft(""); }}>Cancel</Button>
          </div>
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-border py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground"><FileText className="size-6" /></span>
          <p className="mt-3 text-sm font-semibold">No clinical notes yet</p>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">Notes you save during consultations will appear here.</p>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setComposing(true)}>
            <Plus className="size-4 mr-1" /> Create a note
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <button onClick={() => setComposing(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3.5 text-left text-sm font-medium text-primary">
            <Plus className="size-5" /> Create a new note
          </button>
          {notes.map((n) => (
            <NoteCard key={n.id} patient={n.patient} title={n.content.split(":")[0]?.trim() || "Clinical note"} preview={n.content} date={n.ts} />
          ))}
        </div>
      )}
    </DoctorPageShell>
  );
}

function NoteCard({ patient, title, preview, date }: { patient: string; title: string; preview: string; date: string }) {
  return (
    <button className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
      <span className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><FileText className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{preview}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{patient}{patient !== "—" ? " · " : ""}{date}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  );
}
