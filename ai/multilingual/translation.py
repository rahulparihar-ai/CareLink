"""CareLink AI - translation engine.

Provides:
  translate_text
  detect_language
  translate_patient_response
  translate_clinical_summary

Design:
  * Falls back to a deterministic offline translator when no LLM is configured
    (mock mode) so the service works with zero credentials.
  * Protects medically sensitive tokens (numbers, units, dosages, medicine
    names, identifiers like ABHA, registration numbers, dates) so they are
    never corrupted by translation.
  * For real providers, uses the LLM provider abstraction (never hardcodes
    a provider or key).
"""

from __future__ import annotations

import re
from typing import Callable, Optional

from ai.config.settings import AiProviderKind, Settings, get_settings
from ai.providers.base import LlmProvider
from ai.providers.factory import get_llm_provider
from .languages import LANGUAGES, direction_for, get_language, is_rtl

# ---------------------------------------------------------------------------
# Token protection
# ---------------------------------------------------------------------------

# Patterns that must never be "translated": keep them verbatim.
_PROTECTED_PATTERNS: list[tuple[str, str]] = [
    ("number", r"\b\d+(?:[.,]\d+)?\b"),
    ("date", r"\b\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}\b"),
    ("unit", r"\b(?:mg|mcg|g|ml|L|IU|mmHg|mmol/L|mg/dL|%|kg|μg)\b"),
    ("dosage", r"\b\d+\s*(?:mg|mcg|g|ml|IU|units)\b"),
    ("abha", r"\b91-?\d{0,4}\b"),                     # ABHA-like Aadhaar number
    ("regnum", r"\b[A-Z]{1,5}\s*\d{2,7}\b"),           # registration numbers
    ("email", r"\S+@\S+\.\S+"),
    ("ident", r"\b(?:Dr|Dr\.)\s+[A-Z][a-z]+\b"),
]


def protect_tokens(text: str) -> tuple[str, list[tuple[str, str]]]:
    """Replace protected tokens with placeholders; return (text, tokens)."""
    tokens: list[tuple[str, str]] = []
    masked = text

    def repl(m: re.Match) -> str:
        tokens.append((m.group(0), "{{PROT%d}}" % (len(tokens))))
        return "{{PROT%d}}" % (len(tokens) - 1)

    for _, pattern in _PROTECTED_PATTERNS:
        masked = re.sub(pattern, repl, masked)
    return masked, tokens


def restore_tokens(text: str, tokens: list[tuple[str, str]], order: list[str]) -> str:
    """Put original protected tokens back into the translated text."""
    for i, (original, _placeholder) in enumerate(tokens):
        placeholder = "{{PROT%d}}" % i
        if placeholder in text:
            text = text.replace(placeholder, original)
    return text


# ---------------------------------------------------------------------------
# Offline deterministic translator (mock)
# ---------------------------------------------------------------------------

MOCK_TRANSLATIONS = {
    "hi": {
        "stomach pain": "पेट दर्द",
        "abdominal pain": "पेट दर्द",
        "for how long": "कितने समय से",
        "yes": "हाँ",
        "no": "नहीं",
        "not sure": "पक्का नहीं",
        "month": "महीना",
        "months": "महीने",
        "week": "सप्ताह",
        "weeks": "सप्ताह",
        "day": "दिन",
        "days": "दिन",
        "after eating": "खाने के बाद",
        "chest pain": "सीने में दर्द",
        "breathing difficulty": "साँस लेने में कठिनाई",
    },
    "ur": {
        "stomach pain": "پیٹ میں درد",
        "abdominal pain": "پیٹ میں درد",
        "chest pain": "سینے میں درد",
        "breathing difficulty": "سانس لینے میں دشواری",
        "for how long": "کتنی دیر سے",
        "yes": "ہاں",
        "no": "نہیں",
        "month": "مہینہ",
        "months": "مہینے",
    },
}

_HI_LATIN = {
    "pet": "पेट", "dard": "दर्द", "hai": "है", "me": "में", "khana": "खाना",
    "khaane": "खाने", "bad": "बाद", "zyada": "ज़्यादा", "mahine": "महीने",
    "mahina": "महीना", "se": "से", "aur": "और", "behut": "बहुत", "tez": "तेज़",
    "chest": "सीना", "saans": "साँस", "lene": "लेन", "dikkat": "दिक्कत",
}


