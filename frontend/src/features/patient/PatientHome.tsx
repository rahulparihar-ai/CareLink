"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  History,
  FileText,
  Pill,
  FlaskConical,
  CalendarDays,
  IdCard,
  ShieldCheck,
  ShieldAlert,
  Users,
  Sparkles,
  Activity,
  Footprints,
  Moon,
  HeartPulse,
  Upload,
  Droplets,
  Syringe,
  Apple,
  Leaf,
} from "lucide-react";
import { useAppStore } from "@/store";
import { PatientHeader } from "@/layouts/AppHeader";
import { PatientBottomNav } from "@/layouts/BottomNav";
import { NavigationDrawer } from "@/layouts/NavigationDrawer";
import { SectionTitle, AIDisclaimer } from "@/components/shared/primitive";

import { useTranslation } from "@/i18n/useTranslation";
import { toneBg } from "@/utils";

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

  const categories: { title: string; items: { icon: typeof ClipboardList; title: string; tone: "primary" | "gold" | "green" | "pink" | "sky" | "danger" | "muted"; view: string }[] }[] = [
    {
      title: "My Health",
      items: [
        { icon: ClipboardList, title: "Medical History", tone: "primary", view: "PATIENT_HISTORY" },
        { icon: History, title: "Timeline", tone: "gold", view: "PATIENT_TIMELINE" },
        { icon: Pill, title: "Medications", tone: "green", view: "PATIENT_MEDICATIONS" },
        { icon: ShieldAlert, title: "Allergies", tone: "danger", view: "PATIENT_ALLERGIES" },
        { icon: Syringe, title: "Vaccinations", tone: "sky", view: "PATIENT_VACCINATION" },
      ],
    },
    {
      title: "Care",
      items: [
        { icon: CalendarDays, title: "Appointments", tone: "sky", view: "PATIENT_APPOINTMENTS" },
        { icon: Pill, title: "Prescriptions", tone: "green", view: "PATIENT_MEDICATIONS" },
        { icon: FlaskConical, title: "Lab Reports", tone: "pink", view: "PATIENT_LAB" },
      ],
    },
    {
      title: "My Records",
      items: [
        { icon: FileText, title: "Documents", tone: "primary", view: "PATIENT_DOCUMENTS" },
        { icon: IdCard, title: "ABHA Health ID", tone: "gold", view: "PATIENT_ABHA" },
        { icon: ShieldCheck, title: "Insurance", tone: "green", view: "PATIENT_INSURANCE" },
        { icon: Users, title: "Family Health", tone: "pink", view: "PATIENT_FAMILY" },
      ],
    },
    {
      title: "Wellness",
      items: [
        { icon: Leaf, title: "AYUSH History", tone: "green", view: "PATIENT_AYUSH" },
        { icon: Sparkles, title: "AI Guidance", tone: "gold", view: "PATIENT_AI" },
        { icon: Activity, title: "Quick Check", tone: "primary", view: "PATIENT_INTAKE" },
        { icon: Footprints, title: "Steps", tone: "green", view: "PATIENT_STEPS" },
        { icon: Moon, title: "Sleep", tone: "sky", view: "PATIENT_SLEEP" },
        { icon: Apple, title: "Nutrition", tone: "pink", view: "PATIENT_NUTRITION" },
      ],
    },
  ];

  return (
    <div className="pb-safe-nav">
      <PatientHeader
        onMenu={() => setDrawerOpen(true)}
        greeting={t("home.greeting")}
        subtitle={t("home.subtitle")}
      />

      <div className="px-4">
        {/* Health Snapshot */}
        <section className="mt-4">
          <SectionTitle title={t("home.healthSnapshot")} />
          <div className="overflow-hidden rounded-2xl bg-primary text-primary-foreground">
            <div className="flex items-center justify-between gap-2 border-b border-white/15 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/15">
                  {patientProfile?.name?.charAt(0) ?? "U"}
                </div>
                <div>
                  <p className="text-sm font-semibold">{patientProfile?.name ?? "Guest User"}</p>
                  <p className="text-xs text-white/80">{patientProfile?.id ?? "Complete your profile"}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-white/70">Last visit</p>
                <p className="text-sm font-semibold">{appointments.find((a) => a.status === "completed")?.date ?? "—"}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y divide-white/15">
              {[
                { label: "Blood Group", value: patientProfile?.bloodGroup ?? "—", status: "?" },
                { label: "Allergies", value: patientProfile?.allergies ?? "—", status: "?" },
                { label: "Conditions", value: patientProfile?.knownConditions ?? "—", status: "?" },
                { label: "Medications", value: patientProfile?.currentMedicines ?? "—", status: "?" },
              ].map((s) => (
                <div key={s.label} className="px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-white/70">{s.label}</p>
                  <p className="mt-0.5 truncate text-sm font-bold" title={s.value}>{s.value}</p>
                  <p className="text-[10px] text-emerald-300">{s.status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-6">
          <SectionTitle title={t("home.quickActions")} />
          <div className="grid grid-cols-2 gap-3">
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
          </div>
        </section>

        {/* Services by category */}
        {categories.map((cat, ci) => (
          <section className="mt-6" key={cat.title}>
            <SectionTitle title={cat.title} className={ci > 0 ? "mt-6" : ""} />
            <div className="grid grid-cols-3 gap-2.5">
              {cat.items.map((s, i) => (
                <motion.button
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView(s.view as never)}
                  className="elevate flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center card-soft"
                >
                  <span className={`flex size-10 items-center justify-center rounded-xl ${toneBg(s.tone)}`}>
                    <s.icon className="size-5" />
                  </span>
                  <span className="text-[11px] font-semibold leading-tight">{s.title}</span>
                </motion.button>
              ))}
            </div>
          </section>
        ))}

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
              <p className="mt-3 text-2xl font-bold">{stepsData ? stepsData.today.toLocaleString() : "—"}</p>
              <p className="text-xs text-muted-foreground">{t("wellness.stepsToday")}</p>
            </button>
            <button onClick={() => setView("PATIENT_SLEEP")} className="elevate rounded-2xl border border-border bg-card p-4 text-left card-soft">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600">
                  <Moon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold">{sleepData ? `${sleepData.todayHours}h` : "—"}</p>
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
