"""Tests for clinical modules: history, adaptive questions, red flags,
summaries, and structured extraction."""

from __future__ import annotations

import pytest

from ai.clinical.adapters import create_clinical_services
from ai.clinical.history.extractor import (
    HistoryExtractor,
    build_missing_info,
    extract_ailment_free_text,
)
from ai.clinical.extraction import DataExtractor
from ai.safety.clinical_safety import check_clinical_safety


# --- history extraction ----------------------------------------------------


def test_history_extractor_marks_missing_information():
    extractor = HistoryExtractor()
    result = extractor.structure("I have a fever", answers=[], language="en")
    assert result["complaint"] == "fever"
    assert isinstance(result["missing_information"], list)
    assert len(result["missing_information"]) >= 0
    assert result["facts"][0]["key"] == "presenting_complaint"
    assert result["facts"][0]["verification_status"] == "needs_review"


def test_history_does_not_fabricate_unreported_facts():
    extractor = HistoryExtractor()
    result = extractor.structure("I am fine", answers=[], language="en")
    # No invented vitals.
    assert "temperature" not in str(result["facts"]).lower()


def test_extract_ailment_free_text():
    assert extract_ailment_free_text("I have a stomach pain") == "stomach pain"
    assert extract_ailment_free_text("khoon") == "other"


def test_build_missing_info_identifies_gaps():
    complaint = "fever"
    missing = build_missing_info(["How high has your temperature been?"], complaint)
    assert len(missing) < len(extract_fever_bank())


def extract_fever_bank():
    from ai.clinical.terminology import QUESTION_BANK
    return QUESTION_BANK["fever"]


# --- adaptive questioning --------------------------------------------------


def test_adaptive_engine_picks_next_unanswered_question(mock_settings):
    svcs = create_clinical_services(mock_settings)
    result = svcs.adaptive_questions.next_question("fever", [], language="en")
    assert result["question"]
    assert result["completed"] is False
    assert result["missing_count"] > 0


def test_adaptive_engine_completes_when_all_answered(mock_settings):
    from ai.clinical.terminology import QUESTION_BANK
    svcs = create_clinical_services(mock_settings)
    all_q = QUESTION_BANK["fever"]
    result = svcs.adaptive_questions.next_question("fever", list(all_q), language="en")
    assert result["completed"] is True


# --- red flags ---------------------------------------------------------------


def test_red_flag_chest_pain_suggests_escalation(mock_settings):
    svcs = create_clinical_services(mock_settings)
    flags = svcs.red_flags.check("I have severe chest pain")
    assert any(f["severity"] in ("high", "critical") for f in flags)
    assert any(f["escalate"] for f in flags)


def test_red_flag_none_for_benign_text(mock_settings):
    svcs = create_clinical_services(mock_settings)
    flags = svcs.red_flags.check("I have a mild headache today")
    assert flags == []


# --- summarization ----------------------------------------------------------


def test_patient_summary_includes_disclaimer(mock_settings):
    svcs = create_clinical_services(mock_settings)
    history = {
        "summary": "Patient described mild fever.",
        "complaint": "fever",
        "facts": [{"key": "presenting_complaint", "value": "fever"}],
    }
    result = svcs.summary.summarize(history, audience="patient")
    assert result["disclaimer_included"] is True
    assert "CareLink" in result["summary"]


def test_patient_summary_does_not_diagnose(mock_settings):
    svcs = create_clinical_services(mock_settings)
    history = {
        "summary": "Patient described some symptoms.",
        "complaint": "other",
        "facts": [],
    }
    result = svcs.summary.summarize(history, audience="patient")
    findings = check_clinical_safety(result["summary"])
    assert findings == []


def test_doctor_summary_has_no_generated_assessment(mock_settings):
    svcs = create_clinical_services(mock_settings)
    history = {"summary": "Patient described fever.", "complaint": "fever",
               "facts": [{"key": "presenting_complaint", "value": "fever"}]}
    result = svcs.summary.summarize(history, audience="doctor")
    assert result["generated_assessment"] is False
    assert result["summary"]["assessment"] is None


# --- structured extraction ---------------------------------------------------


def test_extract_vitals():
    extractor = DataExtractor()
    vitals = extractor.extract_vitals("Temp 38.5, BP 120/80, HR 88 bpm")
    assert vitals["temperature"] == "38.5"
    assert vitals["bp_systolic"] == "120"
    assert vitals["heart_rate"] == "88"


def test_extract_does_not_invent_values():
    extractor = DataExtractor()
    vitals = extractor.extract_vitals("I have no measurements")
    assert vitals == {}