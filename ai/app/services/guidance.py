"""CareLink AI - wellness guidance and nutrition assistant.

Drives the patient-facing "Health Guidance", "Ask AI about nutrition" and
"AI health assistance" features. Responses come from the configured LLM
provider (OpenRouter when configured, mock otherwise).

SAFETY: This assistant ONLY provides general wellness/health-habit
information. It NEVER diagnoses, prescribes, or escalates symptoms. If the
patient describes symptoms, emergencies, or asks for medical advice, the
service returns a defer-to-doctor notice and does NOT treat the LLM text as
clinical truth. Every result carries a ``mock`` and ``disclaimer`` flag and
full provenance.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ai.config.settings import Settings, get_settings
from ai.providers.factory import get_llm_provider
from ai.safety.guardrails import check_input_length, detect_injection, scrub_pii
from ai.providers.base import LlmResult, ProviderError

_SYSTEM_DISCLAIMER = (
    "You are CareLink's wellness guidance assistant. You give ONLY general "
    "health-habit, lifestyle, and wellness information for education. You do "
    "NOT diagnose any condition, do NOT prescribe or suggest medication doses, "
    "and do NOT claim to be a doctor. If the user describes symptoms, pain, "
    "medical conditions, or emergencies, or if they ask for medical advice or "
    "a diagnosis, respond briefly in the user's language that they should "
    "consult a qualified doctor or the local emergency number, and keep your "
    "general wellness tip generic. Always answer in the user's requested "
    "language. Keep the answer concise (under ~160 words), use plain paragraphs, "
    "and end with a one-line reminder that this is general information, not "
    "medical advice."
)

_EMERGENCY_REMINDER = (
    "This is general information, not medical advice. If this is an emergency, "
    "call your local emergency number or see a doctor."
)


class GuidanceService:
    """LLM-backed wellness guidance, nutrition and general health chat."""

    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.provider = get_llm_provider(self.settings)

    @property
    def is_mock(self) -> bool:
        return self.settings.is_mock() or not self.provider.is_configured()

    def _guard(self, text: str) -> List[str]:
        warnings: List[str] = []
        too_long = check_input_length(text, self.settings.max_input_chars)
        if too_long:
            warnings.append(too_long)
        if detect_injection(text):
            warnings.append("possible prompt-injection-like pattern detected; handled defensively")
        return warnings

    def _respond(self, messages: List[Dict[str, str]],
                 skip_if_mock: bool = False) -> Dict[str, Any]:
        warnings: List[str] = []
        if skip_if_mock and self.is_mock:
            warnings.append("AI service running in mock mode; response is illustrative.")
            return {
                "reply": "AI assistance is currently in preview mode. Please ask a doctor "
                         "for personal medical guidance.",
                "mock": True, "provider": "mock", "model": "mock",
                "disclaimer": _EMERGENCY_REMINDER, "warnings": warnings,
            }
        try:
            result: LlmResult = self.provider.complete(messages)
        except ProviderError as exc:
            warnings.append(f"{exc.category}: provider unavailable")
            return {
                "reply": "AI assistance is temporarily unavailable. Please try again later.",
                "mock": True, "provider": "mock", "model": "mock",
                "disclaimer": _EMERGENCY_REMINDER, "warnings": warnings,
            }
        return {
            "reply": scrub_pii(result.text),
            "mock": self.is_mock,
            "provider": result.provider,
            "model": result.model,
            "disclaimer": _EMERGENCY_REMINDER,
            "warnings": warnings,
        }

    def guidance(self, topic: str, sub_topic: Optional[str],
                 language: str = "en",
                 patient_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        subject = sub_topic or topic
        warnings = self._guard(f"{topic} {sub_topic or ''}")
        topic_label = {
            "routine": "daily routine / healthy habits",
            "sleep": "sleep hygiene",
            "nutrition": "healthy eating basics",
        }.get(topic, "general wellness")
        user = (
            f"Please give a short {topic_label} tip in language code '{language}'. "
            f"Topic: {subject}."
        )
        if patient_context:
            context = scrub_pii(str(patient_context.get("general", "")))
            if context:
                user += f"\nContext (general only, no medical advice needed): {context}"
        messages = [{"role": "system", "content": _SYSTEM_DISCLAIMER},
                    {"role": "user", "content": user}]
        result = self._respond(messages)
        result.setdefault("warnings", []).extend(warnings)
        result["title"] = f"Guidance: {subject}"
        return result

    def nutrition(self, question: str,
                  preferences: Optional[List[str]] = None,
                  language: str = "en") -> Dict[str, Any]:
        warnings = self._guard(question)
        prefs = ", ".join(preferences) if preferences else "none"
        user = (
            f"Answer the following nutrition question in language code '{language}'. "
            f"Dietary preferences/restrictions (general): {prefs}. "
            f"Question: {question}"
        )
        messages = [{"role": "system", "content": _SYSTEM_DISCLAIMER},
                    {"role": "user", "content": user}]
        result = self._respond(messages)
        result.setdefault("warnings", []).extend(warnings)
        result["title"] = "Nutrition guidance"
        return result

    def chat(self, message: str,
             context: Optional[Dict[str, Any]] = None,
             language: str = "en") -> Dict[str, Any]:
        warnings = self._guard(message)
        ctx = (context or {}).get("general", "") or ""
        ctx = scrub_pii(str(ctx))
        user = f"Language code: {language}.\n"
        if ctx:
            user += f"General context: {ctx}\n"
        user += f"Patient message: {message}"
        messages = [{"role": "system", "content": _SYSTEM_DISCLAIMER},
                    {"role": "user", "content": user}]
        result = self._respond(messages)
        result.setdefault("warnings", []).extend(warnings)
        result["title"] = "Health assistant"
        return result


def create_guidance_service(settings: Optional[Settings] = None) -> GuidanceService:
    return GuidanceService(settings)