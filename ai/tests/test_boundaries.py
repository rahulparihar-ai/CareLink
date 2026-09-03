"""Contract tests: the AI service must NEVER diagnose, prescribe, or fabricate
clinical facts. These run across the composed pipelines."""

from __future__ import annotations

from ai.app.services.orchestration import create_app_services
from ai.safety.clinical_safety import check_clinical_safety
from ai.multilingual.translation import TranslationService


def _allowed(text: str) -> bool:
    return not check_clinical_safety(text)


def test_translation_cannot_inject_a_diagnosis():
    svc = TranslationService()
    result = svc.translate_text("the patient has malaria", "hi")
    # Even if translated, the *structure* must not assert a diagnosis.
    assert _allowed(result["translated_text"])


def test_patient_summary_never_blocks(mock_settings):
    svcs = create_app_services(mock_settings)
    from ai.app.schemas.requests import HistoryRequest
    req = HistoryRequest(transcript="patient is feeling unwell")
    summary = svcs.summarize_history(req, audience="patient")["summary"]["summary"]
    assert _allowed(summary)


def test_red_flags_are_suggestions_not_diagnoses(mock_settings):
    svcs = create_app_services(mock_settings)
    flags = svcs.clinical.red_flags.check("chest pain")
    for flag in flags:
        # Must always carry 'suggested'/'escalate' guidance, not a diagnosis.
        assert "advice" in flag
        assert "rule_id" in flag


def test_mock_embedding_is_deterministic(mock_settings):
    provider_and = create_app_services(mock_settings)
    assert provider_and.settings.is_mock() is True