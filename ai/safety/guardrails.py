"""CareLink AI - guardrails for inputs and outputs.

These are deterministic, rule-based guardrails that work without a model:
  * prompt injection / manipulation keywords (best-effort)
  * input length enforcement
  * PII scrubbing of clinical text
  * disclaimer attachment to patient-facing reply text
  * "I am not a diagnosis" boundary text

Nothing here is a substitute for a doctor; boundaries are structural.
"""

from __future__ import annotations

import re
from typing import Optional

# Best-effort prompt injection signals (conservative, not a guarantee).
_INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior|instructions|rules)",
    r"forget\s+(?:all\s+)?(?:previous|prior)\s+instructions",
    r"you\s+are\s+now\s+(?:an?\s+)?(?!assistant)\w+",
    r"system\s+prompt",
    r"role\s*[:=]\s*(?:system|developer)",
    r"disregard\s+(?:prior|earlier)\s+instructions",
]

_DISCLAIMER = (
    "CareLink does not provide emergency alerts or definitive diagnoses on its own. "
    "Please discuss all findings with a qualified doctor. If you are in an emergency, "
    "contact emergency services right away."
)


def check_input_length(text: str, max_chars: int = 20000) -> Optional[str]:
    if text is None:
        return None
    if len(text) > max_chars:
        return f"input exceeds maximum length of {max_chars} characters"
    return None


def detect_injection(text: str) -> bool:
    if not text:
        return False
    for pattern in _INJECTION_PATTERNS:
        if re.search(pattern, text, flags=re.IGNORECASE):
            return True
    return False


# --- PII scrubbing --------------------------------------------------------

_ID_FLAG_PATTERNS = [
    re.compile(r"\b91[0-9]{10}\b"),                    # Aadhaar-like
    re.compile(r"\b\d{11}\b"),                         # PAN
    re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"),          # PAN (new)
    re.compile(r"\b19[0-9]{9,10}\b"),                  # very long numeric
]

def scrub_pii(text: str) -> str:
    """Replace likely PII tokens with a marker so they are not stored verbatim."""
    out = text
    out = re.sub(r"\b91[0-9]{10}\b", "[REDACTED-ID]", out)
    out = re.sub(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", "[REDACTED-PAN]", out)
    out = re.sub(r"\b\d{11}\b", "[REDACTED-NUM]", out)
    return out


def has_pii(text: str) -> bool:
    return any(p.search(text or "") for p in _ID_FLAG_PATTERNS)


def attach_disclaimer(text: str) -> str:
    """Attach a disclaimer unless one is already present."""
    if DISCLAIMER_SNIPPET.lower() in (text or "").lower():
        return text
    return f"{text}\n\n{_DISCLAIMER}"


DISCLAIMER_SNIPPET = "CareLink does not provide emergency alerts"


def guard_output(text: str) -> str:
    """Ensure the output carries the safety disclaimer (patient-facing)."""
    return attach_disclaimer(text)


class GuardrailResult:
    def __init__(self, blocked: bool = False, reasons: Optional[list[str]] = None,
                 allowed: bool = True) -> None:
        self.blocked = blocked
        self.allowed = allowed or not blocked
        self.reasons = reasons or []

    def to_dict(self) -> dict:
        return {"blocked": self.blocked, "allowed": self.allowed, "reasons": self.reasons}