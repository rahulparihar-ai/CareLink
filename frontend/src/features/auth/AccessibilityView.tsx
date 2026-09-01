"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Palette, Check } from "lucide-react";
import { useAppStore } from "@/store";
import { CareLinkLogo } from "@/components/brand/CareLinkLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ThemeName } from "@/types";

const themes: { key: ThemeName; label: string; swatch: string; isDark?: boolean }[] = [
  { key: "white", label: "White", swatch: "bg-white border border-black/10" },
  { key: "blue", label: "Blue", swatch: "bg-sky-500" },
  { key: "green", label: "Green", swatch: "bg-emerald-500" },
  { key: "pink", label: "Pink", swatch: "bg-pink-500" },
  { key: "gold", label: "Golden Yellow", swatch: "bg-yellow-500" },
  { key: "black", label: "Black", swatch: "bg-neutral-900", isDark: true },
];

export function AccessibilityView() {
  const themeColor = useAppStore((s) => s.themeColor);
  const setThemeColor = useAppStore((s) => s.setThemeColor);
  const setView = useAppStore((s) => s.setView);

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
            <Palette className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">Accessibility</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a theme. The whole app updates instantly.
          </p>
        </motion.div>
      </div>

      <div className="mt-6 flex-1 px-6">
        <div className="grid grid-cols-3 gap-3">
          {themes.map((th, i) => (
            <motion.button
              key={th.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setThemeColor(th.key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                themeColor === th.key ? "border-primary bg-primary/5" : "border-border"
              )}
            >
              <span
                className={cn(
                  "relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-black/5",
                  th.swatch
                )}
              >
                {themeColor === th.key && (
                  <Check
                    className={cn("size-5", th.isDark ? "text-black" : "text-white")}
                    strokeWidth={3}
                  />
                )}
              </span>
              <span className="text-[11px] font-medium">{th.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="p-6 pb-safe">
        <Button onClick={() => setView("WELCOME")} size="lg" className="h-14 w-full text-base">
          Done
        </Button>
      </div>
    </div>
  );
}