"use client";

import { useState } from "react";
import {
  User, BadgeCheck, Building2, Volume2, Palette, Accessibility,
  LogOut, ChevronRight, Save, Globe, Check,
} from "lucide-react";
import { useAppStore } from "@/store";
import { DoctorPageShell } from "@/layouts/DoctorPageShell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";
import type { ThemeName } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/i18n/translations";
import { verificationLabel } from "@/data/organizations";

const themes: { key: ThemeName; swatch: string }[] = [
  { key: "white", swatch: "bg-white border border-black/10" },
  { key: "blue", swatch: "bg-sky-500" },
  { key: "green", swatch: "bg-emerald-500" },
  { key: "pink", swatch: "bg-pink-500" },
  { key: "gold", swatch: "bg-yellow-500" },
  { key: "black", swatch: "bg-neutral-900" },
];

export function DoctorSettingsView() {
  const setView = useAppStore((s) => s.setView);
  const doctor = useAppStore((s) => s.doctorProfile);
  const setDoctorProfile = useAppStore((s) => s.setDoctorProfile);
  const setThemeColor = useAppStore((s) => s.setThemeColor);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const setHighContrast = useAppStore((s) => s.setHighContrast);
  const setLargeText = useAppStore((s) => s.setLargeText);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const highContrast = useAppStore((s) => s.highContrast);
  const largeText = useAppStore((s) => s.largeText);
  const themeColor = useAppStore((s) => s.themeColor);
  const logout = useAppStore((s) => s.logout);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const [name, setName] = useState(doctor?.name ?? "");
  const [specialization, setSpecialization] = useState(doctor?.specialization ?? "");
  const [facility, setFacility] = useState(doctor?.facility ?? "");
  const [languages, setLanguages] = useState((doctor?.languages ?? []).join(", "));

  const { t } = useTranslation();

  return (
    <DoctorPageShell title="Doctor Settings" currentTab="DOCTOR_SETTINGS">
      {/* Professional verification & affiliation (separate concepts) */}
      <div className="rounded-2xl border border-border bg-card p-4 card-soft">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><BadgeCheck className="size-4 text-primary" /> Verification</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Professional Verification</p>
            <StatusBadge variant={doctor?.professionalVerification === "verified" ? "success" : "warning"} dot>
              {doctor?.professionalVerification === "verified" ? "Demo Verified" : "Verification Pending"}
            </StatusBadge>
          </div>
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Workplace Affiliation</p>
            {doctor?.affiliationStatus === "none" ? (
              <StatusBadge variant="muted" dot>Independent</StatusBadge>
            ) : doctor?.affiliationStatus === "approved" ? (
              <StatusBadge variant="success" dot>Approved</StatusBadge>
            ) : (
              <StatusBadge variant="warning" dot>Affiliation Pending</StatusBadge>
            )}
          </div>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {doctor?.practiceType} · {doctor?.workplace || "No workplace set"} · {verificationLabel(doctor?.professionalVerification ?? "pending")} is a demo label, not government verification.
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl border border-border bg-card p-4 card-soft">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><User className="size-4 text-primary" /> Profile</h2>
        <div className="space-y-2.5">
          <Field label="Name" icon={User} value={name} onChange={setName} />
          <Field label="Specialization" icon={BadgeCheck} value={specialization} onChange={setSpecialization} />
          <Field label="Facility" icon={Building2} value={facility} onChange={setFacility} />
          <Field label="Languages" icon={Volume2} value={languages} onChange={setLanguages} />
        </div>
        <Button className="mt-3 w-full" onClick={() => { setDoctorProfile({ ...doctor!, name: name, specialization, facility }); setView("DOCTOR_HOME"); }}><Save className="size-4 mr-1.5" /> Save changes</Button>
      </div>

      {/* Appearance */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Palette className="size-4 text-primary" /> Theme</h2>
        <div className="grid grid-cols-6 gap-2">
          {themes.map((th) => (
            <button key={th.key} onClick={() => setThemeColor(th.key)} aria-label={`${th.key} theme`}
              className={cn("aspect-square rounded-full border-2 transition-all", themeColor === th.key ? "border-primary scale-110" : "border-border", th.swatch)}
            />
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Globe className="size-4 text-primary" /> Language</h2>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button key={lang.code} onClick={() => setLanguage(lang.code)}
              className={cn("flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all", language === lang.code ? "border-primary bg-primary/5" : "border-border hover:bg-muted")}>
              <span>
                <span className="block font-medium">{lang.name}</span>
                <span className="block text-[11px] text-muted-foreground">{lang.nativeName}</span>
              </span>
              {language === lang.code && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Accessibility */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Accessibility className="size-4 text-primary" /> Accessibility</h2>
        <div className="space-y-3">
          <ToggleRow label="Reduced motion" desc="Minimize animations" checked={reducedMotion} onChange={setReducedMotion} />
          <ToggleRow label="High contrast" desc="Stronger color contrast" checked={highContrast} onChange={setHighContrast} />
          <ToggleRow label="Larger text" desc="Increase font sizes" checked={largeText} onChange={setLargeText} />
        </div>
      </div>

      {/* Account */}
      <div className="mt-4 rounded-2xl border border-border bg-card p-2 card-soft">
        <button onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600">
          <LogOut className="size-5" /> Sign out
          <ChevronRight className="ml-auto size-4" />
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] text-muted-foreground">{t("demoNote")}</p>
    </DoctorPageShell>
  );
}

function Field({ label, value, onChange, icon: Icon }: { label: string; value: string; onChange: (v: string) => void; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-input bg-card py-2.5 pl-9 pr-3 text-sm outline-none focus:border-ring" />
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <button onClick={() => onChange(!checked)} role="switch" aria-checked={checked}
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted-foreground/30")}>
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}
