"use client";

import { motion } from "framer-motion";
import { CalendarDays, FileText, MessageSquare, CalendarClock, HeartPulse, ShieldCheck, CheckCheck, Bell } from "lucide-react";
import { useAppStore } from "@/store";
import { PatientPageShell } from "@/components/shared/PatientPageShell";
import { EmptyState } from "@/components/shared/primitive";
import { cn } from "@/lib/utils";

const typeIcon: Record<string, { icon: React.ComponentType<{ className?: string }>; bg: string }> = {
  appointment: { icon: CalendarDays, bg: "bg-primary/10 text-primary" },
  document: { icon: FileText, bg: "bg-sky-500/10 text-sky-600" },
  doctor: { icon: MessageSquare, bg: "bg-emerald-500/10 text-emerald-600" },
  followup: { icon: CalendarClock, bg: "bg-amber-500/10 text-amber-600" },
  health: { icon: HeartPulse, bg: "bg-pink-500/10 text-pink-600" },
  consent: { icon: ShieldCheck, bg: "bg-violet-500/10 text-violet-600" },
};

export function NotificationCenter() {
  const setView = useAppStore((s) => s.setView);
  const notifications = useAppStore((s) => s.notifications);
  const markRead = useAppStore((s) => s.markNotificationRead);
  const markAll = useAppStore((s) => s.markAllNotificationsRead);

  return (
    <PatientPageShell
      title="Notifications"
      currentTab="PATIENT_HOME"
      onBack={() => setView("PATIENT_HOME")}
      right={
        <button onClick={markAll} className="flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium">
          <CheckCheck className="size-3.5" /> Mark all read
        </button>
      }
    >
      {notifications.length === 0 ? (
        <EmptyState title="No notifications" icon={Bell} />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n, i) => {
            const meta = typeIcon[n.category] ?? { icon: Bell, bg: "bg-muted text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <motion.button
                key={n.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left card-soft transition-colors",
                  n.read ? "border-border bg-card opacity-70" : "border-primary/30 bg-primary/5"
                )}
              >
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", meta.bg)}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{n.title}</p>
                    {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{timeAgo(n.timestamp)}</p>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </PatientPageShell>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
