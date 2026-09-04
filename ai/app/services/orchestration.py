"""CareLink AI - application orchestration services.

Ties core modules (translation, clinical, documents, provenance, safety)
together behind the FastAPI routes. Each public method returns a plain dict
that the route layer wraps in a StandardResponse.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from ai.clinical.adapters import create_clinical_services
from ai.documents import create_document_processor
from ai.multilingual.translation import create_translation_service
from ai.provenance import SourceManager
from ai.safety.clinical_safety import is_emergency_keyword
from ai.safety.guardrails import check_input_length, detect_injection, scrub_pii
from ai.config.settings import Settings, get_settings
from ai.app.schemas.requests import (
    DetectRequest,
    DocTLRequest,
    DocumentRequest,
    GuidanceRequest,
    HistoryRequest,
    ImportRequest,
    InterviewRequest,
    NutritionRequest,
    OnboardRequest,
    PatientChatRequest,
    RedFlagRequest,
    TranslateRequest,
    ValidateRequest,
)
from ai.app.services.guidance import create_guidance_service


class AppServices:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.translation = create_translation_service(self.settings)
        self.clinical = create_clinical_services(self.settings)
        self.documents = create_document_processor(self.settings)
        self.wellness = create_guidance_service(self.settings)
        self.source = SourceManager(redact_pii=True)

    # ---- guard helpers ---------------------------------------------------

    def _guard(self, text: str) -> List[str]:
        warnings: List[str] = []
        too_long = check_input_length(text, self.settings.max_input_chars)
        if too_long:
            warnings.append(too_long)
        if detect_injection(text):
            warnings.append("possible prompt-injection-like pattern detected; handled defensively")
        return warnings

    # ---- language / translation -----------------------------------------

    def detect(self, req: DetectRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text)
        result = self.translation.detect_language(req.text)
        return {"detection": result, "warnings": warnings}

    def translate(self, req: TranslateRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text)
        result = self.translation.translate_text(req.text, req.target)
        return {**result, "warnings": warnings}

    # ---- interview ------------------------------------------------------

    def interview_message(self, req: InterviewRequest) -> Dict[str, Any]:
        warnings = self._guard(req.message)
        red_flags = self.clinical.red_flags.check(req.message)
        question = self.clinical.adaptive_questions.next_question(
            req.complaint, req.answered_questions, req.language
        )
        return {
            "reply": question["question"],
            "next_question": question["question"],
            "completed": question["completed"],
            "missing_count": question["missing_count"],
            "red_flags": red_flags,
            "emergency_keywords": is_emergency_keyword(req.message),
            "warnings": warnings,
        }

    # ---- history ---------------------------------------------------------

    def structure_history(self, req: HistoryRequest) -> Dict[str, Any]:
        warnings = self._guard(req.transcript)
        structure = self.clinical.history_extractor.structure(
            req.transcript, answers=req.answers,
            conversation_id=req.conversation_id, language=req.language
        )
        return {"history": structure, "warnings": warnings}

    def history_missing(self, req: HistoryRequest) -> Dict[str, Any]:
        from ai.clinical.history.extractor import build_missing_info, extract_ailment_free_text
        complaint = extract_ailment_free_text(req.transcript)
        missing = build_missing_info(req.answers or [], complaint)
        return {
            "complaint": complaint,
            "missing_information": missing,
            "count": len(missing),
        }

    def summarize_history(self, req: HistoryRequest, audience: str = "doctor") -> Dict[str, Any]:
        warnings = self._guard(req.transcript)
        structure = self.clinical.history_extractor.structure(
            req.transcript, answers=req.answers,
            conversation_id=req.conversation_id, language=req.language
        )
        summary = self.clinical.summary.summarize(
            structure, audience=audience, language=req.language, answers=req.answers
        )
        return {"summary": summary, "warnings": warnings}

    # ---- red flags -------------------------------------------------------

    def red_flags(self, req: RedFlagRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text)
        flags = self.clinical.red_flags.check(req.text)
        return {
            "red_flags": flags,
            "emergency_keywords": is_emergency_keyword(req.text),
            "warnings": warnings,
        }

    # ---- documents -------------------------------------------------------

    def classify_document(self, req: DocumentRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text or "")
        ocr_text = req.text or ""
        result = self.documents.classify(filename=req.filename or "", ocr_text=ocr_text)
        return {"classification": result, "warnings": warnings}

    def process_document(self, req: DocumentRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text or "")
        ocr_text = req.text or ""
        if not ocr_text and req.file:
            # Attempt OCR if a file was provided (mock returns placeholder).
            ocr_text = self.documents.ocr(req.file).get("text", "")
        classification = self.documents.classify(filename=req.filename or "", ocr_text=ocr_text)
        extraction = self.documents.extract(ocr_text)
        return {
            "classification": classification,
            "extraction": extraction,
            "ocr_preview": ocr_text[:500],
            "warnings": warnings,
        }

    def document_timeline(self, req: DocTLRequest) -> Dict[str, Any]:
        tl = self.documents.timeline(req.documents)
        return {"timeline": tl}

    # ---- onboarding ------------------------------------------------------

    def onboarding_guide(self, req: OnboardRequest) -> Dict[str, Any]:
        lang = req.language or "en"
        guide = (
            "Describe your symptoms in your own words, in the chat. "
            "You can share documents or talk aloud. CareLink will collect your "
            "history for your doctor; it does not diagnose on its own."
        )
        return {"guide": guide, "language": lang}

    # ---- wellness guidance / nutrition / general health chat -------------

    def guidance(self, req: GuidanceRequest) -> Dict[str, Any]:
        return self.wellness.guidance(
            req.topic, req.sub_topic, language=req.language,
            patient_context=req.patient_context,
        )

    def nutrition(self, req: NutritionRequest) -> Dict[str, Any]:
        return self.wellness.nutrition(
            req.question, preferences=req.preferences, language=req.language,
        )

    def patient_chat(self, req: PatientChatRequest) -> Dict[str, Any]:
        return self.wellness.chat(
            req.message, context=req.context, language=req.language,
        )

    # ---- validation / import (structured) --------------------------------

    def validate(self, req: ValidateRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text)
        input_len = len(req.text) if req.text else 0
        return {"valid": not warnings, "input_length": input_len, "warnings": warnings}

    def import_data(self, req: ImportRequest) -> Dict[str, Any]:
        warnings = self._guard(req.text or "")
        return {"imported": True, "text": scrub_pii(req.text or "")[:500], "warnings": warnings}


def create_app_services(settings: Optional[Settings] = None) -> AppServices:
    return AppServices(settings)