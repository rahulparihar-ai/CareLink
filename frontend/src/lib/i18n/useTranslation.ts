"use client";

import { useAppStore } from "@/store";
import { t, getLanguageDir } from "./translations";
import type { LanguageCode } from "@/types";

export function useTranslation() {
  const language = useAppStore((s) => s.language) as LanguageCode;
  return {
    language,
    dir: getLanguageDir(language),
    t: (key: string) => t(language, key),
  };
}
