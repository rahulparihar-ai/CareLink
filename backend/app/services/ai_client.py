"""CareLink Backend — AI client.

Talks to the separate AI service (ai/) over HTTP. AI output is validated and
tagged with provenance before it is ever returned to a clinician. If the AI
service is unreachable, a structured mock reply is returned with mock=True so
the product stays usable and the boundary is clear.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import httpx

from ..config import Settings
from ..schemas import AiHistoryResponseRef

logger = logging.getLogger("carelink.ai_client")


class AiClient:
    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.ai_service_url.strip("/") if settings.ai_service_url else ""
        self.request_timeout = settings.ai_timeout_ms / 1000.0

    def _post(self, path: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        if not self.base_url:
            raise AiUnavailable("AI service URL not configured.")
        url = f"{self.base_url}{path}"
        try:
            resp = httpx.post(url, json=payload, timeout=self.request_timeout)
            resp.raise_for_status()
            body = resp.json()
        except (httpx.HTTPError, ValueError) as exc:
            raise AiUnavailable(f"AI service unreachable: {exc}") from exc
        # Unwrap the envelope.
        if isinstance(body, dict) and "data" in body:
            return body["data"] if body.get("success") else {}
        return body if isinstance(body, dict) else {}

    def interview_message(self, message: str, complaint: str,
                          language: str, answered: List[str],
                          conversation_id: Optional[str] = None) -> AiHistoryResponseRef:
        def mock() -> AiHistoryResponseRef:
            return AiHistoryResponseRef(
                reply=None,
                next_question="Please describe any symptoms in detail.",
                completed=False,
                mock=True,
            )

        if not message.strip():
            return mock()
        try:
            result = self._post("/interview/message", {
                "message": message,
                "complaint": complaint or "",
                "language": language,
                "conversation_id": conversation_id,
                "answered_questions": answered,
            })
        except AiUnavailable:
            return mock()

        return AiHistoryResponseRef(
            reply=result.get("reply"),
            next_question=result.get("next_question"),
            completed=bool(result.get("completed")),
            history=result.get("history"),
            red_flags=result.get("red_flags") or [],
            mock=bool(result.get("mock", True)),
        )

    def process_document(self, file_bytes: bytes, filename: str,
                         mime_type: Optional[str]) -> Dict[str, Any]:
        """OCR/extract a document via the AI service."""
        try:
            return self._post("/documents/process", {
                "text": None,
                "filename": filename,
                "file": list(file_bytes),
                "mime_type": mime_type,
                "language": "en",
            })
        except AiUnavailable:
            return {"ocr_status": "pending", "needs_review": True,
                    "mock": True, "warning": "AI document service unavailable."}

    def health(self) -> bool:
        try:
            result = self._post("/health", {})
            return bool(result)
        except AiUnavailable:
            return False


class AiUnavailable(Exception):
    pass