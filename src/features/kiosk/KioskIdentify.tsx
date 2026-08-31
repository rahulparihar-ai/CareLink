"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, ShieldCheck, QrCode, UserPlus, ScanFace, ChevronRight, IdCard,
  Loader2, CheckCircle2,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CONSENT_SERVICE } from "@/services";
import { cn } from "@/lib/utils";

type Method = "abha" | "aadhaar" | "new";

export function KioskIdentify() {
  const setView = useAppStore((s) => s.setView);
  const setRole = useAppStore((s) => s.setRole);
  const setPatientProfile = useAppStore((s) => s.setPatientProfile);
  const setKioskPatientId = useAppStore((s) => s.setKioskPatientId);
  const [method, setMethod] = useState<Method>("abha");
  const [abhaId, setAbhaId] = useState("");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);
  const [aadhaarFilled, setAadhaarFilled] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    if (method === "abha") {
      if (!abhaId.trim()) { setError("Please enter your ABHA ID."); setLoading(false); return; }
      const res = await CONSENT_SERVICE.authenticateAbha(abhaId.trim());
      if (!res.ok) { setError(res.error ?? "Authentication failed"); setLoading(false); return; }
      const p = useAppStore.getState().patientProfile;
      setPatientProfile({ ...p!, name: "Rahul Sharma" });
    } else if (method === "aadhaar") {
      if (!aadhaarFilled) {
        const res = await CONSENT_SERVICE.decodeAadhaarQr();
        if (!res.ok) { setError(res.error ?? "QR scan failed"); setLoading(false); return; }
        const p = useAppStore.getState().patientProfile;
        setPatientProfile({ ...p!, name: res.profile?.name ?? "Rahul Sharma" });
        setAadhaarFilled(true);
        setLoading(false);
        return;
      }
    } else {
      if (!newName.trim()) { setError("Please enter the patient's name."); setLoading(false); return; }
      const p = useAppStore.getState().patientProfile;
      setPatientProfile({ ...p!, name: newName.trim() });
    }
    setRole("PATIENT");
    setKioskPatientId("CL-2026-000124");
    setView("KIOSK_CONSENT");
  };

  return (
    <div className="app-shell min-h-dvh bg-card">
      <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-md px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView("KIOSK_HOME"); }} aria-label="Back" className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground">
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <p className="text-sm font-bold">Identify Yourself</p>
            <p className="text-xs text-muted-foreground">Step 2 of 5</p>
          </div>
          <div className="ml-auto flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
            <IdCard className="size-5" />
          </div>
        </div>
      </header>

      <div className="px-4 py-5">
        <p className="mb-4 text-sm font-semibold">Choose how to identify</p>
        <div className="space-y-3">
          <MethodCard active={method === "abha"} onClick={() => setMethod("abha")}
            icon={<ShieldCheck className="size-5" />} tone="bg-primary/10 text-primary"
            title="I have an ABHA Health ID" sub="Fastest — links directly to your ABDM health record"
            right={method === "abha" ? <CheckCircle2 className="size-5 text-primary" /> : undefined} />
          <MethodCard active={method === "aadhaar"} onClick={() => setMethod("aadhaar")}
            icon={<QrCode className="size-5" />} tone="bg-violet-500/10 text-violet-600"
            title="Scan Aadhaar QR" sub="Auto-fill name, DOB & gender from QR (simulated)"
            right={method === "aadhaar" ? <CheckCircle2 className="size-5 text-violet-600" /> : undefined} />
          <MethodCard active={method === "new"} onClick={() => setMethod("new")}
            icon={<UserPlus className="size-5" />} tone="bg-emerald-500/10 text-emerald-600"
            title="New patient / no ID" sub="Register as a guest — details captured now"
            right={method === "new" ? <CheckCircle2 className="size-5 text-emerald-600" /> : undefined} />
        </div>

        {/* Method-specific detail */}
        <motion.div layout className="mt-4 rounded-2xl border border-border bg-background p-4 card-soft">
          {method === "abha" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground">ABHA ID / ABHA Address</label>
              <Input value={abhaId} onChange={(e) => setAbhaId(e.target.value)}
                placeholder="91-XXXX-XXXX-XXXX or user@abdm" className="mt-1.5 h-12" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">e.g. 91-6789-4321-1234 (demo)</p>
            </div>
          )}
          {method === "aadhaar" && (
            <div className="text-center">
              {aadhaarFilled ? (
                <div className="flex flex-col items-center py-2">
                  <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="size-8" /></div>
                  <p className="mt-2 text-sm font-semibold">Aadhaar verified</p>
                  <p className="text-xs text-muted-foreground">Rahul Sharma · 12/03/1992 · Male</p>
                </div>
              ) : (
                <button onClick={handleContinue} disabled={loading}
                  className="flex w-full flex-col items-center py-3">
                  <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 text-primary">
                    {loading ? <Loader2 className="size-8 animate-spin" /> : <ScanFace className="size-8" />}
                  </div>
                  <p className="mt-2 text-sm font-semibold">Scan Aadhaar QR code</p>
                  <p className="text-xs text-muted-foreground">Position the QR inside the frame</p>
                </button>
              )}
            </div>
          )}
          {method === "new" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground">Patient&apos;s full name</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Priya Verma" className="mt-1.5 h-12" />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Remaining demographics can be added later in their profile.
              </p>
            </div>
          )}
        </motion.div>

        {error && <p className="mt-2 text-xs font-medium text-destructive">{error}</p>}
      </div>

      <div className="sticky bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
        <Button className="h-12 w-full rounded-xl text-sm font-semibold" onClick={handleContinue} disabled={loading}>
          {method === "aadhaar" && !aadhaarFilled ? "Scan QR" : "Continue"}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function MethodCard({ active, onClick, icon, tone, title, sub, right }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  tone: string;
  title: string;
  sub: string;
  right?: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={cn("flex w-full items-center gap-3 rounded-2xl border p-4 text-left card-soft transition-colors",
        active ? "border-primary/40 bg-primary/5" : "border-border bg-card")}>
      <span className={cn("flex size-11 items-center justify-center rounded-xl", tone)}>{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted-foreground">{sub}</span>
      </span>
      {right}
    </button>
  );
}

