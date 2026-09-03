"""CareLink AI - FastAPI routes.

Exposes the AI capabilities under /api/ai/*. Each route calls a method on
AppServices and wraps the result in a StandardResponse. Errors are caught and
mapped to a StandardError.
"""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Request

from ai.prompts import get_prompt_version
from ai.app.schemas.requests import (
    DetectRequest,
    DocTLRequest,
    DocumentRequest,
    HistoryRequest,
    InterviewRequest,
    OnboardRequest,
    RedFlagRequest,
    TranslateRequest,
    ValidateRequest,
)
from ai.app.schemas.responses import MetadataOut, StandardResponse
from ai.app.services.orchestration import AppServices, create_app_services

router = APIRouter(prefix="/api/ai", tags=["ai"])

_services: AppServices | None = None


def set_services(services: AppServices) -> None:
    global _services
    _services = services


def _svc() -> AppServices:
    global _services
    if _services is None:
        _services = create_app_services()
    return _services


def _metadata(request: Request, task: str) -> MetadataOut:
    svc = _svc()
    return MetadataOut(
        model=svc.settings.model or None,
        provider=svc.settings.provider_kind.value,
        mock=svc.settings.is_mock(),
        request_id=getattr(request.state, "request_id", None),
        task=task,
        prompt_version=get_prompt_version(task),
    )


def _wrap(request: Request, task: str, data: Dict[str, Any],
          warnings: List[str] | None = None) -> StandardResponse:
    return StandardResponse(data=data, metadata=_metadata(request, task),
                            warnings=warnings or [])


# -- health ----------------------------------------------------------------


@router.get("/health", response_model=StandardResponse)
def health(request: Request) -> StandardResponse:
    svc = _svc()
    return _wrap(request, "health", {
        "status": "ok",
        "mock": svc.settings.is_mock(),
        "provider": svc.settings.provider_kind.value,
        "model": svc.settings.model or None,
    })


# -- language / translation ------------------------------------------------


@router.post("/lang/detect", response_model=StandardResponse)
def detect_language(req: DetectRequest, request: Request) -> StandardResponse:
    result = _svc().detect(req)
    det = result.get("detection", {})
    warnings = result.get("warnings", [])
    resp = _wrap(request, "language_detect", {"detection": det}, warnings)
    resp.metadata.language = det.get("language", "English")
    resp.metadata.language_code = det.get("language_code")
    resp.metadata.direction = det.get("direction")
    return resp


@router.post("/lang/translate", response_model=StandardResponse)
def translate(req: TranslateRequest, request: Request) -> StandardResponse:
    result = _svc().translate(req)
    warnings = result.pop("warnings", [])
    resp = _wrap(request, "translate", result, warnings)
    resp.metadata.language_code = req.target
    resp.metadata.direction = result.get("direction")
    resp.metadata.model = result.get("provider") if result.get("mock") else _svc().settings.model
    return resp


# -- interview / history ---------------------------------------------------


@router.post("/interview/message", response_model=StandardResponse)
def interview_message(req: InterviewRequest, request: Request) -> StandardResponse:
    result = _svc().interview_message(req)
    warnings = result.pop("warnings", [])
    resp = _wrap(request, "interview_message", result, warnings)
    resp.metadata.language_code = req.language
    return resp


@router.post("/history/structure", response_model=StandardResponse)
def structure_history(req: HistoryRequest, request: Request) -> StandardResponse:
    result = _svc().structure_history(req)
    warnings = result.pop("warnings", [])
    resp = _wrap(request, "history_structure", result, warnings)
    resp.metadata.language_code = req.language
    return resp


@router.post("/history/summarize", response_model=StandardResponse)
def summarize_history(req: HistoryRequest, request: Request) -> StandardResponse:
    result = _svc().summarize_history(req)
    warnings = result.pop("warnings", [])
    resp = _wrap(request, "history_summarize", result, warnings)
    resp.metadata.language_code = req.language
    return resp


# -- red flags --------------------------------------------------------------


@router.post("/red-flags", response_model=StandardResponse)
def red_flags(req: RedFlagRequest, request: Request) -> StandardResponse:
    result = _svc().red_flags(req)
    warnings = result.pop("warnings", [])
    return _wrap(request, "red_flags", result, warnings)


# -- documents --------------------------------------------------------------


@router.post("/documents/classify", response_model=StandardResponse)
def classify_document(req: DocumentRequest, request: Request) -> StandardResponse:
    result = _svc().classify_document(req)
    warnings = result.pop("warnings", [])
    return _wrap(request, "document_classify", result, warnings)


@router.post("/documents/process", response_model=StandardResponse)
def process_document(req: DocumentRequest, request: Request) -> StandardResponse:
    result = _svc().process_document(req)
    warnings = result.pop("warnings", [])
    return _wrap(request, "document_extract", result, warnings)


@router.post("/documents/timeline", response_model=StandardResponse)
def document_timeline(req: DocTLRequest, request: Request) -> StandardResponse:
    result = _svc().document_timeline(req)
    return _wrap(request, "document_summarize", result)


# -- onboarding / validate -------------------------------------------------


@router.post("/onboarding", response_model=StandardResponse)
def onboarding(req: OnboardRequest, request: Request) -> StandardResponse:
    result = _svc().onboarding_guide(req)
    return _wrap(request, "onboarding_guide", result)


@router.post("/validate", response_model=StandardResponse)
def validate(req: ValidateRequest, request: Request) -> StandardResponse:
    result = _svc().validate(req)
    warnings = result.pop("warnings", [])
    return _wrap(request, "validate", result, warnings)