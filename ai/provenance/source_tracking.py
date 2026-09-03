"""CareLink AI - provenance / source tracking.

Tracks where each extracted clinical fact came from (source type, id, section,
original snippet) and attaches a verification status. Everything is auditable
but raw PII is not stored verbatim when redaction is enabled.
"""

from __future__ import annotations

import uuid
from typing import Optional

from ai.safety.guardrails import scrub_pii


class ProvenanceTracker:
    def __init__(self, redact_pii: bool = True) -> None:
        self.redact_pii = redact_pii
        self.records: list[dict] = []

    def record(self, *, source_type: str, source_id: Optional[str] = None,
               document_id: Optional[str] = None, page_section: Optional[str] = None,
               original_text: Optional[str] = None, key: Optional[str] = None,
               fragment: Optional[str] = None) -> dict:
        rec = {
            "id": str(uuid.uuid4()),
            "source_type": source_type,
            "source_id": source_id,
            "document_id": document_id,
            "page_section": page_section,
            "key": key,
            "fragment": scrub_pii(fragment or "") if self.redact_pii else (fragment or ""),
        }
        if self.redact_pii and original_text:
            rec["original_text_redacted"] = scrub_pii(original_text)
        self.records.append(rec)
        return rec

    def to_dict(self) -> dict:
        return {"records": self.records, "count": len(self.records)}


class SourceManager:
    """High-level provenance facade used by pipelines."""

    def __init__(self, redact_pii: bool = True) -> None:
        self.tracker = ProvenanceTracker(redact_pii=redact_pii)

    def note_from_interview(self, conversation_id: str, fragment: str) -> dict:
        return self.tracker.record(source_type="patient_interview",
                                   source_id=conversation_id, fragment=fragment)

    def note_from_document(self, document_id: str, page_section: str, fragment: str) -> dict:
        return self.tracker.record(source_type="uploaded_document",
                                   document_id=document_id, page_section=page_section,
                                   fragment=fragment)

    def attach_to_facts(self, facts: list[dict], refs: list[dict]) -> list[dict]:
        for fact in facts:
            if isinstance(fact, dict):
                fact.setdefault("provenance", {})
                fact["provenance"]["sources"] = refs
        return facts

    def snapshot(self) -> dict:
        return self.tracker.to_dict()