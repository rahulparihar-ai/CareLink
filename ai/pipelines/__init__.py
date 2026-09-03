"""CareLink AI - pipelines package.

Thin orchestration facades over the feature modules. Each pipeline groups the
capabilities for a single workflow (OCR/documents, history, red flags,
translation) so the backend can call one entry point per concern.
"""

from .document_ocr import classify_document, process_document
from .history import next_question, structure_history
from .red_flags import check_red_flags
from .translation import detect_language, translate_text

__all__ = [
    "classify_document",
    "process_document",
    "structure_history",
    "next_question",
    "check_red_flags",
    "detect_language",
    "translate_text",
]