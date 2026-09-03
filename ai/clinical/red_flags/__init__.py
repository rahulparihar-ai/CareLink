"""CareLink AI - red-flag detection.

Suggests follow-up/escalation for *symptom keywords*, never a diagnosis. In mock
mode this is rule-based. Red flags are suggestions for human review only and
never trigger autonomous action.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings, get_settings
from ai.providers.base import LlmProvider
from ai.providers.factory import get_llm_provider
from ai.schemas.base import RedFlagSeverity
from ai.safety.clinical_safety import is_emergency_keyword

# Symptom keyword -> severity suggestion (educational, not diagnostic).
_RULES: list[dict] = [
    {"keywords": ("unconscious", "unresponsive", "not breathing"), "severity": "critical",
     "advice": "This may need emergency review right away."},
    {"keywords": ("difficulty breathing", "breathing difficulty", "breathlessness", "cannot breathe"),
     "severity": "high", "advice": "Discuss with a doctor promptly; breathing difficulty can be serious."},
    {"keywords": ("severe chest pain", "chest pain", "heavy bleeding"), "severity": "high",
     "advice": "Please see a doctor or emergency services as soon as possible."},
    {"keywords": ("seizure", "stroke", "weakness on one side", "slurred speech", "confusion"),
     "severity": "high", "advice": "Seek urgent medical care."},
    {"keywords": ("suicidal", "self harm", "want to hurt myself"), "severity": "critical",
     "advice": "Urgent help: please reach out to a crisis helpline or emergency services."},
]


class RedFlagService:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._llm: Optional[LlmProvider] = None

    def check(self, text: str) -> list[dict]:
        low = (text or "").lower()
        flags: list[dict] = []
        for rule in _RULES:
            matched = any(kw in low for kw in rule["keywords"])
            if matched:
                flags.append({
                    "severity": rule["severity"],
                    "suggested": True,
                    "advice": rule["advice"],
                    "escalate": rule["severity"] in ("high", "critical"),
                    "rule_id": f"rule-{len(flags)}",
                })
        return flags


def create_red_flag_service(settings: Optional[Settings] = None) -> RedFlagService:
    return RedFlagService(settings)