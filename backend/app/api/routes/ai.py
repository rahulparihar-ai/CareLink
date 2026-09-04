"""AI assistant routes (backend boundary).

The backend calls the separate AI service and validates/tags output with
provenance. AI NEVER autonomously diagnoses or prescribes; the doctor remains
the final clinical decision-maker. Mock mode is explicit in responses.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...config import get_settings
from ...database import get_db
from ...deps import CurrentUser, require_any_role
from ...models.models import AIInteraction
from ...schemas import (
    AiHistoryRequest,
    ApiResponse,
    GuidanceRequest,
    NutritionRequest,
    PatientChatRequest,
)
from ...services.ai_client import AiClient

router = APIRouter(prefix="/ai", tags=["ai"])


def _client():
    return AiClient(get_settings())


def _record(db: Session, current: CurrentUser, task: str, body, result: dict) -> None:
    db.add(AIInteraction(
        patient_id=current.patient_id,
        task=task,
        language=getattr(body, "language", "en"),
        mock=bool(result.get("mock", True)),
        provider=result.get("provider"),
        model=result.get("model"),
        request_summary=str(getattr(body, "message", "") or getattr(body, "question", "")
                           or getattr(body, "topic", ""))[:500],
        output_json=str(result),
        status="completed",
    ))
    db.commit()


@router.post("/history/message", response_model=ApiResponse[dict])
def history_message(body: AiHistoryRequest, db: Session = Depends(get_db),
                    current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    client = _client()
    result = client.interview_message(
        message=body.message,
        complaint=body.complaint or "",
        language=body.language,
        answered=body.answered_questions,
    )
    # Persist a provenance-tagged interaction record (never clinical truth).
    db.add(AIInteraction(
        patient_id=current.patient_id or body.patient_id,
        task="history_interview",
        language=body.language,
        mock=True if result.mock else False,
        provider=None,
        model=None,
        request_summary=body.message[:500],
        output_json=result.model_dump_json(),
        status="completed",
    ))
    db.commit()
    return ApiResponse(data=result.model_dump())


@router.post("/guidance", response_model=ApiResponse[dict])
def guidance(body: GuidanceRequest, db: Session = Depends(get_db),
             current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    result = _client().guidance(
        topic=body.topic, sub_topic=body.sub_topic,
        language=body.language, patient_context=body.patient_context,
    )
    _record(db, current, "guidance", body, result)
    return ApiResponse(data=result)


@router.post("/nutrition", response_model=ApiResponse[dict])
def nutrition(body: NutritionRequest, db: Session = Depends(get_db),
              current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    result = _client().nutrition(
        question=body.question, preferences=body.preferences, language=body.language,
    )
    _record(db, current, "nutrition", body, result)
    return ApiResponse(data=result)


@router.post("/chat", response_model=ApiResponse[dict])
def patient_chat(body: PatientChatRequest, db: Session = Depends(get_db),
                 current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    result = _client().patient_chat(
        message=body.message, context=body.context, language=body.language,
    )
    _record(db, current, "patient_chat", body, result)
    return ApiResponse(data=result)


@router.get("/health", response_model=ApiResponse[dict])
def ai_health():
    ok = _client().health()
    return ApiResponse(data={"ok": ok, "mock": not ok})