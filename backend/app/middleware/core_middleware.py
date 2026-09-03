"""CareLink Backend — core middleware.

request_id: attach/expose a request id for audit + traceability.
request logging: structured, non-clinical (never logs bodies/PII).
simple rate limiting: in-memory token window for unscoped endpoints (post-auth
RBAC still applies; this guards login/OTP and general abuse).
"""

from __future__ import annotations

import logging
import threading
import time
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger("carelink.middleware")

_session_state = threading.local()


def request_id() -> str:
    return getattr(_session_state, "request_id", "")


class RequestContextMiddleware:
    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request = Request(scope, receive)
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        _session_state.request_id = rid

        start = time.monotonic()
        response = await self.app(scope, receive, send)
        latency_ms = int((time.monotonic() - start) * 1000)
        status = getattr(response, "status_code", 0)
        logger.info(
            "request ridge=%s method=%s path=%s status=%s latency_ms=%s",
            rid, scope.get("method"), scope.get("path"), status, latency_ms,
        )
        return response


class SimpleRateLimiter:
    """Fixed-window in-memory rate limiter keyed by client address."""

    def __init__(self, limit: int, window_seconds: int = 60) -> None:
        self.limit = limit
        self.window = window_seconds
        self._hits: dict[str, tuple[float, int]] = {}
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = time.monotonic()
        with self._lock:
            window_start, count = self._hits.get(key, (now, 0))
            if now - window_start >= self.window:
                window_start, count = now, 0
            if count >= self.limit:
                return False
            self._hits[key] = (window_start, count + 1)
            return True


class RateLimitMiddleware:
    def __init__(self, app, limit: int, window: int = 60) -> None:
        self.app = app
        self.limiter = SimpleRateLimiter(limit, window)

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        request = Request(scope, receive)
        key = request.client.host if request.client else "unknown"
        if not self.limiter.allow(key):
            response = JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {"code": "too_many_requests",
                              "message": "Rate limit exceeded. Please try again shortly."},
                    "request_id": getattr(request.state, "request_id", None),
                },
            )
            await response(scope, receive, send)
            return
        await self.app(scope, receive, send)


def add_middleware(app: FastAPI, *, rate_limit: int, rate_window: int,
                   rate_limit_enabled: bool) -> None:
    """Install rate limiting if enabled."""
    if rate_limit_enabled:
        app.add_middleware(RateLimitMiddleware, limit=rate_limit, window=rate_window)