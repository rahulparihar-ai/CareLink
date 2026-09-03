"""CareLink AI - core I/O schemas.

These are the shared contracts used across the service and exposed (indirectly)
to the backend. They are intentionally JSON-serializable and provider-agnostic.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------


class FactStatus(str, Enum):
    """Verification / provenance status of a single clinical fact."""

    PATIENT_REPORTED = "patient_reported"
    AI_EXTRACTED = "ai_extracted"
    AI_INFERRED = "ai_inferred"
    DOCTOR_VERIFIED = "doctor_verified"
    DOCTOR_EDITED = "doctor_edited"
    REJECTED = "rejected"
    UNKNOWN = "unknown"


class FactSourceType(str, Enum):
    """Where a clinical fact originated."""

    PATIENT_INTERVIEW = "patient_interview"
    VOICE_INPUT = "voice_input"
    TEXT_INPUT = "text_input"
    UPLOADED_DOCUMENT = "uploaded_document"
    PREVIOUS_ENCOUNTER = "previous_encounter"
    DOCTOR_INPUT = "doctor_input"
    LAB_REPORT = "lab_report"
    PRESCRIPTION = "prescription"
    DISCHARGE_SUMMARY = "discharge_summary"


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    NEEDS_REVIEW = "needs_review"
    VERIFIED = "verified"
    EDITED = "edited"
    REJECTED = "rejected"


class RedFlagSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Priority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class TaskKind(str, Enum):
    LANGUAGE_DETECT = "language_detect"
    TRANSLATE = "translate"
    INTERVIEW_START = "interview_start"
    INTERVIEW_MESSAGE = "interview_message"
    INTERVIEW_NEXT_QUESTION = "interview_next_question"
    INTERVIEW_COMPLETE = "interview_complete"
    HISTORY_STRUCTURE = "history_structure"
    HISTORY_MISSING = "history_missing"
    HISTORY_SUMMARIZE = "history_summarize"
    RED_FLAGS = "red_flags"
    DOCUMENT_CLASSIFY = "document_classify"
    DOCUMENT_OCR = "document_ocr"
    DOCUMENT_EXTRACT = "document_extract"
    DOCUMENT_SUMMARIZE = "document_summarize"
    DOCTOR_SUMMARY = "doctor_summary"
    PATIENT_SUMMARY = "patient_summary"
    VOICE_TRANSCRIBE = "voice_transcribe"
    VOICE_SYNTHESIZE = "voice_synthesize"
    ONBOARDING_GUIDE = "onboarding_guide"
    VALIDATE = "validate"


class ValidationSeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"


class DocumentKind(str, Enum):
    PRESCRIPTION = "prescription"
    LAB_REPORT = "lab_report"
    DISCHARGE_SUMMARY = "discharge_summary"
    CONSULTATION_NOTE = "consultation_note"
    IMAGING_REPORT = "imaging_report"
    MEDICAL_CERTIFICATE = "medical_certificate"
    OTHER = "other_medical_document"


# ---------------------------------------------------------------------------
# Base response envelope
# ---------------------------------------------------------------------------


class LanguageMetadata(BaseModel):
    """Language + rendering metadata returned with every AI response."""

    language: str = Field(description="Human-readable language name, e.g. 'Urdu'")
    language_code: str = Field(description="ISO-639-1/2 code, e.g. 'ur'")
    direction: str = Field(description="Text direction: 'ltr' or 'rtl'")


class Metadata(BaseModel):
    language: str = "en"
    language_meta: LanguageMetadata | None = None
    model: str = "mock"
    provider: str = "mock"
    request_id: Optional[str] = None
    task: Optional[str] = None
    mock: bool = True
    prompt_version: Optional[str] = None


class ApiError(BaseModel):
    code: str
    message: str


class ApiResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any] = Field(default_factory=dict)
    metadata: Metadata = Field(default_factory=Metadata)
    warnings: List[str] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    success: bool = False
    error: ApiError
    metadata: Metadata = Field(default_factory=Metadata)
    warnings: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Provenance
# ---------------------------------------------------------------------------


class SourceRef(BaseModel):
    type: str = FactSourceType.PATIENT_INTERVIEW.value
    source_id: Optional[str] = None
    document_id: Optional[str] = None
    page_section: Optional[str] = None
    original_text: Optional[str] = None


class ClinicalFact(BaseModel):
    """A single clinical fact with full provenance + status."""

    value: Any
    key: Optional[str] = None
    source: SourceRef = Field(default_factory=SourceRef)
    confidence: Union[float, str] = 0.5
    status: FactStatus = FactStatus.AI_EXTRACTED
    verification_status: VerificationStatus = VerificationStatus.NEEDS_REVIEW
    ai_generated: bool = True
    doctor_verified: bool = False
    reported_at: Optional[str] = None
    note: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Request / result shims
# ---------------------------------------------------------------------------


class InterviewContext(BaseModel):
    conversation_id: Optional[str] = None
    patient_reference: Optional[str] = None
    session_id: Optional[str] = None
    language: str = "en"
    clinical_context: Dict[str, Any] = Field(default_factory=dict)
    age: Optional[int] = None
    gender: Optional[str] = None
    practice_mode: Optional[str] = None


class AiTask(BaseModel):
    kind: TaskKind
    request: Dict[str, Any] = Field(default_factory=dict)
    context: Optional[InterviewContext] = None
    started_at: datetime = Field(default_factory=_utcnow)
    request_id: Optional[str] = None


class AuditEvent(BaseModel):
    """Lightweight audit record. Does NOT hold raw patient data."""

    task: str
    timestamp: datetime = Field(default_factory=_utcnow)
    provider: str = "mock"
    model: str = "mock"
    request_id: Optional[str] = None
    success: bool = True
    confidence: Optional[Union[float, str]] = None
    safety_checks: List[str] = Field(default_factory=list)
    error: Optional[str] = None
    input_reference: Optional[str] = None
    output_reference: Optional[str] = None


class ValidationFinding(BaseModel):
    severity: ValidationSeverity = ValidationSeverity.INFO
    code: str
    message: str
    field: Optional[str] = None