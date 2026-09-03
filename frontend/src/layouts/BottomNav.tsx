"use client";

import { Home, User, Stethoscope, LayoutGrid, HeartHandshake, UserPlus } from "lucide-react";
import { cn } from "@/utils";
import { useAppStore, type View } from "@/store";
import { useTranslation } from "@/i18n/useTranslation";

interface Tab {
  key: View;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function BottomNav({
  tabs,
  current,
  onSelect,
}: {
  tabs: Tab[];
  current: View;
  onSelect: (v: View) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-border bg-card/95 backdrop-blur-md pb-safe lg:max-w-[820px]"
      aria-label="Main navigation"
    >
      <div className="grid grid-cols-5 px-1">
        {tabs.map((tab) => {
          const active = current === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-all",
                  active && "bg-primary/12"
                )}
              >
                <Icon className={cn("size-5 transition-all", active && "scale-110")} />
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function PatientBottomNav({ current }: { current: View }) {
  const setView = useAppStore((s) => s.setView);
  const { t } = useTranslation();
  const patientTabs: Tab[] = [
    { key: "PATIENT_HOME", label: t("nav.home"), icon: Home },
    { key: "PATIENT_HISTORY", label: t("nav.health"), icon: HeartHandshake },
    { key: "PATIENT_APPOINTMENTS", label: t("nav.appointments"), icon: LayoutGrid },
    { key: "PATIENT_AI", label: t("nav.ai"), icon: Stethoscope },
    { key: "PATIENT_PROFILE", label: t("nav.profile"), icon: User },
  ];
  return <BottomNav tabs={patientTabs} current={current} onSelect={setView} />;
}

export function HospitalBottomNav({ current }: { current: View }) {
  const setView = useAppStore((s) => s.setView);
  const { t } = useTranslation();
  const hospitalTabs: Tab[] = [
    { key: "HOSPITAL_HOME", label: t("nav.home"), icon: Home },
    { key: "REGISTER_PATIENT", label: t("doctor.registerPatient"), icon: UserPlus },
  ];
  return <BottomNav tabs={hospitalTabs} current={current} onSelect={setView} />;
}
