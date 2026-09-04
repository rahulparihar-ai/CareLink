"use client";

import { ChevronLeft, LayoutDashboard, Users, Activity, FileText, User, Stethoscope, HeartHandshake, CalendarCheck } from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";

export function DoctorBottomNav({ current }: { current: string }) {
  const setView = useAppStore((s) => s.setView);
  const { t } = useTranslation();
  const tabs = [
    { key: "DOCTOR_HOME", label: t("doctor.dashboard"), icon: LayoutDashboard },
    { key: "DOCTOR_QUEUE", label: t("doctor.patients"), icon: Users },
    { key: "DOCTOR_PRIORITY", label: t("doctor.priority"), icon: Activity },
    { key: "DOCTOR_CASES", label: t("doctor.cases"), icon: Stethoscope },
    { key: "DOCTOR_PRESCRIPTIONS", label: t("doctor.prescriptions"), icon: HeartHandshake },
    { key: "DOCTOR_FOLLOWUPS", label: t("doctor.followups"), icon: CalendarCheck },
    { key: "DOCTOR_NOTES", label: t("doctor.notes"), icon: FileText },
    { key: "DOCTOR_SETTINGS", label: t("nav.profile"), icon: User },
  ];
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[640px] border-t border-border bg-card/95 backdrop-blur-md pb-safe lg:max-w-[820px]" aria-label="Doctor navigation">
      <div className="grid grid-cols-8 px-0.5">
        {tabs.map((t) => {
          const active = current === t.key;
          return (
            <button key={t.key} onClick={() => setView(t.key as never)}
              className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground")}>
              <span className={cn("flex h-8 w-14 items-center justify-center rounded-full transition-all", active && "bg-primary/12")}>
                <t.icon className={cn("size-5", active && "scale-110")} />
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function DoctorPageShell({
  title, currentTab, onBack, children, right, sub,
}: {
  title: string;
  currentTab: string;
  onBack?: () => void;
  children: React.ReactNode;
  right?: React.ReactNode;
  sub?: string;
}) {
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="pb-safe-nav">
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={onBack ?? (() => setView("DOCTOR_HOME"))} aria-label="Back" className="-ml-1">
          <ChevronLeft />
        </Button>
        <CareLinkLogo size="sm" />
        <div className="min-w-0 flex-1 pl-1">
          <h1 className="truncate text-base font-semibold leading-tight">{title}</h1>
          {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
        </div>
        {right}
      </header>
      <div className="px-4 pb-6 pt-4">{children}</div>
      <DoctorBottomNav current={currentTab} />
    </div>
  );
}
