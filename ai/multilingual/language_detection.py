"""CareLink AI - heuristic language detection (works offline / mock mode).

This is a best-effort script + common-word detector. It intentionally does NOT
claim native-model accuracy; low-confidence results return ``confidence=low`` so
callers can ask the patient to confirm the language.

It never sends text to a provider for detection by default; a provider-backed
detector can be plugged in via the providers layer.
"""

from __future__ import annotations

from functools import lru_cache

# (start, end) inclusive codepoint ranges approximating each script.
_SCRIPT_RANGES = {
    "devanagari": (0x0900, 0x097F),
    "bengali": (0x0980, 0x09FF),
    "gurmukhi": (0x0A00, 0x0A7F),
    "gujarati": (0x0A80, 0x0AFF),
    "odia": (0x0B00, 0x0B7F),
    "tamil": (0x0B80, 0x0BFF),
    "telugu": (0x0C00, 0x0C7F),
    "kannada": (0x0C80, 0x0CFF),
    "malayalam": (0x0D00, 0x0D7F),
    "arabic": (0x0600, 0x06FF),
    "latin": (0x0041, 0x007A),
    "olchiki": (0x1C50, 0x1C7F),
}

# Common words per language to disambiguate shared scripts (Devanagari/Arabic).
_DEVANAGARI_WORDS = {
    "hi": frozenset({"है", "में", "था", "हूँ", "नहीं", "और", "से", "के", "लिए"}),
    "mr": frozenset({"आहे", "आहेत", "मध्ये", "नाही", "आणि", "मी", "त्याला"}),
    "ne": frozenset({"छ", "छन्", "मा", "र", "हो", "को"}),
    "sa": frozenset({"अस्ति", "च", "सः", "कथम्", "न"}),
    "mai": frozenset({"अहि", "ओ", "बा"}),
    "kok": frozenset({"आसा", "धाद"}),
    "bo": frozenset({"थान", "नों"}),
}

_ARABIC_WORDS = {
    "ur": frozenset({"ہے", "میں", "تھا", "نہیں", "اور", "کے", "کیلئے", "کیا"}),
    "ks": frozenset({"چھُ", "چھی"}),
    "sd": frozenset({"آهي", "۾"}),
}

_BENGALI_WORDS = {
    "bn": frozenset({"হয়", "আছে", "এবং", "থেকে", "কী", "না"}),
    "as": frozenset({"হয়", "আছে", "আৰু", "এই", "নহয়"}),
    "mni": frozenset({"অদো"}),
}


@lru_cache(maxsize=256)
def detect_language(text: str) -> dict:
    """Detect a language from text. Returns {code, iso3, direction, confidence}.

    ``confidence`` is one of "high" | "medium" | "low". A script match with
    unambiguous script is high; shared-script guesses are medium/low.
    """
    if not text or not text.strip():
        return {"code": "en", "iso3": "eng", "direction": "ltr", "confidence": "low"}

    counts = _script_counts(text)

    # 1) If a single non-Latin script clearly dominates, pick by script.
    dominant_script, dominant_count = _dominant_script(counts)

    if dominant_script and dominant_script != "latin" and dominant_count > 0:
        candidates = _codes_for_script(dominant_script)
        if len(candidates) == 1:
            return _result(candidates[0], "high")
        # Disambiguate shared script by common words.
        scored = _score_words(text, candidates, dominant_script)
        best, best_score = scored[0] if scored else (None, 0)
        if best and best_score > 0:
            conf = "medium" if best_score == 1 else "high"
            return _result(best, conf)
        return {"code": candidates[0], "iso3": _iso3(candidates[0]), "direction": _direction(candidates[0]), "confidence": "low"}

    # 2) Latin: treat as English (best-effort).
    if dominant_script == "latin" and counts.get("latin", 0) > 0:
        return _result("en", "medium")

    return _result("en", "low")


def detect_language_code(text: str) -> str:
    return detect_language(text)["code"]


def _script_counts(text: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for ch in text:
        cp = ord(ch)
        for script, (start, end) in _SCRIPT_RANGES.items():
            if start <= cp <= end:
                counts[script] = counts.get(script, 0) + 1
                break
    return counts


def _dominant_script(counts: dict[str, int]) -> tuple[str | None, int]:
    if not counts:
        return None, 0
    script, count = max(counts.items(), key=lambda kv: kv[1])
    return script, count


def _codes_for_script(script: str) -> list[str]:
    if script in {"devanagari", "arabic", "bengali"}:
        return list(_WORDS_FOR_SCRIPT(script).keys())
    for lang_key in _SCRIPT_TO_LANGS.get(script, []):
        return [lang_key]
    return []


# Script -> languages that primarily/write in it (for disambiguation).
_SCRIPT_TO_LANGS: dict[str, list[str]] = {
    "devanagari": ["hi", "mr", "ne", "sa", "mai", "kok", "bo", "doi"],
    "arabic": ["ur", "ks", "sd"],
    "bengali": ["bn", "as", "mni"],
    "gurmukhi": ["pa"],
    "gujarati": ["gu"],
    "odia": ["or"],
    "tamil": ["ta"],
    "telugu": ["te"],
    "kannada": ["kn"],
    "malayalam": ["ml"],
    "olchiki": ["sat"],
    "latin": ["en"],
}


def _WORDS_FOR_SCRIPT(script: str) -> dict[str, frozenset]:
    if script == "devanagari":
        return _DEVANAGARI_WORDS
    if script == "arabic":
        return _ARABIC_WORDS
    if script == "bengali":
        return _BENGALI_WORDS
    return {}


def _score_words(text: str, codes: list[str], script: str) -> list[tuple[str, int]]:
    words = _WORDS_FOR_SCRIPT(script)
    scores: list[tuple[str, int]] = []
    for code in codes:
        w = words.get(code, frozenset())
        score = sum(1 for token in text.split() if token in w) if w else 0
        scores.append((code, score))
    scores.sort(key=lambda kv: kv[1], reverse=True)
    return scores


def _iso3(code: str) -> str:
    from .languages import get_language
    info = get_language(code)
    return info.iso3 if info else "eng"


def _direction(code: str) -> str:
    from .languages import get_language
    info = get_language(code)
    return info.direction if info else "ltr"


def _result(code: str, confidence: str) -> dict:
    return {
        "code": code,
        "iso3": _iso3(code),
        "direction": _direction(code),
        "confidence": confidence,
    }