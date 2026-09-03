"""CareLink AI - clinical summarization.

Generates a doctor-facing (SOAP-like) and a patient-facing (plain-language)
summary from a structured history. Patient-facing text always carries a
disclaimer and avoids absolute diagnoses.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings, get_settings
from ai.providers.base import LlmProvider
from ai.providers.factory import get_llm_provider
from ai.safety.clinical_safety import check_clinical_safety, ensure_disclaimer
from ai.clinical.terminology.terminology import GENERAL_ADVICE


class SummaryService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._llm: Optional[LlmProvider] = None

    def _provider(self) -> Optional[LlmProvider]:
        if self._llm is None:
            if self.settings.is_mock():
                return None
            self._llm = get_llm_provider(self.settings)
        return self._llm

    def summarize(self, history: dict, *, audience: str = "doctor",
                  language: str = "en", answers: Optional[list[str]] = None) -> dict:
        answers = answers or []
        complaint = (history.get("complaint") or "other")
        facts = history.get("facts") or []
        summary_text = history.get("summary") or ""

        if audience == "patient":
            compliant, _flag = self._compose_patient(complaint, summary_text, answers)
            return {
                "summary": compliant,
                "complaint": complaint,
                "language": language,
                "disclaimer_included": True,
            }

        # Doctor-facing summary.
        soaped = {
            "subjective": summary_text,
            "objective": self._objective_of_facts(facts),
            "assessment": None,   # Assessment is left for the doctor — never generated.
            "plan": [
                {"kind": "note", "text": "Review findings with the patient."},
            ],
        }
        result = {
            "summary": soaped,
            "complaint": complaint,
            "language": language,
            "generated_assessment": False,
            "provenance": {"mock": self.settings.is_mock()},
        }

        provider = self._provider()
        if provider is not None:
            try:
                text = provider.complete(
                    [{"role": "system", "content": "Produce a concise SOAP summary."},
                     {"role": "user", "content": f"History: {summary_text}"}]
                ).text
                result["summary"]["subjective"] = text
                result["provenance"]["model"] = provider.model
            except Exception:
                pass
        return result

    def _objective_of_facts(self, facts: list) -> list[str]:
        out = []
        for fact in facts:
            if isinstance(fact, dict) and fact.get("key"):
                out.append(f"{fact['key']}: {fact.get('value')}")
        return out

    def _compose_patient(self, complaint: str, summary_text: str,
                         answers: list[str]) -> tuple[str, list[str]]:
        findings = check_clinical_safety(summary_text)
        advice = GENERAL_ADVICE.get(complaint, "")
        lines = [
            "Based on what you shared, here is a summary for your doctor to review.",
        ]
        if summary_text:
            lines.append(summary_text)
        if advice:
            lines.append(advice)
        body = "\n\n".join(lines)
        if findings:
            body += "\n\n(Please note: CareLink does not make a diagnosis.)"
        return ensure_disclaimer(body), findings


def create_summary_service(settings: Optional[Settings] = None) -> SummaryService:
    return SummaryService(settings)