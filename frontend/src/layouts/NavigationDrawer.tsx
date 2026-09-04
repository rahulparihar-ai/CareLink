"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  HeartHandshake,
  LayoutGrid,
  FileText,
  Stethoscope,
  User,
  Settings,
  X,
  LogOut,
  History,
  Activity,
  UserPlus,
  ScanLine,
} from "lucide-react";
import { useAppStore, type View } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";

interface DrawerItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  view?: View;
  onClick?: () => void;
}

export function NavigationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const role = useAppStore((s) => s.role);
  const setView = useAppStore((s) => s.setView);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const logout = useAppStore((s) => s.logout);
  const { t } = useTranslation();

  const go = (v: View) => {
    setView(v);
    onClose();
  };

  const patientItems: DrawerItem[] = [
    { label: t("nav.health"), icon: HeartHandshake, view: "PATIENT_HISTORY" },
    { label: t("nav.appointments"), icon: LayoutGrid, view: "PATIENT_APPOINTMENTS" },
    { label: t("nav.documents"), icon: FileText, view: "PATIENT_DOCUMENTS" },
    { label: t("timeline.title"), icon: History, view: "PATIENT_TIMELINE" },
    { label: t("nav.ai"), icon: Stethoscope, view: "PATIENT_AI" },
    { label: t("nav.profile"), icon: User, view: "PATIENT_PROFILE" },
    { label: t("nav.settings"), icon: Settings, view: "PATIENT_SETTINGS" },
  ];

  const doctorItems: DrawerItem[] = [
    { label: t("doctor.dashboard"), icon: Home, view: "DOCTOR_HOME" },
    { label: t("doctor.patients"), icon: User, view: "DOCTOR_QUEUE" },
    { label: t("doctor.priority"), icon: Activity, view: "DOCTOR_PRIORITY" },
    { label: t("doctor.cases"), icon: Stethoscope, view: "DOCTOR_CASES" },
    { label: t("doctor.notes"), icon: FileText, view: "DOCTOR_NOTES" },
    { label: t("doctor.prescriptions"), icon: HeartHandshake, view: "DOCTOR_PRESCRIPTIONS" },
    { label: t("doctor.followups"), icon: LayoutGrid, view: "DOCTOR_FOLLOWUPS" },
    { label: t("doctor.registerPatient"), icon: UserPlus, view: "REGISTER_PATIENT" },
    { label: t("doctor.scanPrescription"), icon: ScanLine, view: "SCAN_PRESCRIPTION" },
    { label: t("nav.settings"), icon: Settings, view: "DOCTOR_SETTINGS" },
  ];

  const items = role === "DOCTOR" ? doctorItems : patientItems;
  const profile = role === "DOCTOR" ? doctorProfile : patientProfile;
  const name = profile?.name ?? "Guest";
  const id = role === "DOCTOR" ? (doctorProfile?.professionalId ?? "") : (patientProfile?.id ?? "");

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute inset-y-0 left-0 flex w-[82%] max-w-[320px] flex-col border-r border-border bg-card shadow-2xl"
          >
            <div className="hero-glow border-b border-border px-5 pt-6 pb-4">
              <div className="flex items-start justify-between">
                <CareLinkLogo size="md" />
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-base font-semibold text-primary">
                  {name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {role === "DOCTOR" ? doctorProfile?.specialization : id}
                  </p>
                </div>
              </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => item.view && go(item.view)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                      <Icon className="size-5" />
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="border-t border-border p-3">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10"
              >
                <LogOut className="size-5" />
                {t("auth.logout")}
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
