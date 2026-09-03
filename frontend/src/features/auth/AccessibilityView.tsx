"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Accessibility, Mic, Eye, Sun, Moon, Languages } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/utils";

function ToggleItem({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: typeof Eye;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors"
      role="switch"
      aria-checked={checked}
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-6 rounded-full bg-white shadow transition-all",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

export function AccessibilityView() {
  const { t } = useTranslation();
  const setView = useAppStore((s) => s.setView);
  const largeText = useAppStore((s) => s.largeText);
  const setLargeText = useAppStore((s) => s.setLargeText);
  const highContrast = useAppStore((s) => s.highContrast);
  const setHighContrast = useAppStore((s) => s.setHighContrast);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);
  const audioGuided = useAppStore((s) => s.audioGuided);
  const setAudioGuided = useAppStore((s) => s.setAudioGuided);

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="flex items-center p-4">
        <Button variant="ghost" size="icon" onClick={() => setView("WELCOME")} aria-label="Back">
          <ChevronLeft />
        </Button>
        <div className="mx-auto">
          <CareLinkLogo size="sm" />
        </div>
        <div className="w-9" />
      </div>

      <div className="px-6 pt-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Accessibility className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">{t("auth.accessibility")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("a11y.accessibilityHint")}</p>
        </motion.div>
      </div>

      <div className="mt-6 space-y-3 px-6">
        <ToggleItem
          icon={Mic}
          label={t("a11y.audioGuided")}
          desc={t("a11y.audioGuidedHint")}
          checked={audioGuided}
          onChange={setAudioGuided}
        />
        <ToggleItem
          icon={Eye}
          label={t("a11y.largeText")}
          desc={t("a11y.largeTextHint")}
          checked={largeText}
          onChange={setLargeText}
        />
        <ToggleItem
          icon={Sun}
          label={t("a11y.highContrast")}
          desc={t("a11y.highContrastHint")}
          checked={highContrast}
          onChange={setHighContrast}
        />
        <ToggleItem
          icon={Moon}
          label={t("settings.reducedMotion")}
          desc={t("a11y.reducedMotionHint")}
          checked={reducedMotion}
          onChange={setReducedMotion}
        />

        <button
          onClick={() => setView("THEME")}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Languages className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">{t("a11y.theme")}</p>
            <p className="text-xs text-muted-foreground">{t("a11y.themeHint")}</p>
          </div>
        </button>
      </div>

      <div className="mt-auto p-6 pb-safe">
        <Button onClick={() => setView("WELCOME")} size="lg" className="h-14 w-full text-base">
          {t("common.done")}
        </Button>
      </div>
    </div>
  );
}