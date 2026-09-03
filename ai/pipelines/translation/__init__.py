"""CareLink AI - translation pipeline."""

from ai.multilingual.translation import create_translation_service
from ai.multilingual.language_detection import detect_language as _detect


def detect_language(text: str) -> dict:
    from ai.multilingual.languages import get_language
    result = _detect(text)
    lang = get_language(result["code"])
    return {
        "language": lang.name_en if lang else "English",
        "language_code": result["code"],
        "direction": result["direction"],
        "confidence": result["confidence"],
    }


def translate_text(text: str, target: str = "en") -> dict:
    svc = create_translation_service()
    return svc.translate_text(text, target)