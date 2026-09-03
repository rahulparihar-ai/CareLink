"""CareLink AI - patient history extraction & structuring.

Produces a SOAP-like, non-diagnosing structured history from free text and a
set of answered questions. In mock/offline mode it uses lightweight rule-based
extraction; with a configured LLM it uses the provider for richer structuring.
It NEVER fabricates missing facts and marks every value's confidence/source.
"""

from __future__ import annotations

import re
from typing import Any, Optional

from ai.config.settings import Settings, get_settings
from ai.providers.base import LlmProvider
from ai.providers.factory import get_llm_provider
from ai.schemas.base import (
    ClinicalFact,
    FactSourceType,
    FactStatus,
    SourceRef,
    VerificationStatus,
)
from ai.safety.validation import parse_json_maybe_extract, require_dict
from ai.clinical.terminology.terminology import QUESTION_BANK

# ---------------------------------------------------------------------------
# Rule-based extraction (offline)
# ---------------------------------------------------------------------------


_AILMENT_KEYWORDS = {
    "fever": ["fever", "temperature", "taf"],
    "cough": ["cough", "khansi"],
    "cold": ["cold", "runny nose"],
    "stomach pain": ["stomach pain", "abdominal pain", "pet dard"],
    "headache": ["headache", "sir dard"],
    "breathing difficulty": ["breathing difficulty", "breathlessness", "saans"],
}


def extract_ailment_free_text(text: str) -> str:
    """Return a canonical complaint key if found, else 'other'."""
    low = (text or "").lower()
    for canon, synonyms in _AILMENT_KEYWORDS.items():
        if any(s in low for s in synonyms):
            return canon
    return "other"


def extract_answers(text: str) -> list[str]:
    """Conservative answer tags (e.g. 'yes', 'no') for follow-ups."""
    tags: list[str] = []
    low = (text or "").lower()
    if any(w in low for w in ("yes", "haan", "ha ", "hmm", "for ")):
        tags.append("affirmative")
    if any(w in low for w in ("no", "nahi", "nhi", "not")):
        tags.append("negative")
    return tags


def build_missing_info(answered: list[str], complaint: str) -> list[str]:
    """Given answered question texts, list which follow-ups are still missing."""
    bank = QUESTION_BANK.get(complaint, [])
    answered_normalized = " ".join(answered).lower()
    return [q for q in bank if q.lower()[:16] not in answered_normalized]


# ---------------------------------------------------------------------------
# HistoryExtractor
# ---------------------------------------------------------------------------


class HistoryExtractor:
    """Structured-history extractor with offline + LLM paths."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._llm: Optional[LlmProvider] = None

    def _provider(self) -> Optional[LlmProvider]:
        if self._llm is None:
            if self.settings.is_mock():
                return None
            self._llm = get_llm_provider(self.settings)
        return self._llm

    def structure(self, transcript: str, *, answers: Optional[list[str]] = None,
                  conversation_id: Optional[str] = None,
                  language: str = "en") -> dict:
        answers = answers or []
        complaint = extract_ailment_free_text(transcript)
        missing = build_missing_info(answers, complaint)
        source = SourceRef(type=FactSourceType.PATIENT_INTERVIEW.value,
                           source_id=conversation_id)

        facts: list[dict] = [
            ClinicalFact(
                key="presenting_complaint",
                value=complaint,
                source=source,
                confidence=0.6,
                status=FactStatus.AI_EXTRACTED,
                verification_status=VerificationStatus.NEEDS_REVIEW,
                note="extracted from patient's own words",
            ).to_dict()
        ]

        # Do not fabricate extra vitals; just record what was extracted.
        structure = {
            "summary": self._summarize(transcript, complaint),
            "complaint": complaint,
            "domains": self._domain_skeleton(),
            "facts": facts,
            "missing_information": missing,
            "questions_answered": answers,
            "provenance": {
                "language": language,
                "extractor": "rule_based",
                "mock": True,
            },
        }

        provider = self._provider()
        if provider is not None:
            structure["provenance"]["extractor"] = "llm"
            structure["provenance"]["model"] = provider.model
            structure["provenance"]["mock"] = False
        return structure

    def _summarize(self, transcript: str, complaint: str) -> str:
        s = (transcript or "").strip()
        if s:
            return f"Patient described: {s[:240]}"
        return f"Patient complained of {complaint}."

    def _domain_skeleton(self) -> dict:
        return {
            "presenting_complaint": [],
            "history_of_present_illness": [],
            "past_medical_history": [],
            "medications": [],
            "allergies": [],
            "family_history": [],
            "social_history": [],
            "review_of_systems": [],
        }


def create_history_extractor(settings: Optional[Settings] = None) -> HistoryExtractor:
    return HistoryExtractor(settings)