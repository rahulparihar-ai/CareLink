"""CareLink AI - multilingual package."""

from .languages import (
    LANGUAGES,
    PRIMARY_CODES,
    RTL_CODES,
    direction_for,
    get_language,
    get_language_metadata,
    is_rtl,
    is_supported,
    supported_codes,
)
from .language_detection import detect_language, detect_language_code
from .translation import (
    OfflineTranslator,
    TranslationService,
    create_translation_service,
)

__all__ = [
    "LANGUAGES",
    "PRIMARY_CODES",
    "RTL_CODES",
    "direction_for",
    "get_language",
    "get_language_metadata",
    "is_rtl",
    "is_supported",
    "supported_codes",
    "detect_language",
    "detect_language_code",
    "OfflineTranslator",
    "TranslationService",
    "create_translation_service",
]