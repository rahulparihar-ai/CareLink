"""CareLink AI - document OCR / processing pipeline."""

from ai.documents import create_document_processor


def process_document(text: str | None = None, filename: str | None = None,
                     file: bytes | None = None):
    proc = create_document_processor()
    ocr_text = text or ""
    if file and ocr_text == "":
        ocr_text = proc.ocr(file).get("text", "")
    classification = proc.classify(filename=filename or "", ocr_text=ocr_text)
    extraction = proc.extract(ocr_text)
    return {
        "classification": classification,
        "extraction": extraction,
        "ocr_preview": ocr_text[:500],
    }


def classify_document(filename: str | None = None, text: str | None = None):
    proc = create_document_processor()
    return proc.classify(filename=filename or "", ocr_text=text or "")