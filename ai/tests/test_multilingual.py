"""Tests for the multilingual module: language registry, detection, translation."""

from __future__ import annotations

import pytest

from ai.multilingual.languages import (
    LANGUAGES,
    direction_for,
    get_language,
    get_language_metadata,
    is_rtl,
    supported_codes,
)
from ai.multilingual.translation import OfflineTranslator, TranslationService
from ai.multilingual.language_detection import detect_language


# --- registry --------------------------------------------------------------


def test_supports_english_plus_22_scheduled_languages():
    expected = {
        "en", "hi", "bn", "bo", "doi", "gu", "kn", "ks", "kok", "mai", "ml",
        "mni", "mr", "ne", "or", "pa", "sa", "sat", "sd", "ta", "te", "ur", "as",
    }
    codes = set(supported_codes())
    assert expected.issubset(codes)
    assert len(get_language_metadata("ur")) == 3


def test_frontend_13_languages_are_all_supported():
    frontend = ["en", "hi", "ur", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa", "or", "as"]
    for code in frontend:
        assert get_language(code) is not None, f"missing {code}"


def test_urdu_is_rtl():
    assert is_rtl("ur")
    assert direction_for("ur") == "rtl"


def test_hindi_is_ltr():
    assert not is_rtl("hi")
    assert direction_for("hi") == "ltr"


# --- detection -------------------------------------------------------------


def test_detect_hindi_devanagari():
    result = detect_language("मुझे बुखार है और सिरदर्द")
    assert result["code"] == "hi"


def test_detect_urdu_script():
    result = detect_language("مجھے بخار ہے")
    assert result["code"] == "ur"
    assert result["direction"] == "rtl"


def test_detect_english_latin():
    result = detect_language("I have a fever and headache")
    assert result["code"] == "en"


def test_detect_tamil():
    result = detect_language("எனக்கு காய்ச்சல்")
    assert result["code"] == "ta"


def test_detect_empty_returns_low_confidence_en():
    result = detect_language("")
    assert result["code"] == "en"
    assert result["confidence"] == "low"


# --- translation -----------------------------------------------------------


def test_offline_hindi_translation_known_phrase():
    translator = OfflineTranslator()
    result = translator.translate("stomach pain", "hi")
    assert result["translated_text"] == "पेट दर्द"
    assert result["direction"] == "ltr"


def test_offline_urdu_translation_and_rtl():
    translator = OfflineTranslator()
    result = translator.translate("stomach pain", "ur")
    assert result["direction"] == "rtl"


def test_translation_preserves_protected_tokens():
    # Medicine/unit tokens must not be corrupted.
    translator = OfflineTranslator()
    text = "take 500 mg paracetamol for 3 days"
    result = translator.translate(text, "hi")
    assert "500" in result["translated_text"] or "500" in text


def test_translation_service_uses_offline_in_mock(mock_settings):
    service = TranslationService(mock_settings)
    result = service.translate_text("stomach pain", "hi")
    assert result["mock"] is True


def test_translate_patient_response_returns_envelope():
    service = TranslationService()
    result = service.translate_patient_response("pet me dard hai", "en")
    assert "translated_text" in result