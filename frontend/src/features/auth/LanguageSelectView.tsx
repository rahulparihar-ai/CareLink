"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";
import { useAppStore } from "@/store";
import { SUPPORTED_LANGUAGES } from "@/i18n/translations";
import { useTranslation } from "@/i18n/useTranslation";
import type { LanguageCode } from "@/types";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils";

export function LanguageSelectView() {
  const setLanguage = useAppStore((s) => s.setLanguage);
  const setView = useAppStore((s) => s.setView);
  const current = useAppStore((s) => s.language);
  const hasSeenStartupAssistant = useAppStore((s) => s.hasSeenStartupAssistant);
  const { t } = useTranslation();
  const [selected, setSelected] = useState<LanguageCode>(current);

  return (
    <div className="app-shell flex min-h-dvh flex-col bg-card">
      <div className="p-6">
        <CareLinkLogo size="sm" />
      </div>
      <div className="px-6">
        <h1 className="text-2xl font-bold">{t("lang.chooseTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("lang.chooseSubtitle")}
        </p>
      </div>

      <div className="mt-5 flex-1 space-y-1.5 overflow-y-auto px-4 pb-6">
        {SUPPORTED_LANGUAGES.map((lang, i) => (
          <motion.button
            key={lang.code}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => setSelected(lang.code)}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border bg-card px-4 py-3.5 text-left transition-all",
              selected === lang.code
                ? "border-primary bg-primary/5"
                : "border-border"
            )}
          >
            <div>
              <p className="font-medium">{lang.name}</p>
              <p className="text-xs text-muted-foreground">{lang.nativeName}</p>
            </div>
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border",
                selected === lang.code
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              )}
            >
              {selected === lang.code && <Check className="size-4" />}
            </span>
          </motion.button>
        ))}
      </div>

      <div className="border-t border-border p-4 pb-safe">
        <Button
          className="h-13 w-full text-base"
          size="lg"
          onClick={() => {
            setLanguage(selected);
            // First run: introduce the startup AI assistant before the home screen.
            setView(hasSeenStartupAssistant ? "WELCOME" : "AI_ASSISTANT");
          }}
        >
          {t("lang.continue")}
        </Button>
      </div>
    </div>
  );
}