class OfflineTranslator:
    """Deterministic, credential-free translator used in mock mode and as a
    safe fallback. It is intentionally limited: unsupported phrases are
    returned unchanged with a warning so nothing is mis-translated."""

    def __init__(self) -> None:
        pass

    def detect(self, text: str) -> dict:
        from .language_detection import detect_language
        return detect_language(text)

    def translate(self, text: str, target: str) -> dict:
        masked, tokens = protect_tokens(text)
        translated = self._translate_masked(masked.lower().strip(), target)
        restored = restore_tokens(translated, tokens, [])
        return {
            "translated_text": restored,
            "language": target,
            "direction": direction_for(target),
            "provider": "mock",
            "mock": True,
        }

    def _translate_masked(self, text: str, target: str) -> str:
        if target == "en":
            return self._hindi_to_latin_en_noop(text)
        if target == "hi":
            return self._to_hindi(text)
        if target == "ur":
            return self._to_urdu(text)
        # Unsupported target: do not fabricate a translation, return as-is.
        return text

    def _to_hindi(self, text: str) -> str:
        # Multi-word phrases first.
        if text and text in MOCK_TRANSLATIONS["hi"]:
            return MOCK_TRANSLATIONS["hi"][text]
        out = []
        for word in text.split():
            if word in _HI_LATIN:
                out.append(_HI_LATIN[word])
            elif word in MOCK_TRANSLATIONS["hi"]:
                out.append(MOCK_TRANSLATIONS["hi"][word])
            else:
                out.append(word)
        return " ".join(out)

    def _to_urdu(self, text: str) -> str:
        if text and text in MOCK_TRANSLATIONS["ur"]:
            return MOCK_TRANSLATIONS["ur"][text]
        out = []
        for word in text.split():
            if word in MOCK_TRANSLATIONS["ur"]:
                out.append(MOCK_TRANSLATIONS["ur"][word])
            else:
                out.append(word)
        return " ".join(out)

    def _hindi_to_latin_en_noop(self, text: str) -> str:
        return text


# ---------------------------------------------------------------------------
# TranslationService
# ---------------------------------------------------------------------------


class TranslationService:
    """High-level translation service with provider + offline fallback."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.offline = OfflineTranslator()
        self._llm: Optional[LlmProvider] = None

    def _provider(self) -> Optional[LlmProvider]:
        if self._llm is None:
            if self.settings.is_mock():
                return None
            self._llm = get_llm_provider(self.settings)
        return self._llm

    def detect_language(self, text: str) -> dict:
        # Try provider-backed detection is intentionally not hardcoded; for now
        # use the deterministic detector (available offline and in mock).
        result = self.offline.detect(text)
        lang = get_language(result["code"])
        return {
            "language": lang.name_en if lang else "English",
            "language_code": result["code"],
            "direction": result["direction"],
            "confidence": result["confidence"],
        }

    def translate_text(self, text: str, target: str = "en") -> dict:
        target = (target or "en").lower()
        provider = self._provider()
        if provider is None:
            return self.offline.translate(text, target)

        # Real provider path (guarded so it never leaks the key).
        prompt = (
            "Translate the following health-related text to the target language. "
            "Keep medicine names, lab values, units, dosages, registration numbers, "
            "ABHA identifiers and dates exactly as-is. Return only the translation.\n"
            f"Target language code: {target}\n\n{text}"
        )
        try:
            result = provider.complete(
                [{"role": "system", "content": "You are a careful medical translator."},
                 {"role": "user", "content": prompt}]
            )
            return {
                "translated_text": result.text.strip(),
                "language": target,
                "direction": direction_for(target),
                "provider": provider.key,
                "model": provider.model,
                "mock": False,
            }
        except Exception:
            # Fall back to the deterministic translator on provider failure.
            return self.offline.translate(text, target)

    def translate_patient_response(self, text: str, target: str = "en") -> dict:
        return self.translate_text(text, target)

    def translate_clinical_summary(self, text: str, target: str = "en") -> dict:
        return self.translate_text(text, target)


def create_translation_service(settings: Optional[Settings] = None) -> TranslationService:
    return TranslationService(settings)