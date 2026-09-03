"use client";

import { motion } from "framer-motion";
import {
  FlaskConical, ScanLine, UserPlus,
  ChevronRight, Building2, Info, Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { NavigationDrawer } from "@/layouts/NavigationDrawer";
import { HospitalBottomNav } from "@/layouts/BottomNav";
import { BRAND } from "@/lib/brand/constants";
import { useState } from "react";

interface Service {
  key: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  view: string;
  tone: string;
  primary?: boolean;
}

const services: Service[] = [
  { key: "intake", label: "Care Link", sub: "AI history & documents", icon: Sparkles, tone: "bg-primary/10 text-primary", view: "INTAKE_HOME", primary: true },
  { key: "register", label: "Register Patient", sub: "Form / Aadhaar QR", icon: UserPlus, tone: "bg-pink-500/10 text-pink-600", view: "REGISTER_PATIENT" },
  { key: "scan", label: "Scan Prescription", sub: "Send to Doctor Desk", icon: ScanLine, tone: "bg-primary/10 text-primary", view: "SCAN_PRESCRIPTION" },
  { key: "lab", label: "Lab Reports", sub: "Investigations", icon: FlaskConical, tone: "bg-violet-500/10 text-violet-600", view: "LAB_REPORTS" },
];

export function HospitalHome() {
  const setView = useAppStore((s) => s.setView);
  const role = useAppStore((s) => s.role);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const setRole = useAppStore((s) => s.setRole);

  const dispatch = async (svc: Service) => {
    if (svc.view === "LAB_REPORTS" && !role) {
      setRole("PATIENT");
    }
    setView(svc.view as never);
  };

  return (
    <div className="pb-safe-nav">
      {/* Hospital header */}
      <header className="sticky top-0 z-30 bg-card px-4 pb-3 pt-3">
        <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-background p-3 card-soft">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Building2 className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">Govt. Model Hospital</p>
            <h1 className="truncate text-base font-bold leading-tight">{BRAND.facility}</h1>
            <p className="text-[11px] text-muted-foreground">Swasthya &middot; CareLink Health Network</p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menu"
            className="flex size-9 items-center justify-center rounded-full bg-muted text-foreground"
          >
            <Building2 className="size-5" />
          </button>
        </div>
      </header>

      <div className="px-4">
        {/* Info strip */}
        {role === "PATIENT" ? (
          <button
            onClick={() => setView("PATIENT_HOME")}
            className="mb-4 mt-3 flex w-full items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-3.5 text-left card-soft"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
              {useAppStore.getState().patientProfile?.name?.charAt(0) ?? "P"}
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">My Health Portal</p>
              <p className="text-xs text-muted-foreground">Appointments, records, AI insights</p>
            </div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </button>
        ) : (
          <div className="mb-4 mt-3 flex items-start gap-2 rounded-2xl border border-primary/15 bg-primary/5 p-3.5 text-xs text-muted-foreground card-soft">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>Register a new patient or scan their Aadhaar QR to collect demographic details. View departmental consultant schedules, tariffs and duty roster without login.</p>
          </div>
        )}

        {/* Care Link intake banner */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 mt-3 overflow-hidden rounded-2xl bg-primary text-primary-foreground card-soft">
          <button onClick={() => setView("INTAKE_HOME")} className="flex w-full items-center gap-3 p-4 text-left">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <Sparkles className="size-6" />
            </span>
            <span className="flex-1">
              <span className="flex items-center gap-2 text-sm font-bold">Care Link intake <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold uppercase">AI</span></span>
              <span className="block text-xs text-white/85">Record your history &amp; scan your documents before the consultation</span>
            </span>
            <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </motion.div>

        {/* Services grid */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3">
          {services.map((s, i) => (
            <motion.button
              key={s.key}
              whileTap={{ scale: 0.97 }}
              onClick={() => dispatch(s)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`flex flex-col items-start gap-2.5 rounded-2xl border p-4 text-left card-soft ${s.primary ? "border-primary/40 bg-gradient-to-br from-primary/10 to-background" : "border-border bg-card"}`}
            >
              <span className={`flex size-10 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-tight">{s.label}</span>
                <span className="block text-[11px] text-muted-foreground">{s.sub}</span>
              </span>
            </motion.button>
          ))}
        </motion.div>

        <div className="pb-24" />

        <CareLinkLogo size="sm" withWordmark={false} />
      </div>

      <HospitalBottomNav current="HOSPITAL_HOME" />
      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}
