"use client";

import { ChevronLeft } from "lucide-react";
import { useAppStore } from "@/store";
import { Button } from "@/components/ui/button";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { PatientBottomNav } from "@/layouts/BottomNav";
import { cn } from "@/utils";

export function PatientPageShell({
  title,
  currentTab,
  onBack,
  children,
  right,
  className,
  noBottomNav = false,
}: {
  title?: string;
  currentTab: string;
  onBack?: () => void;
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  noBottomNav?: boolean;
}) {
  const setView = useAppStore((s) => s.setView);

  return (
    <div className={cn("pb-safe-nav", className)}>
      <header className="sticky top-0 z-30 flex items-center gap-1 border-b border-border bg-background/85 px-3 py-2 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack ?? (() => setView("PATIENT_HOME"))}
          aria-label="Back"
          className="-ml-1"
        >
          <ChevronLeft />
        </Button>
        <CareLinkLogo size="sm" />
        {title && <h1 className="flex-1 truncate pl-1 text-base font-semibold">{title}</h1>}
        {!title && <div className="flex-1" />}
        {right && <div className="flex items-center gap-1">{right}</div>}
      </header>

      <div className="px-4 pb-6 pt-4">{children}</div>

      {!noBottomNav && <PatientBottomNav current={currentTab as never} />}
    </div>
  );
}
