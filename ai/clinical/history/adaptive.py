"""CareLink AI - adaptive questioning.

Decides the next question in the interview based on the patient's complaint and
which follow-ups remain unanswered. In mock mode this is rule-based and
deterministic; with an LLM it can generate the next question in the patient's
language. It never presumes a diagnosis.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings, get_settings
from ai.providers.base import LlmProvider
from ai.providers.factory import get_llm_provider
from ai.clinical.terminology.terminology import QUESTION_BANK
from ai.clinical.history.extractor import build_missing_info, extract_ailment_free_text


class AdaptiveQuestionEngine:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._llm: Optional[LlmProvider] = None

    def _provider(self) -> Optional[LlmProvider]:
        if self._llm is None:
            if self.settings.is_mock():
                return None
            self._llm = get_llm_provider(self.settings)
        return self._llm

    def next_question(self, complaint: str, answered: list[str],
                      language: str = "en") -> dict:
        missing = build_missing_info(answered, complaint)
        question = missing[0] if missing else self._closing_question()
        completed = len(missing) == 0

        result = {
            "question": question,
            "completed": completed,
            "missing_count": len(missing),
            "remaining_questions": missing,
            "provenance": {"mock": self.settings.is_mock()},
        }

        provider = self._provider()
        if provider is not None:
            try:
                # Best-effort LLM refinement (never adds invented facts).
                prompt = (
                    f"Give the next patient-history question in '{language}' for "
                    f"complaint '{complaint}'. Only output the question, no preamble."
                )
                refined = provider.complete(
                    [{"role": "system", "content": "You are polite and ask only one question."},
                     {"role": "user", "content": prompt}]
                ).text.strip()
                if refined:
                    result["question"] = refined
                    result["provenance"]["model"] = provider.model
            except Exception:
                pass
        return result

    def _closing_question(self) -> str:
        return "Anything else you would like to share?"