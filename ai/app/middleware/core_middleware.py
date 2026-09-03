"""CareLink AI - FastAPI middleware.

request_id: attach/expose a request id for audit.
security: optional bearer-token guard and input size limit.
error: deterministic error envelope on unhandled exceptions.
"""

from __future__ import annotations

import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

from ai.config.settings import Settings

# Bearer prefix match (case-insensitive).
_BEARER = "bearer"


class RequestIdMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, header: str = "X-Request-ID") -> None:
        super().__init__(app)
        self.header = header

    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get(self.header) or str(uuid.uuid4())
        request.state.request_id = rid
        response = await call_next(request)
        response.headers[self.header] = rid
        return response


class SecurityMiddleware(BaseHTTPMiddleware):
    """Optional bearer-token gate + request-size guard (skip when not enabled)."""

    def __init__(self, app, settings: Settings) -> None:
        super().__init__(app)
        self.require_auth = settings.require_auth
        self.secret = settings.shared_secret or ""
        self.max_chars = settings.max_input_chars
        self.request_id_header = settings.request_id_header

    async def dispatch(self, request: Request, call_next):
        if self.require_auth:
            header = request.headers.get("Authorization", "")
            parts = header.split(None, 1)
            ok = False
            if len(parts) == 2 and parts[0].lower() == _BEARER:
                ok = self.secret and (parts[1].strip() == self.secret)
            if not ok:
                return JSONResponse(status_code=401, content={
                    "success": False,
                    "error": {"code": "unauthorized", "message": "Missing or invalid token."},
                })

        # Body size guard (best-effort via content-length; streaming bodies
        # are bounded by the provider-level char checks too).
        content_length = request.headers.get("content-length")
        if content_length and content_length.isdigit() and int(content_length) > self.max_chars * 4:
            return JSONResponse(status_code=413, content={
                "success": False,
                "error": {"code": "payload_too_large", "message": "Request body too large."},
            })
        return await call_next(request)


def build_security_middleware(app, settings: Settings):
    return SecurityMiddleware(app, settings)


def build_cors(app, origins: list[str]):
    return CORSMiddleware(
        app,
        allow_origins=origins or ["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )