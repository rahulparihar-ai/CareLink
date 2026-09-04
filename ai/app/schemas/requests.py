"""CareLink AI - FastAPI Pydantic request models.

These are the wire contracts the backend sends to the AI service. They use the
same vocabulary as the core schema objects but are kept separate so the HTTP
layer is explicit and versionable.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ImportRequest(BaseModel):
    source: str = Field(description="Comma separated sources - reserved")
    text: Optional[str] = None
    language: str = "en"
    conversation_id: Optional[str] = None
    patient_reference: Optional[str] = None


class InterviewRequest(BaseModel):
    message: str = Field(description="Patient's latest message")
    complaint: str = Field(description="Detected presenting complaint")
    language: str = "en"
    conversation_id: Optional[str] = None
    answered_questions: List[str] = Field(default_factory=list)
    session_id: Optional[str] = None


class HistoryRequest(BaseModel):
    transcript: str = Field(description="Raw patient transcript")
    answers: List[str] = Field(default_factory=list)
    conversation_id: Optional[str] = None
    language: str = "en"


class RedFlagRequest(BaseModel):
    text: str


class DocumentRequest(BaseModel):
    text: Optional[str] = None
    filename: Optional[str] = None
    file: Optional[bytes] = None
    mime_type: Optional[str] = None
    language: str = "en"


class TranslateRequest(BaseModel):
    text: str
    target: str = "en"
    source: Optional[str] = None


class DetectRequest(BaseModel):
    text: str


class DocTLRequest(BaseModel):
    documents: List[Dict[str, Any]] = Field(default_factory=list)


class OnboardRequest(BaseModel):
    language: str = "en"


class ValidateRequest(BaseModel):
    text: str
    task: Optional[str] = None


class GuidanceRequest(BaseModel):
    topic: str = Field(description="Guidance topic key (routine/sleep/nutrition/etc.)")
    sub_topic: Optional[str] = Field(default=None, description="Optional more specific sub-topic")
    language: str = "en"
    patient_context: Optional[Dict[str, Any]] = Field(default_factory=dict,
                                                      description="General, non-clinical context")


class NutritionRequest(BaseModel):
    question: str = Field(description="Patient's nutrition question")
    preferences: Optional[List[str]] = Field(default_factory=list,
                                             description="Dietary preferences / restrictions (general)")
    language: str = "en"


class PatientChatRequest(BaseModel):
    message: str = Field(description="Patient's message to the health assistant")
    context: Optional[Dict[str, Any]] = Field(default_factory=dict,
                                              description="General non-clinical context")
    language: str = "en"