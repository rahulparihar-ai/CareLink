"use client";

import {
  Palette,
  Lock,
  Accessibility,
  HelpCircle,
  LogOut,
  Moon,
  Eye,
  Globe,
  Check,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/layouts/PatientPageShell";
import { cn } from "@/utils";
import type { ThemeName } from "@/types";
import { Switch } from "@/components/shared/switch";
import { SUPPORTED_LANGUAGES } from "@/i18n/translations";

const themes: { key: ThemeName; label: string; swatch: string; isDark?: boolean }[] = [
  { key: "white", label: "White", swatch: "bg-white border border-black/10" },
  { key: "blue", label: "Blue", swatch: "bg-sky-500" },
  { key: "green", label: "Green", swatch: "bg-emerald-500" },
  { key: "pink", label: "Pink", swatch: "bg-pink-500" },
  { key: "gold", label: "Golden Yellow", swatch: "bg-yellow-500" },
  { key: "black", label: "Black", swatch: "bg-neutral-900", isDark: true },
];

export function PatientSettingsView() {
  const themeColor = useAppStore((s) => s.themeColor);
  const setThemeColor = useAppStore((s) => s.setThemeColor);
  const language = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const highContrast = useAppStore((s) => s.highContrast);
  const setHighContrast = useAppStore((s) => s.setHighContrast);
  const largeText = useAppStore((s) => s.largeText);
  const setLargeText = useAppStore((s) => s.setLargeText);
  const logout = useAppStore((s) => s.logout);
  const pinEnabled = useAppStore((s) => s.pinEnabled);
  const setPinEnabled = useAppStore((s) => s.setPinEnabled);
  const pin = useAppStore((s) => s.pin);

  return (
    <PatientPageShell title="Settings" currentTab="PATIENT_SETTINGS">
      {/* Theme Center */}
      <section className="rounded-2xl border border-border bg-card p-4 card-soft">
        <div className="flex items-center gap-2">
          <Palette className="size-5 text-primary" />
          <h2 className="font-semibold">Theme Center</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Pick a theme — the whole app updates instantly.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2.5">
          {themes.map((th) => (
            <button
              key={th.key}
              onClick={() => setThemeColor(th.key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border p-3 transition-all",
                themeColor === th.key ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full ring-1 ring-black/5",
                  th.swatch
                )}
              >
                {themeColor === th.key && (
                  <span
                    className={cn(
                      "size-3 rounded-full bg-white shadow",
                      th.isDark && "bg-black"
                    )}
                  />
                )}
              </span>
              <span className="text-[11px] font-medium">{th.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Language */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <div className="flex items-center gap-2">
          <Globe className="size-5 text-primary" />
          <h2 className="font-semibold">Language</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose your language. Urdu switches the layout to right-to-left.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={cn(
                "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all",
                language === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              )}
            >
              <span>
                <span className="block font-medium">{lang.name}</span>
                <span className="block text-[11px] text-muted-foreground">{lang.nativeName}</span>
              </span>
              {language === lang.code && <Check className="size-4 text-primary" />}
            </button>
          ))}
        </div>
      </section>

      {/* Accessibility */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <div className="flex items-center gap-2">
          <Accessibility className="size-5 text-primary" />
          <h2 className="font-semibold">Accessibility</h2>
        </div>
        <div className="mt-3 space-y-3">
          <SwitchRow label="Reduce motion" checked={reducedMotion} onChange={setReducedMotion} icon={Moon} />
          <SwitchRow label="High contrast" checked={highContrast} onChange={setHighContrast} icon={Eye} />
          <SwitchRow label="Large text" checked={largeText} onChange={setLargeText} icon={HelpCircle} />
        </div>
      </section>

      {/* PIN lock */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-4 card-soft">
        <div className="flex items-center gap-2">
          <Lock className="size-5 text-primary" />
          <h2 className="font-semibold">App Lock</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Frontend PIN simulation. Not real biometric security.
        </p>
        {pinEnabled ? (
          <button
            onClick={() => setPinEnabled(false)}
            className="mt-3 w-full rounded-xl bg-destructive/10 py-2.5 text-sm font-medium text-destructive"
          >
            {pin ? "Change / reset PIN (demo)" : "Disable app lock"}
          </button>
        ) : (
          <button
            onClick={() => setPinEnabled(true)}
            className="mt-3 w-full rounded-xl bg-primary/10 py-2.5 text-sm font-medium text-primary"
          >
            Set up PIN (demo)
          </button>
        )}
      </section>

      {/* Logout */}
      <button
        onClick={() => logout()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-3 text-sm font-semibold text-destructive"
      >
        <LogOut className="size-4" /> Log Out
      </button>
    </PatientPageShell>
  );
}

function SwitchRow({
  label,
  checked,
  onChange,
  icon: Icon,
}: {
  label: string;
  checked: boolean;
  onChange: (b: boolean) => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2.5 text-sm">
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
