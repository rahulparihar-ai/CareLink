"""ABDM / ABHA adapter.

Linking an ABHA address via the Health ID / ABDM gateway is a FUTURE
INTEGRATION. Until then this returns mock link placeholders and never claims
a real ABHA number is active.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass
class AbhaLinkResult:
    ok: bool
    status: str            # not_linked | linking | linked
    abha_address: Optional[str] = None
    detail: str = ""


class ABDMAdapter:
    """Interface for ABDM/ABHA. Mock never fabricates a linked ABHA."""

    def __init__(self, gateway_url: Optional[str] = None,
                 client_id: Optional[str] = None,
                 client_secret: Optional[str] = None) -> None:
        self.gateway_url = gateway_url
        self.client_id = client_id
        self.client_secret = client_secret
        self.live = bool(gateway_url and client_id and client_secret)

    def initiate_linking(self, patient_reference: str,
                         consent: bool) -> AbhaLinkResult:
        # FUTURE INTEGRATION: Call ABDM gateway to create a linking session.
        return AbhaLinkResult(
            ok=True,
            status="linking",
            abha_address=None,
            detail="ABHA linking flow initiated. This is a placeholder and does "
                   "not represent an active government identification.",
        )

    def confirm_linking(self, txn_id: str, otp: str) -> AbhaLinkResult:
        return AbhaLinkResult(
            ok=False,
            status="not_linked",
            detail="ABDM gateway not integrated; cannot confirm ABHA linking.",
        )

    def status(self) -> str:
        return "not_linked" if not self.live else "linking"