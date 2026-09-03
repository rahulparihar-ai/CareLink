"""CareLink AI - clinical safety policy.

Delta check: ensures every clinical output obeys the operating boundaries:
  * NEVER states a definitive diagnosis
  * NEVER prescribes/advises medication or dosage
  * NEVER declares/clears an emergency
  * MUST attach a disclaimer for patient-facing text
  * MUST score confidence conservatively

This is a structural policy (rules), not medical reasoning.
"""

from __future__ import annotations

import re
from typing import Optional

from .guardrails import DISCLAIMER_SNIPPET, attach_disclaimer

# Phrases that make an output non-compliant (absolute claims).
_NON_COMPLIANT = [
    r"you\s+have\s+(?:an?\s+)?[a-z]{3,}",                              # "you have X"
    r"this\s+is\s+(?:a|an)?\s*diagnosis",
    r"official\s+diagnosis",
    r"take\s+\d+\s*m?g?g?\b",                                          # "take 500 mg"
    r"prescribe",
    r"dosage\s+of\s+\d+",
    r"stop\s+taking",
    r"this\s+is\s+not\s+an\s+emergency",                                # declaring "not emergency"
]


class ClinicalSafetyError(ValueError):
    def __init__(self, message: str, findings: Optional[list[str]] = None) -> None:
        super().__init__(message)
        self.findings = findings or []


def check_clinical_safety(text: str) -> list[str]:
    """Return a list of safety violations found in ``text`` (empty = ok)."""
    findings: list[str] = []
    low = (text or "").lower()
    for pattern in _NON_COMPLIANT:
        if re.search(pattern, low):
            findings.append(f"non-compliant claim detected: '/{pattern}/'")
    return findings


def require_patient_safe(text: str) -> None:
    """Raise :class:`ClinicalSafetyError` if text is not patient-safe."""
    findings = check_clinical_safety(text)
    if findings:
        raise ClinicalSafetyError("output blocked by clinical safety policy", findings)


def ensure_disclaimer(text: str) -> str:
    return attach_disclaimer(text)


def is_emergency_keyword(text: str) -> bool:
    """Best-effort emergency keyword detection used to *suggest* escalation.

    This never overrides a doctor; it only flags text for human review.
    """
    if not text:
        return False
    keywords = (
        "unconscious", "breathing difficulty", "cannot breathe", "not breathing",
        "severe chest pain", "chest pain", "suicidal", "self harm", "self harm",
        "heavy bleeding", "seizure", "stroke symptoms",
    )
    low = text.lower()
    return any(kw in low for kw in keywords)