"use client";

import { Bell, ChevronLeft, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";

export function AppHeader({
  title,
  onBack,
  onMenu,
  showLogo = false,
  right,
  className,
}: {
  title?: string;
  onBack?: () => void;
  onMenu?: () => void;
  showLogo?: boolean;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur-md",
        className
      )}
    >
      {onBack && (
        <Button variant="ghost" size="icon" onClick={onBack} aria-label="Back" className="-ml-2">
          <ChevronLeft />
        </Button>
      )}
      {onMenu && (
        <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Menu" className="-ml-2">
          <Menu />
        </Button>
      )}
      {showLogo && <CareLinkLogo size="sm" withWordmark={false} />}
      {title && <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>}
      <div className="flex flex-1 items-center justify-end gap-1.5">{right}</div>
    </header>
  );
}

export function PatientHeader({
  onMenu,
  greeting,
  subtitle,
}: {
  onMenu?: () => void;
  greeting: string;
  subtitle: string;
}) {
  const patientProfile = useAppStore((s) => s.patientProfile);
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const setView = useAppStore((s) => s.setView);
  const name = patientProfile?.name?.split(" ")[0] ?? "there";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 px-4 pb-2 pt-3 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {onMenu && (
            <Button variant="ghost" size="icon" onClick={onMenu} aria-label="Menu" className="-ml-2">
              <Menu />
            </Button>
          )}
          <CareLinkLogo size="sm" />
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifications"
            className="relative"
            onClick={() => setView("NOTIFICATION_CENTER")}
          >
            <Bell />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Button>
          <button
            onClick={() => setView("PATIENT_PROFILE")}
            className="size-9 overflow-hidden rounded-full bg-primary/15 ring-1 ring-primary/20"
            aria-label="Profile"
          >
            <span className="flex h-full w-full items-center justify-center bg-primary/15 text-sm font-semibold text-primary">
              {name.charAt(0)}
            </span>
          </button>
        </div>
      </div>
      <div className="mt-3">
        <h1 className="text-xl font-bold tracking-tight">
          {greeting}, <span className="text-primary">{name}</span>
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </header>
  );
}
