"""CareLink AI - structured data extraction.

Extracts structured fields (vitals, medications, allergies, dates) from free
text using conservative patterns so nothing is invented. This is used for both
history text and document text.
"""

from __future__ import annotations

import re
from typing import Optional

from ai.config.settings import Settings, get_settings
from ai.providers.base import LlmProvider
from ai.providers.factory import get_llm_provider


_VITAL_PATTERNS = [
    ("temperature", re.compile(r"temp(?:erature)?[:\s]*(\d{2}(?:\.\d)?)\s*(?:°|\s?C|F)?", re.IGNORECASE)),
    ("bp_systolic", re.compile(r"(?:bp|blood\s+pressure)[:\s]*(\d{2,3})/", re.IGNORECASE)),
    ("bp_diastolic", re.compile(r"(?:bp|blood\s+pressure)[:\s]*\d{2,3}/(\d{2,3})", re.IGNORECASE)),
    ("heart_rate", re.compile(r"(?:hr|pulse|heart\s+rate)[:\s]*(\d{2,3})\s*bpm?", re.IGNORECASE)),
    ("resp_rate", re.compile(r"(?:rr|resp(?:iration)?|respiratory\s+rate)[:\s]*(\d{2})\s*/?min", re.IGNORECASE)),
    ("spo2", re.compile(r"(?:spo2|o2\s*saturation)[:\s]*(\d{1,3})\s*%", re.IGNORECASE)),
]

_MEDICATION_PATTERN = re.compile(
    r"\b((?:tab|cap|syrup|mg|grams?|units?)?\s*[A-Za-z]{3,})(?:\s*\(([^)]*)\))?", re.IGNORECASE)


class DataExtractor:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._llm: Optional[LlmProvider] = None

    def extract_vitals(self, text: str) -> dict:
        low = (text or "").lower()
        out = {}
        for key, pattern in _VITAL_PATTERNS:
            m = pattern.search(low)
            if m:
                out[key] = m.group(1)
        return out

    def extract_medications(self, text: str) -> list[str]:
        """Best-effort medication mentions; NOT a verification or prescription."""
        items: list[str] = []
        for m in _MEDICATION_PATTERN.finditer(text or ""):
            token = (m.group(1) or "").strip()
            if 3 <= len(token) <= 24 and token.lower() not in ("tab", "cap", "mg", "ml", "units"):
                items.append(token)
        # De-dupe, keep order.
        seen = set()
        out = []
        for it in items:
            key = it.lower()
            if key not in seen:
                seen.add(key)
                out.append(it)
        return out

    def extract_allergies(self, text: str) -> list[str]:
        out: list[str] = []
        if not text:
            return out
        low = text.lower()
        marker = re.search(r"allerg(?:y|ies)[:\s]*([^.\n]+)", low)
        if marker:
            for part in marker.group(1).split(","):
                part = part.strip()
                if part and part.lower() not in ("none", "nil", "no", "n/a"):
                    out.append(part)
        return out


def create_data_extractor(settings: Optional[Settings] = None) -> DataExtractor:
    return DataExtractor(settings)