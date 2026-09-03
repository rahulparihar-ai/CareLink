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
from ...schemas import AiHistoryRequest, ApiResponse
from ...services.ai_client import AiClient

router = APIRouter(prefix="/ai", tags=["ai"])


def _client():
    return AiClient(get_settings())


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


@router.get("/health", response_model=ApiResponse[dict])
def ai_health():
    ok = _client().health()
    return ApiResponse(data={"ok": ok, "mock": not ok})