"use client";

import { useState } from "react";
import {
  Users, AlertTriangle, ClipboardCheck, FileText,
  CalendarDays, ChevronRight, Bell, Search, TrendingUp, Building2, Sparkles,
} from "lucide-react";
import { useAppStore } from "@/store";
import { NavigationDrawer } from "@/components/shared/NavigationDrawer";
import { StatusBadge, statusVariant } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

export function DoctorHome() {
  const setView = useAppStore((s) => s.setView);
  const doctor = useAppStore((s) => s.doctorProfile);
  const setSelectedPatientId = useAppStore((s) => s.setSelectedPatientId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const unread = useAppStore((s) => s.notifications.filter((n) => !n.read).length);
  const caseQueue = useAppStore((s) => s.caseQueue);

  const urgent = caseQueue.filter((p) => p.redFlagLevel === "URGENT").length;
  const needsReview = caseQueue.filter((p) => p.redFlagLevel === "NEEDS_REVIEW").length;
  const waiting = caseQueue.filter((p) => p.status === "WAITING").length;
  const pendingSummaries = caseQueue.filter((p) => p.summaryStatus === "pending").length;

  const queue = caseQueue.filter((p) => p.status !== "COMPLETED");

  const openPatient = (id: string) => {
    setSelectedPatientId(id);
    setView("DOCTOR_PATIENT");
  };

  return (
    <div className="pb-safe-nav">
      {/* Hospital Hub link */}
      <div className="mx-4 mt-3">
        <button onClick={() => setView("HOSPITAL_HOME")}
          className="flex w-full items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-xs font-medium text-muted-foreground card-soft transition-colors hover:border-primary/40 hover:text-primary">
          <Building2 className="size-4" />
          Hospital / Reception Desk
          <ChevronRight className="ml-auto size-3.5" />
        </button>
      </div>

      {/* AI clinical history link */}
      {useAppStore.getState().kioskSession?.summary && (
        <div className="mx-4 mt-2">
          <button onClick={() => setView("DOCTOR_CLINICAL")}
            className="flex w-full items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/5 p-2.5 text-xs font-medium text-violet-700 card-soft transition-colors hover:bg-violet-500/10">
            <Sparkles className="size-4" />
            New AI Clinical History ready for review
            <ChevronRight className="ml-auto size-3.5" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 px-4 pb-2 pt-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <button onClick={() => setDrawerOpen(true)} aria-label="Menu" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
              {doctor?.name?.replace("Dr. ", "").charAt(0)}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold leading-tight">{doctor?.name}</p>
              <p className="text-xs text-muted-foreground">{doctor?.specialization}</p>
            </div>
          </button>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => setView("DOCTOR_QUEUE")} aria-label="Search">
              <Search />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setView("NOTIFICATION_CENTER")} aria-label="Notifications" className="relative">
              <Bell />
              {unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{unread}</span>}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-4">
        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <StatCard icon={Users} label="Patients Waiting" value={waiting} tone="bg-sky-500/10 text-sky-600" />
          <StatCard icon={AlertTriangle} label="Urgent Cases" value={urgent} tone="bg-red-500/10 text-red-600" />
          <StatCard icon={ClipboardCheck} label="Needs Review" value={needsReview} tone="bg-amber-500/10 text-amber-600" />
          <StatCard icon={FileText} label="Pending Summaries" value={pendingSummaries} tone="bg-violet-500/10 text-violet-600" />
        </div>

        {/* Schedule */}
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Case-taking Queue</h2>
            <span className="flex items-center gap-1 text-xs font-medium text-primary"><CalendarDays className="size-3.5" /> {queue.length}</span>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 card-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Today&apos;s intake</p>
                <p className="text-xs text-muted-foreground">{doctor?.facility ?? "Facility not set"} · {doctor?.specialization ?? "—"}</p>
              </div>
              {queue.length > 0 ? (
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">{queue.length} awaiting</span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">No cases yet</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <TrendingUp className="size-3.5" /> Cases captured at the clinic appear here automatically
            </div>
          </div>
        </section>

        {/* Priority cases */}
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Priority Cases</h2>
            <button onClick={() => setView("DOCTOR_PRIORITY")} className="text-xs font-medium text-primary">View all</button>
          </div>
          <div className="space-y-2">
            {queue.filter((p) => p.redFlagLevel !== "NORMAL").slice(0, 3).map((p) => (
              <button key={p.id} onClick={() => openPatient(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
                <div className="flex-1">
                  <p className="font-semibold">{p.name} <span className="text-xs font-normal text-muted-foreground">· {p.age}</span></p>
                  <p className="truncate text-xs text-muted-foreground">{p.chiefComplaint}</p>
                </div>
                <StatusBadge variant={statusVariant(p.redFlagLevel ?? "normal")} dot>{p.redFlagLevel?.replace("_", " ")}</StatusBadge>
              </button>
            ))}
            {queue.filter((p) => p.redFlagLevel !== "NORMAL").length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center text-sm text-muted-foreground">
                No priority cases. When a case-taking flags something urgent, it appears here.
              </div>
            )}
          </div>
        </section>

        {/* Patient queue */}
        <section className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Patient Queue</h2>
            <button onClick={() => setView("DOCTOR_QUEUE")} className="text-xs font-medium text-primary">View all</button>
          </div>
          <div className="space-y-2">
            {queue.slice(0, 4).map((p) => (
              <button key={p.id} onClick={() => openPatient(p.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 card-soft">
                <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">{p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.chiefComplaint}</p>
                </div>
                <span className="text-xs font-medium">{p.waitTime}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
            {queue.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card/50 p-5 text-center text-sm text-muted-foreground">
                No patients in the queue yet. Patients captured at the reception/clinic kiosk will appear here.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="h-10" />
      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5 card-soft">
      <div className="flex items-center justify-between">
        <span className={`flex size-9 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
