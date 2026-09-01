"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Plus, Upload, Eye, Lock, FileText } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/brand/constants";

export function PatientInsuranceView() {
  const setView = useAppStore((s) => s.setView);
  const policies = useAppStore((s) => s.insurancePolicies);
  const addInsurance = useAppStore((s) => s.addInsurance);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [policyDocsId, setPolicyDocsId] = useState<string | null>(null);
  const [form, setForm] = useState({ provider: "", policyNumber: "", validity: "", coverage: "", tpa: "" });
  const [saved, setSaved] = useState(false);

  const mask = (n: string) => n.replace(/(.{4})/g, "$1-").trim();

  const submitAdd = () => {
    if (!form.provider.trim() || !form.policyNumber.trim()) return;
    addInsurance({
      id: uid("ins"),
      provider: form.provider.trim(),
      policyNumber: form.policyNumber.trim(),
      validity: form.validity || "—",
      tpa: form.tpa || "—",
      coverage: form.coverage || "—",
      status: "Active",
    });
    setForm({ provider: "", policyNumber: "", validity: "", coverage: "", tpa: "" });
    setShowAdd(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <PatientPageShell
      title="Health Insurance"
      currentTab="PATIENT_HISTORY"
      onBack={() => setView("PATIENT_HOME")}
      right={
        <button onClick={() => setShowAdd((v) => !v)} className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
          <Plus className="size-3.5" /> {showAdd ? "Close" : "Add"}
        </button>
      }
    >
      <div className="mb-3 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <p>Sensitive identifiers are masked for your privacy.</p>
      </div>

      {saved && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-700">
          <ShieldCheck className="size-4" /> Policy saved successfully.
        </div>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mb-3 space-y-2.5 rounded-2xl border border-border bg-card p-3.5 card-soft">
              <p className="text-sm font-semibold">Add Policy</p>
              <Input placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} className="h-11" />
              <Input placeholder="Policy number" value={form.policyNumber} onChange={(e) => setForm({ ...form, policyNumber: e.target.value })} className="h-11" />
              <div className="grid grid-cols-2 gap-2.5">
                <Input placeholder="Coverage (e.g. ₹5,00,000)" value={form.coverage} onChange={(e) => setForm({ ...form, coverage: e.target.value })} className="h-11" />
                <Input placeholder="Valid till" value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} className="h-11" />
              </div>
              <Input placeholder="TPA" value={form.tpa} onChange={(e) => setForm({ ...form, tpa: e.target.value })} className="h-11" />
              <Button className="h-11 w-full" disabled={!form.provider.trim() || !form.policyNumber.trim()} onClick={submitAdd}>Save Policy</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {policies.length === 0 ? (
        <EmptyState title="No insurance added" hint="Add a policy to keep coverage information handy." action="Add Insurance" icon={ShieldCheck} onAction={() => setShowAdd(true)} />
      ) : (
        <div className="space-y-3">
          {policies.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-2xl border border-border bg-card card-soft">
              <div className="bg-gradient-to-br from-primary to-primary/80 p-4 text-primary-foreground">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{p.provider}</p>
                  <StatusBadge variant="success" className="bg-white/15 text-white" dot>{p.status}</StatusBadge>
                </div>
                <p className="mt-3 text-xs text-white/80">Policy No.</p>
                <p className="text-lg font-semibold tracking-wider">{mask(p.policyNumber)}</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border text-center py-3">
                <div>
                  <p className="text-xs text-muted-foreground">Coverage</p>
                  <p className="text-sm font-semibold">{p.coverage}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Valid till</p>
                  <p className="text-sm font-semibold">{p.validity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">TPA</p>
                  <p className="text-sm font-semibold truncate px-1">{p.tpa}</p>
                </div>
              </div>
              <AnimatePresence>
                {expandedId === p.id && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden border-t border-border">
                    <div className="space-y-1.5 p-3.5 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Policy type</span><span className="font-medium">Health / Family Floater</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Summer renewal</span><span className="font-medium">{p.validity}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Documents</span><span className="font-medium">—</span></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="flex gap-2 border-t border-border p-3">
                <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted py-2 text-sm font-medium"><Eye className="size-4" /> {expandedId === p.id ? "Hide" : "View"} Details</button>
                <button onClick={() => setPolicyDocsId(policyDocsId === p.id ? null : p.id)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted py-2 text-sm font-medium"><Upload className="size-4" /> Policy Docs</button>
              </div>
              {policyDocsId === p.id && (
                <div className="space-y-2 rounded-b-2xl border-t border-border bg-muted/30 p-3.5">
                  <p className="text-xs font-semibold text-muted-foreground">Uploaded documents</p>
                  {["Policy booklet", "Tax certificate"].map((doc) => (
                    <div key={doc} className="flex items-center gap-2.5 rounded-lg bg-card px-3 py-2.5 text-sm">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="size-4" /></span>
                      <span className="flex-1">{doc}</span>
                      <span className="text-[10px] font-medium text-emerald-600">PDF · Added</span>
                    </div>
                  ))}
                  <button onClick={() => setView("PATIENT_OCR")} className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/40 py-2.5 text-sm font-medium text-primary">
                    <Upload className="size-4" /> Add a document
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}
