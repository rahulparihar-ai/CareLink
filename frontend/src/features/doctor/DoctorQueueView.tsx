"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ChevronRight, Flag } from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/components/shared/DoctorPageShell";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

const filters = ["All", "URGENT", "NEEDS_REVIEW", "WAITING", "COMPLETED"] as const;

export function DoctorQueueView() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const caseQueue = useAppStore((s) => s.caseQueue);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");

  const filtered = caseQueue.filter((p) => {
    const fOk = filter === "All" || p.status === filter || p.redFlagLevel === filter;
    const sOk = p.name.toLowerCase().includes(search.toLowerCase()) || p.chiefComplaint.toLowerCase().includes(search.toLowerCase());
    return fOk && sOk;
  });

  const open = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  return (
    <DoctorPageShell title="Patient Queue" currentTab="DOCTOR_QUEUE" sub={`${filtered.length} patient(s)`}>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients, complaints…"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring" />
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium text-muted-foreground">No cases yet.</p>
            <p className="mt-1 text-xs text-muted-foreground">Patients captured at the clinic will appear here.</p>
          </div>
        )}
        {filtered.map((p, i) => (
          <motion.button key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            whileTap={{ scale: 0.99 }} onClick={() => open(p.id)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-semibold">{p.name}</p>
                <span className="shrink-0 text-xs text-muted-foreground">· {p.age} · {p.gender[0]}</span>
              </div>
              <p className="truncate text-xs text-muted-foreground">{p.chiefComplaint}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">{p.patientId}</span>
                {p.redFlags && p.redFlags.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] font-medium text-red-600"><Flag className="size-3" /> {p.redFlags.length}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <StatusBadge variant={statusVariant(p.status)} dot>{p.status.replace("_", " ")}</StatusBadge>
              <span className="text-[10px] text-muted-foreground">{p.waitTime}</span>
            </div>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </motion.button>
        ))}
      </div>
    </DoctorPageShell>
  );
}
