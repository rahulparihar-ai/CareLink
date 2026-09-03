"""Professional verification adapter.

Hospital affiliation is NOT treated as professional verification. A registry
against state medical councils is a FUTURE INTEGRATION; until then, a mock
returns 'unverified' (never 'verified') so the UI must not claim validation.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class VerificationResult:
    status: str           # unverified | pending | verified
    source: str           # "mock" | "council"
    detail: str = ""


class ProfessionalVerification:
    """Checks a practitioner's registration against professional councils.

    mock mode never fabricates a 'verified' status.
    """

    def __init__(self, registry_url: Optional[str] = None) -> None:
        self.registry_url = registry_url
        self.live = bool(registry_url)

    def check(self, registration_number: str,
              name: Optional[str] = None) -> VerificationResult:
        if not self.live:
            return VerificationResult(
                status="unverified",
                source="mock",
                detail="Professional verification registry not configured.",
            )
        # FUTURE INTEGRATION: call state medical council registry here.
        return VerificationResult(
            status="pending",
            source="council",
            detail="Under review.",
        )


class VerificationService:
    """Tracks verification records but never fabricates a verified result."""

    def __init__(self, adapter: Optional[ProfessionalVerification] = None) -> None:
        self.adapter = adapter or ProfessionalVerification()

    def submit(self, db, practitioner_id: str, registration_number: str,
               name: Optional[str] = None, *, actor: str = "") -> VerificationResult:
        from ..models.models import VerificationRecord

        result = self.adapter.check(registration_number, name)
        db.add(VerificationRecord(
            practitioner_id=practitioner_id,
            verification_type="professional",
            provider=result.source,
            status=_upcase(result.status),
            detail=result.detail,
            external_reference=registration_number or None,
        ))
        db.commit()
        return result


def _upcase(status: str) -> str:
    mapping = {"unverified": "Pending", "pending": "Pending",
               "verified": "Verified"}
    first = status.split(" ", 1)[0].lower()
    return mapping.get(first, status)