"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Search,
  Upload,
  ScanLine,
  Pill,
  FlaskConical,
  FilePlus2,
  ImageIcon,
  Syringe,
  ShieldCheck,
  FolderOpen,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { EmptyState, SyntheticNote } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

const cats = [
  { key: "all", label: "All", icon: FolderOpen },
  { key: "Lab Report", label: "Lab Reports", icon: FlaskConical },
  { key: "Prescription", label: "Prescriptions", icon: Pill },
  { key: "Imaging", label: "Imaging", icon: ImageIcon },
  { key: "Vaccination", label: "Vaccination", icon: Syringe },
  { key: "Insurance", label: "Insurance", icon: ShieldCheck },
];

const typeIcon: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  "Lab Report": { icon: FlaskConical, bg: "bg-pink-500/10 text-pink-600" },
  Prescription: { icon: Pill, bg: "bg-emerald-500/10 text-emerald-600" },
  Imaging: { icon: ImageIcon, bg: "bg-sky-500/10 text-sky-600" },
  Vaccination: { icon: Syringe, bg: "bg-amber-500/10 text-amber-600" },
  Insurance: { icon: ShieldCheck, bg: "bg-primary/10 text-primary" },
};

export function PatientDocumentsView() {
  const setView = useAppStore((s) => s.setView);
  const documents = useAppStore((s) => s.documents);
  const [active, setActive] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = documents.filter((d) => {
    const catOk = active === "all" || d.type === active;
    const searchOk = d.name.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  });

  return (
    <PatientPageShell
      title="Documents"
      currentTab="PATIENT_DOCUMENTS"
      onBack={() => setView("PATIENT_HOME")}
      right={
        <div className="flex gap-1.5">
          <button
            onClick={() => setView("PATIENT_OCR")}
            className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <ScanLine className="size-3.5" /> Scan
          </button>
          <button
            onClick={() => setView("PATIENT_OCR")}
            className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium"
          >
            <Upload className="size-3.5" /> Upload
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring"
        />
      </div>

      {/* Category filter */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto no-scrollbar">
        {cats.map((c) => (
          <button
            key={c.key}
            onClick={() => setActive(c.key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              active === c.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}
          >
            <c.icon className="size-3.5" />
            {c.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No medical documents yet"
          hint="Upload your first report to get started."
          action="Upload a document"
          onAction={() => setView("PATIENT_OCR")}
          icon={FileText}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((d, i) => {
            const meta = typeIcon[d.type] ?? { icon: FilePlus2, bg: "bg-muted text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <motion.button
                key={d.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  const targets: Record<string, string> = {
                    "Lab Report": "PATIENT_LAB",
                    Prescription: "PATIENT_MEDICATIONS",
                    Imaging: "PATIENT_TIMELINE",
                    Vaccination: "PATIENT_VACCINATION",
                    Insurance: "PATIENT_INSURANCE",
                  };
                  setView((targets[d.type] ?? "PATIENT_DOCUMENTS") as never);
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft"
              >
                <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", meta.bg)}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {d.type} · {d.dateStr} · {d.hospital ?? d.doctor}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <SyntheticNote text="Demo" />
                    {d.confidence && (
                      <span className="text-[10px] text-muted-foreground">
                        OCR confidence {d.confidence}%
                      </span>
                    )}
                  </div>
                </div>
                <StatusBadge variant={d.type === "Prescription" ? "info" : "success"} dot>
                  Ready
                </StatusBadge>
              </motion.button>
            );
          })}
        </div>
      )}
    </PatientPageShell>
  );
}
