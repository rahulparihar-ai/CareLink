"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  UserRound,
  ClipboardList,
  History,
  FileText,
  Pill,
  FlaskConical,
  CalendarDays,
  Stethoscope,
  IdCard,
  ShieldCheck,
  Users,
  Siren,
  Sparkles,
  Activity,
  Footprints,
  Moon,
  Settings,
  HeartPulse,
  Upload,
  CalendarPlus,
  Droplets,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientHeader } from "@/components/shared/AppHeader";
import { PatientBottomNav } from "@/components/shared/BottomNav";
import { NavigationDrawer } from "@/components/shared/NavigationDrawer";
import { SectionTitle, AIDisclaimer } from "@/components/shared/primitive";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LiveVitalsCard } from "@/components/shared/LiveVitalsCard";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function PatientHome() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const appointments = useAppStore((s) => s.appointments);
  const labReports = useAppStore((s) => s.labReports);
  const stepsData = useAppStore((s) => s.stepsData);
  const sleepData = useAppStore((s) => s.sleepData);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const upcoming = appointments.find((a) => a.status === "upcoming");

  const services = [
    { icon: UserRound, title: t("service.healthProfile"), desc: "Personal & contact details", tone: "primary" as const, view: "PATIENT_PROFILE" as const },
    { icon: ClipboardList, title: t("service.medicalHistory"), desc: "Conditions, surgeries & more", tone: "sky" as const, view: "PATIENT_HISTORY" as const },
    { icon: History, title: t("service.timeline"), desc: "Your health over time", tone: "gold" as const, view: "PATIENT_TIMELINE" as const },
    { icon: FileText, title: t("service.documents"), desc: "Reports & records", tone: "primary" as const, view: "PATIENT_DOCUMENTS" as const },
    { icon: Pill, title: t("service.prescriptions"), desc: "Medications list", tone: "green" as const, view: "PATIENT_MEDICATIONS" as const },
    { icon: FlaskConical, title: t("service.labReports"), desc: "View results", tone: "pink" as const, view: "PATIENT_LAB" as const },
    { icon: CalendarDays, title: t("service.appointments"), desc: "Book & manage", tone: "sky" as const, view: "PATIENT_APPOINTMENTS" as const },
    { icon: Stethoscope, title: t("service.doctors"), desc: "Find specialists", tone: "primary" as const, view: "PATIENT_DOCTORS" as const },
    { icon: IdCard, title: t("service.abha"), desc: "Health ID & consent", tone: "gold" as const, view: "PATIENT_ABHA" as const },
    { icon: ShieldCheck, title: t("service.insurance"), desc: "Policies & coverage", tone: "green" as const, view: "PATIENT_INSURANCE" as const },
    { icon: Users, title: t("service.family"), desc: "Family history", tone: "pink" as const, view: "PATIENT_FAMILY" as const },
    { icon: Siren, title: t("service.emergency"), desc: "Critical info", tone: "danger" as const, view: "PATIENT_EMERGENCY" as const },
    { icon: Sparkles, title: t("service.aiHealth"), desc: "Ask anything", tone: "gold" as const, view: "PATIENT_AI" as const },
    { icon: Activity, title: t("service.checkin"), desc: "Quick health check", tone: "primary" as const, view: "PATIENT_INTAKE" as const },
    { icon: Footprints, title: t("service.steps"), desc: "Track activity", tone: "green" as const, view: "PATIENT_STEPS" as const },
    { icon: Moon, title: t("service.sleep"), desc: "Sleep insights", tone: "sky" as const, view: "PATIENT_SLEEP" as const },
    { icon: Settings, title: t("service.settings"), desc: "Preferences", tone: "muted" as const, view: "PATIENT_SETTINGS" as const },
  ];

  return (
    <div className="pb-safe-nav">
      <PatientHeader
        onMenu={() => setDrawerOpen(true)}
        greeting={t("home.greeting")}
        subtitle={t("home.subtitle")}
      />

      <div className="px-4">
        {/* Hospital Hub link */}
        <button onClick={() => setView("HOSPITAL_HOME")}
          className="mb-3 mt-2 flex w-full items-center gap-2 rounded-xl border border-border bg-card p-2.5 text-xs font-medium text-muted-foreground card-soft transition-colors hover:border-primary/40 hover:text-primary">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          Hospital Hub
          <span className="ml-auto text-muted-foreground/60">&#8250;</span>
        </button>

        {/* Health Snapshot */}
        <section className="mt-4">
          <SectionTitle title={t("home.healthSnapshot")} />
          <div className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="flex items-center justify-between gap-2 border-b border-white/15 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/15">
                  {patientProfile?.name?.charAt(0) ?? "R"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{patientProfile?.name ?? "Rahul Sharma"}</p>
                  <p className="text-xs text-white/80">{patientProfile?.id}</p>
                </div>
              </div>
              <StatusBadge variant="default" className="bg-white/15 text-white" dot>
                {t("snapshot.bloodGroup")} {patientProfile?.bloodGroup ?? "B+"}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-4 divide-x divide-white/15 text-center">
              {[
                { label: t("snapshot.age"), value: String(patientProfile?.age ?? 34) },
                { label: t("snapshot.conditions"), value: "2" },
                { label: t("snapshot.medication"), value: "1" },
                { label: t("snapshot.lastVisit"), value: "Aug" },
              ].map((s) => (
                <div key={s.label} className="px-1 py-3">
                  <p className="text-base font-bold">{s.value}</p>
                  <p className="mt-0.5 text-[10px] text-white/75">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Live Vitals Monitor */}
        <section className="mt-4">
          <LiveVitalsCard />
        </section>

        {/* Quick Actions */}
        <section className="mt-6">
          <SectionTitle title={t("home.quickActions")} />
          <div className="grid grid-cols-2 gap-3">
            <QuickAction
              icon={CalendarPlus}
              label={t("home.bookAppointment")}
              onClick={() => setView("PATIENT_BOOK_APPOINTMENT")}
              tone="primary"
            />
            <QuickAction
              icon={Upload}
              label={t("home.uploadReport")}
              onClick={() => setView("PATIENT_OCR")}
              tone="green"
            />
            <QuickAction
              icon={Sparkles}
              label={t("service.aiHealth")}
              onClick={() => setView("PATIENT_AI")}
              tone="gold"
            />
            <QuickAction
              icon={Siren}
              label={t("home.emergencyCard")}
              onClick={() => setView("PATIENT_EMERGENCY")}
              tone="danger"
            />
          </div>
        </section>

        {/* My Health */}
        <section className="mt-6">
          <SectionTitle title={t("home.myHealth")} action={t("common.viewAll")} onAction={() => setView("PATIENT_HISTORY")} />
          <div className="grid grid-cols-3 gap-2.5">
            <MiniTile icon={ClipboardList} label={t("service.medicalHistory")} onClick={() => setView("PATIENT_HISTORY")} />
            <MiniTile icon={History} label={t("service.timeline")} onClick={() => setView("PATIENT_TIMELINE")} />
            <MiniTile icon={Pill} label={t("service.prescriptions")} onClick={() => setView("PATIENT_MEDICATIONS")} />
          </div>
        </section>

        {/* Services Grid */}
        <section className="mt-6">
          <SectionTitle title={t("home.services")} />
          <div className="grid grid-cols-2 gap-3">
            {services.map((s, i) => (
              <motion.button
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setView(s.view)}
                className="elevate flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft"
              >
                <span className={`mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl ${toneBg(s.tone)}`}>
                  <s.icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-tight">{s.title}</span>
                  {s.desc && <span className="mt-0.5 block text-[11px] text-muted-foreground">{s.desc}</span>}
                </span>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section className="mt-6">
          <SectionTitle title={t("home.recentActivity")} />
          <div className="space-y-2">
            {upcoming && (
              <ActivityRow
                icon={CalendarDays}
                iconBg="bg-primary/10 text-primary"
                title={`${t("appt.title")} · ${upcoming.doctorName}`}
                subtitle={`${upcoming.date} · ${upcoming.time}`}
              />
            )}
            {labReports[0] && (
              <ActivityRow
                icon={FlaskConical}
                iconBg="bg-emerald-500/10 text-emerald-600"
                title={labReports[0].title}
                subtitle={`${labReports[0].date} · ${labReports[0].status}`}
              />
            )}
          </div>
        </section>

        {/* AI Assistant card */}
        <section className="mt-6">
          <button
            onClick={() => setView("PATIENT_AI")}
            className="hero-glow block w-full rounded-2xl border border-primary/20 bg-card p-4 text-left card-soft"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--gold-soft)] text-[var(--gold-foreground)]">
                <HeartPulse className="size-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{t("home.aiAssistant")}</p>
                <p className="text-xs text-muted-foreground">
                  &ldquo;What medications are in my record?&rdquo;
                </p>
              </div>
              <span className="text-primary">&rarr;</span>
            </div>
            <AIDisclaimer className="mt-3" />
          </button>
        </section>

        {/* Wellness */}
        <section className="mt-6">
          <SectionTitle title={t("home.wellness")} action={t("common.viewAll")} onAction={() => setView("PATIENT_WELLNESS")} />
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setView("PATIENT_STEPS")} className="elevate rounded-2xl border border-border bg-card p-4 text-left card-soft">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Footprints className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold">{stepsData.today.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t("wellness.stepsToday")}</p>
            </button>
            <button onClick={() => setView("PATIENT_SLEEP")} className="elevate rounded-2xl border border-border bg-card p-4 text-left card-soft">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                  <Moon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold">{sleepData.todayHours}h</p>
              <p className="text-xs text-muted-foreground">{t("wellness.avgSleep")}</p>
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
            <Droplets className="size-3.5" />
            {t("wellness.benchmarkHint")}
          </div>
        </section>
      </div>

      <div className="h-10" />
      <PatientBottomNav current="PATIENT_HOME" />
      <NavigationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  tone: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="elevate flex items-center gap-3 rounded-2xl border border-border bg-card p-3.5 text-left card-soft"
    >
      <span className={`flex size-10 items-center justify-center rounded-xl ${toneBg(tone)}`}>
        <Icon className="size-5" />
      </span>
      <span className="text-[13px] font-semibold leading-tight">{label}</span>
    </motion.button>
  );
}

function MiniTile({ icon: Icon, label, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="elevate flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center card-soft"
    >
      <Icon className="size-5 text-primary" />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </motion.button>
  );
}

function ActivityRow({ icon: Icon, iconBg, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; iconBg: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 card-soft">
      <span className={`flex size-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

const toneBg = (tone: string) => {
  switch (tone) {
    case "primary":
      return "bg-primary/10 text-primary";
    case "gold":
      return "bg-[var(--gold-soft)] text-[var(--gold-foreground)]";
    case "green":
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
    case "pink":
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400";
    case "sky":
      return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
    case "danger":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "muted":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-primary/10 text-primary";
  }
};
