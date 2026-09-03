"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store";
import { getLanguageDir } from "@/i18n/translations";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove(
      "theme-white",
      "theme-blue",
      "theme-green",
      "theme-pink",
      "theme-gold",
      "theme-black",
      "theme-light",
      "theme-dark",
      "dark"
    );

    // Resolve theme
    if (theme === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "theme-black" : "theme-white");
      root.classList.add(prefersDark ? "theme-dark" : "theme-light");
      if (prefersDark) root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.add("theme-white", "theme-light");
    } else if (theme === "dark") {
      root.classList.add("theme-black", "theme-dark", "dark");
    } else {
      const isBlack = theme === "black";
      root.classList.add(`theme-${theme}`, isBlack ? "theme-dark" : "theme-light");
      if (isBlack) root.classList.add("dark");
    }

    // Mark color-scheme
    const isDark = root.classList.contains("theme-black") || root.classList.contains("dark");
    root.style.colorScheme = isDark ? "dark" : "light";
  }, [theme]);

  useEffect(() => {
    const dir = getLanguageDir(language);
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  return <>{children}</>;
}
