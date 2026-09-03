"""CareLink AI - document processing.

Handles uploaded medical documents: classification, OCR (via provider),
structured extraction, and a timeline builder. In mock mode it returns
clearly-labeled placeholder results so the pipeline runs offline.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings, get_settings
from ai.providers.base import LlmProvider, VisionProvider
from ai.providers.factory import get_llm_provider, get_vision_provider
from ai.schemas.base import DocumentKind
from ai.safety.clinical_safety import check_clinical_safety
from ai.clinical.extraction import DataExtractor

# Fallback classification tokens (used when no OCR).
_CLASSIFY_HINTS = {
    "prescription": ("rx", "tab", "cap", "mg", "take", "advice"),
    "lab_report": ("test", "lab", "value", "hb", "wbc", "glucose", "cholesterol", "hemoglobin"),
    "discharge_summary": ("discharge", "admission", "inpatient", "summary"),
    "consultation_note": ("consultation note", "intake note", "opd note", "consultation", "history of present illness"),
    "imaging_report": ("x-ray", "mri", "ct scan", "ultrasound", "imaging"),
    "medical_certificate": ("certificate", "medical certificate", "fitness"),
}


class DocumentProcessor:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self._vision: Optional[VisionProvider] = None
        self._llm: Optional[LlmProvider] = None
        self.data_extractor = DataExtractor(self.settings)

    def _vision_provider(self) -> VisionProvider:
        if self._vision is None:
            self._vision = get_vision_provider(self.settings)
        return self._vision

    def classify(self, filename: str = "", filename_hint: str = "",
                 ocr_text: str = "") -> dict:
        hint = (filename or "") + " " + filename_hint
        text = (ocr_text or "") + " " + hint
        low = text.lower()
        for kind in DocumentKind:
            tokens = _CLASSIFY_HINTS.get(kind.value, ())
            if tokens and any(t in low for t in tokens):
                return {"document_kind": kind.value, "confidence": 0.7, "mock": True}
        return {"document_kind": DocumentKind.OTHER.value, "confidence": 0.4, "mock": True}

    def ocr(self, image_bytes: bytes) -> dict:
        if self.settings.is_mock():
            return {"text": "[mock ocr] no text read in demo mode", "confidence": 0.2,
                    "mock": True}
        result = self._vision_provider().ocr(image_bytes)
        return result

    def extract(self, text: str) -> dict:
        vitals = self.data_extractor.extract_vitals(text)
        medications = self.data_extractor.extract_medications(text)
        allergies = self.data_extractor.extract_allergies(text)
        findings = check_clinical_safety(text)
        return {
            "vitals": vitals,
            "medications": medications,
            "allergies": allergies,
            "extracted_free_text": [],
            "confidence": 0.5,
            "safety_findings": findings,
        }

    def timeline(self, documents: list[dict]) -> dict:
        events = []
        for doc in documents:
            if not isinstance(doc, dict):
                continue
            events.append({
                "reference": doc.get("reference") or doc.get("document_id"),
                "document_kind": doc.get("document_kind") or "other_medical_document",
                "date": doc.get("date"),
                "note": doc.get("note") or "",
            })
        events.sort(key=lambda e: (e["date"] or ""), reverse=False)
        return {
            "events": events,
            "count": len(events),
            "provider": "rule_based",
            "mock": True,
        }


def create_document_processor(settings: Optional[Settings] = None) -> DocumentProcessor:
    return DocumentProcessor(settings)