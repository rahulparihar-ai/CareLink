"use client";

import { motion } from "framer-motion";
import { ShieldCheck, Plus, Upload, Eye, Lock } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";

export function PatientInsuranceView() {
  const setView = useAppStore((s) => s.setView);
  const policies = useAppStore((s) => s.insurancePolicies);

  const mask = (n: string) => n.replace(/(.{4})/g, "$1-").trim();

  return (
    <PatientPageShell
      title="Health Insurance"
      currentTab="PATIENT_HISTORY"
      onBack={() => setView("PATIENT_HOME")}
      right={
        <button className="flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground">
          <Plus className="size-3.5" /> Add
        </button>
      }
    >
      <div className="mb-3 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" />
        <p>Sensitive identifiers are masked for your privacy.</p>
      </div>

      {policies.length === 0 ? (
        <EmptyState title="No insurance added" hint="Add a policy to keep coverage information handy." action="Add Insurance" icon={ShieldCheck} />
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
              <div className="flex gap-2 border-t border-border p-3">
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted py-2 text-sm font-medium"><Eye className="size-4" /> View Details</button>
                <button className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-muted py-2 text-sm font-medium"><Upload className="size-4" /> Policy Docs</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PatientPageShell>
  );
}
