"""CareLink AI - language registry.

Supports the 22 scheduled Indian languages plus English. Each entry knows how
to render itself (LTR/RTL) and carries ISO codes.

This module is data-only: it never calls an AI provider and contains no secrets.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class LanguageInfo:
    code: str          # ISO-639-1 code (lowercase)
    iso3: str          # ISO-639-2/T code
    name_en: str       # English name
    name_native: str   # Native self-name
    direction: str     # "ltr" | "rtl"
    scripts: tuple[str, ...]

    def metadata(self) -> dict:
        return {
            "language": self.name_en,
            "language_code": self.code,
            "direction": self.direction,
        }


# The 22 scheduled Indian languages + English, mirroring the CareLink spec.
LANGUAGES: tuple[LanguageInfo, ...] = (
    LanguageInfo("en", "eng", "English", "English", "ltr", ("Latin",)),
    LanguageInfo("hi", "hin", "Hindi", "हिन्दी", "ltr", ("Devanagari",)),
    LanguageInfo("as", "asm", "Assamese", "অসমীয়া", "ltr", ("Bengali",)),
    LanguageInfo("bn", "ben", "Bengali", "বাংলা", "ltr", ("Bengali",)),
    LanguageInfo("bo", "bod", "Bodo", "बर'", "ltr", ("Devanagari",)),
    LanguageInfo("doi", "doi", "Dogri", "डोगरी", "ltr", ("Devanagari",)),
    LanguageInfo("gu", "guj", "Gujarati", "ગુજરાતી", "ltr", ("Gujarati",)),
    LanguageInfo("kn", "kan", "Kannada", "ಕನ್ನಡ", "ltr", ("Kannada",)),
    LanguageInfo("ks", "kas", "Kashmiri", "कॉशुर", "rtl", ("Arabic", "Devanagari")),
    LanguageInfo("kok", "kok", "Konkani", "कोंकणी", "ltr", ("Devanagari",)),
    LanguageInfo("mai", "mai", "Maithili", "मैथिली", "ltr", ("Devanagari",)),
    LanguageInfo("ml", "mal", "Malayalam", "മലയാളം", "ltr", ("Malayalam",)),
    LanguageInfo("mni", "mni", "Manipuri", "মৈতৈলোন্", "ltr", ("Bengali", "Meetei")),
    LanguageInfo("mr", "mar", "Marathi", "मराठी", "ltr", ("Devanagari",)),
    LanguageInfo("ne", "nep", "Nepali", "नेपाली", "ltr", ("Devanagari",)),
    LanguageInfo("or", "ori", "Odia", "ଓଡ଼ିଆ", "ltr", ("Odia",)),
    LanguageInfo("pa", "pan", "Punjabi", "ਪੰਜਾਬੀ", "ltr", ("Gurmukhi",)),
    LanguageInfo("sa", "san", "Sanskrit", "संस्कृतम्", "ltr", ("Devanagari",)),
    LanguageInfo("sat", "sat", "Santali", "ᱥᱟᱱᱛᱟᱲᱤ", "ltr", ("Ol Chiki",)),
    LanguageInfo("sd", "snd", "Sindhi", "سنڌي", "ltr", ("Arabic", "Devanagari")),
    LanguageInfo("ta", "tam", "Tamil", "தமிழ்", "ltr", ("Tamil",)),
    LanguageInfo("te", "tel", "Telugu", "తెలుగు", "ltr", ("Telugu",)),
    LanguageInfo("ur", "urd", "Urdu", "اردو", "rtl", ("Arabic",)),
)

_INDEX: dict[str, LanguageInfo] = {lang.code: lang for lang in LANGUAGES}

# Codes the CareLink frontend uses today (subset guaranteed to work end-to-end).
PRIMARY_CODES: tuple[str, ...] = ("en", "hi", "ur", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as")

RTL_CODES: frozenset[str] = frozenset(lang.code for lang in LANGUAGES if lang.direction == "rtl")


def get_language(code: str) -> LanguageInfo | None:
    """Look up a language by ISO code (case-insensitive)."""
    if not code:
        return None
    return _INDEX.get(code.lower())


def get_language_metadata(code: str | None) -> dict:
    """Return the standard language-metadata object (defaults to English)."""
    info = get_language(code or "en")
    if info is None:
        info = _INDEX["en"]
    return info.metadata()


def direction_for(code: str) -> str:
    info = get_language(code)
    return info.direction if info else "ltr"


def is_rtl(code: str) -> bool:
    return code.lower() in RTL_CODES


def supported_codes() -> list[str]:
    return list(_INDEX.keys())


def is_supported(code: str) -> bool:
    return code.lower() in _INDEX

# Unicode block ranges used by heuristic language detection.
# Each maps a script code -> approximate start/end codepoints (best-effort,
# non-exported to keep the API surface small; see detection module).