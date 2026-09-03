"""Health record import adapter.

Importing records from ABDM / NDHM / other PHR apps is a FUTURE INTEGRATION.
Mock returns an empty import and never fabricates a patient's records.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ImportResult:
    ok: bool
    source: str
    imported: int = 0
    records: List[Dict[str, Any]] = field(default_factory=list)
    detail: str = ""


class HealthRecordImport:
    def __init__(self, source_url: Optional[str] = None) -> None:
        self.source_url = source_url
        self.live = bool(source_url)

    def import_records(self, patient_reference: str,
                       consent: bool) -> ImportResult:
        if not consent:
            return ImportResult(ok=False, source="none",
                                detail="Consent required to import records.")
        # FUTURE INTEGRATION: pull records from ABDM/NDHM.
        return ImportResult(
            ok=True,
            source="mock" if not self.live else "abdm",
            imported=0,
            records=[],
            detail="No records imported. External record import is a future "
                   "integration and never fabricates patient data.",
        )