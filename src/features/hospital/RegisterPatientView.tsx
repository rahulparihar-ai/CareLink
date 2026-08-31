"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, QrCode, Keyboard, Check, ChevronRight, ShieldCheck, Loader2 } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Step = "method" | "form" | "done";

export function RegisterPatientView() {
  const setView = useAppStore((s) => s.setView);
  const setPatientProfile = useAppStore((s) => s.setPatientProfile);
  const [step, setStep] = useState<Step>("method");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "", dob: "", gender: "Male", mobile: "", address: "", bloodGroup: "", aadhaar: "", abha: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const simulateAadhaar = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));
    setForm((f) => ({
      ...f,
      name: "Sunita Devi",
      dob: "1964-08-12",
      gender: "Female",
      address: "Village Khera, Rajasthan 342001",
      aadhaar: "XXXX-XXXX-3847",
    }));
    setLoading(false);
    setStep("form");
  };

  const register = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setPatientProfile({
      id: `CL-2026-${String(Math.floor(100000 + Math.random() * 900000))}`,
      name: form.name || "New Patient",
      age: form.dob ? Math.floor((Date.now() - new Date(form.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 30,
      gender: form.gender as "Male" | "Female" | "Other",
      dateOfBirth: form.dob,
      mobileNumber: form.mobile,
      language: "English",
      emergencyContact: "",
      abhaStatus: form.abha ? "Linked" : "Not linked",
      abhaReference: form.abha || "XXXX-XXXX-XXXX",
      bloodGroup: form.bloodGroup,
      allergies: "",
      currentMedicines: "",
      knownConditions: "",
      heightCm: 170,
      weightKg: 70,
    });
    setLoading(false);
    setStep("done");
  };

  if (step === "done") {
    return (
      <PatientPageShell title="Registration Complete" currentTab="HOSPITAL_HOME" onBack={() => setView("HOSPITAL_HOME")}>
        <div className="flex flex-col items-center py-16 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12 }}
            className="flex size-20 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
            <Check className="size-10" />
          </motion.div>
          <h2 className="mt-5 text-lg font-bold">Patient provisionally registered</h2>
          <p className="mt-1 text-sm text-muted-foreground">{form.name || "New patient"} has been registered at CareLink Health Network.</p>
          <div className="mt-6 w-full max-w-xs rounded-2xl border border-border bg-card p-4 text-left text-sm card-soft">
            <p className="font-semibold">{form.name}</p>
            <p className="mt-1 text-muted-foreground">{form.gender} · {form.dob} · {form.mobile}</p>
            {form.aadhaar && <p className="mt-1 text-muted-foreground">Aadhaar: {form.aadhaar}</p>}
          </div>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => { setStep("form"); setForm({ name: "", dob: "", gender: "Male", mobile: "", address: "", bloodGroup: "", aadhaar: "", abha: "" }); }}>Register another</Button>
            <Button onClick={() => setView("HOSPITAL_HOME")}>Back to home</Button>
          </div>
        </div>
      </PatientPageShell>
    );
  }

  return (
    <PatientPageShell title="Register Patient" currentTab="HOSPITAL_HOME" onBack={() => setView("HOSPITAL_HOME")}>
      {/* Step indicator */}
      <div className="mb-4 flex items-center gap-2">
        {(["method", "form"] as const).map((s, i) => (
          <span key={s} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold", step === s ? "bg-primary text-primary-foreground" : "bg-muted")}>{i + 1}</span>
            <span className={step === s ? "text-foreground" : ""}>{s === "method" ? "Select method" : "Demographic form"}</span>
          </span>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === "method" && (
          <motion.div key="method" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
            <h2 className="text-sm font-semibold">How would you like to register?</h2>
            <button onClick={() => { setStep("form"); }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 card-soft">
              <span className="flex size-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600"><Keyboard className="size-6" /></span>
              <div>
                <p className="font-semibold">Form-based registration</p>
                <p className="text-xs text-muted-foreground">Enter details manually</p>
              </div>
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </button>
            <button onClick={simulateAadhaar}
              className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 card-soft">
              <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><QrCode className="size-6" /></span>
              <div>
                <p className="font-semibold">Aadhaar QR scan</p>
                <p className="text-xs text-muted-foreground">Auto-fill demographic details</p>
              </div>
              {loading ? <Loader2 className="ml-auto size-5 animate-spin text-primary" /> : <ChevronRight className="ml-auto size-4 text-muted-foreground" />}
            </button>

            <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              This is a provisional registration for demo purposes only. No real Aadhaar or ABDM integration.
            </div>
          </motion.div>
        )}

        {step === "form" && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
            <h2 className="text-sm font-semibold">Patient Demographics</h2>
            {form.aadhaar && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-300/50 bg-emerald-50 p-3 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                <QrCode className="mt-0.5 size-4 shrink-0" />
                Auto-filled from Aadhaar QR. Please verify and complete.
              </div>
            )}
            <Field label="Full Name" value={form.name} onChange={(v) => set("name", v)} placeholder="e.g. Sunita Devi" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date of Birth" value={form.dob} onChange={(v) => set("dob", v)} type="date" />
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">Gender</label>
                <div className="flex gap-1.5">
                  {["Male", "Female", "Other"].map((g) => (
                    <button key={g} onClick={() => set("gender", g)}
                      className={cn("flex-1 rounded-xl border py-2.5 text-xs font-medium", form.gender === g ? "border-primary bg-primary/5 text-primary" : "border-border bg-card")}>{g}</button>
                  ))}
                </div>
              </div>
            </div>
            <Field label="Mobile" value={form.mobile} onChange={(v) => set("mobile", v)} placeholder="+91 XXXXX XXXXX" type="tel" />
            <Field label="Address" value={form.address} onChange={(v) => set("address", v)} placeholder="Full address" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Blood Group" value={form.bloodGroup} onChange={(v) => set("bloodGroup", v)} placeholder="B+" />
              <Field label="ABHA ID (optional)" value={form.abha} onChange={(v) => set("abha", v)} placeholder="XXXX-XXXX-XXXX" />
            </div>
            <Button onClick={register} className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 size-4 animate-spin" /> Registering…</> : <><UserPlus className="mr-2 size-4" /> Provisionally register</>}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </PatientPageShell>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-ring" />
    </div>
  );
}
