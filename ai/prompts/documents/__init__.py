"""CareLink AI - document prompt templates."""

from ai import get_prompt

_CLASSIFY_SYSTEM = get_prompt("document_classify")["system"]
_OCR_SYSTEM = get_prompt("document_ocr")["system"]
_EXTRACT_SYSTEM = get_prompt("document_extract")["system"]


def classify_system() -> str:
    return _CLASSIFY_SYSTEM


def ocr_system() -> str:
    return _OCR_SYSTEM


def extract_system() -> str:
    return _EXTRACT_SYSTEM