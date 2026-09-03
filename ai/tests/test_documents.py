"""Tests for document processing: classification, OCR, extraction, timeline."""

from __future__ import annotations

from ai.documents import create_document_processor
from ai.schemas.base import DocumentKind


def test_classify_prescription():
    processor = create_document_processor()
    result = processor.classify(filename="rx.pdf", ocr_text="take tab paracetamol 500mg")
    assert result["document_kind"] == "prescription"
    assert result["confidence"] >= 0.5


def test_classify_lab_report():
    processor = create_document_processor()
    result = processor.classify(filename="lab.pdf", ocr_text="hemoglobin 14 g/dL")
    assert result["document_kind"] == "lab_report"


def test_classify_unknown_returns_other():
    processor = create_document_processor()
    result = processor.classify(filename="photo.jpg", ocr_text="some notes")
    assert result["document_kind"] == DocumentKind.OTHER.value


def test_ocr_mock_returns_placeholder():
    processor = create_document_processor()
    result = processor.ocr(b"\x00fake")
    assert result["mock"] is True
    assert result["text"]


def test_extract_medications_and_allergies():
    processor = create_document_processor()
    result = processor.extract("Allergies: penicillin. Tab paracetamol 500mg.")
    assert "penicillin" in result["allergies"]
    assert any("paracetamol" in m.lower() for m in result["medications"])


def test_timeline_sorts_and_counts():
    processor = create_document_processor()
    docs = [
        {"reference": "A", "document_kind": "prescription", "date": "2024-02-01"},
        {"reference": "B", "document_kind": "lab_report", "date": "2024-01-05"},
    ]
    result = processor.timeline(docs)
    assert result["count"] == 2
    assert result["events"][0]["reference"] == "B"


def test_timeline_ignores_non_dicts():
    processor = create_document_processor()
    result = processor.timeline(["junk", {"reference": "X"}])
    assert result["count"] == 1