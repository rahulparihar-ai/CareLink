import { describe, it, expect } from "vitest";
import { translations, SUPPORTED_LANGUAGES } from "./translations";

describe("i18n parity — all 13 languages share identical key sets", () => {
  it("covers exactly the supported languages", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(codes).toHaveLength(13);
    for (const code of codes) {
      expect(translations[code]).toBeDefined();
    }
  });

  it("has no duplicate or missing keys across languages", () => {
    const en = Object.keys(translations.en).sort();
    for (const lang of SUPPORTED_LANGUAGES) {
      const keys = Object.keys(translations[lang.code]).sort();
      expect(keys).toEqual(en);
    }
  });

  it("contains the full startup AI assistant key set in every language", () => {
    const required = [
      "ai.title",
      "ai.subtitle",
      "ai.welcome",
      "ai.inputPlaceholder",
      "ai.sendAria",
      "ai.micAria",
      "ai.backAria",
      "ai.muteAria",
      "ai.unmuteAria",
      "ai.tryAgain",
      "ai.continue",
      "ai.suggest.1",
      "ai.suggest.2",
      "ai.suggest.3",
    ];
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const key of required) {
        expect(translations[lang.code][key], `${lang.code}.${key}`).toBeTruthy();
      }
    }
  });

  it("marks Urdu as right-to-left and everything else LTR", () => {
    expect(translations !== undefined).toBe(true);
    const ur = SUPPORTED_LANGUAGES.find((l) => l.code === "ur");
    expect(ur?.dir).toBe("rtl");
    for (const l of SUPPORTED_LANGUAGES.filter((x) => x.code !== "ur")) {
      expect(l.dir).toBe("ltr");
    }
  });
});