"""CareLink Backend — application exceptions and error handlers.

A single, consistent error envelope is returned for every failure:
  {"success": false, "error": {"code", "message"}, "request_id"}
Never includes stack traces or secrets.
"""

from __future__ import annotations

from typing import Optional

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    status_code = 400
    code = "bad_request"

    def __init__(self, message: str, *, code: Optional[str] = None,
                 request_id: Optional[str] = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        self.request_id = request_id


class BadRequestError(AppError):
    status_code = 400
    code = "bad_request"


class UnauthorizedError(AppError):
    status_code = 401
    code = "unauthorized"


class ForbiddenError(AppError):
    status_code = 403
    code = "forbidden"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ConflictError(AppError):
    status_code = 409
    code = "conflict"


class RequestValidationFailure(AppError):
    status_code = 422
    code = "validation_error"


class TooManyRequestsError(AppError):
    status_code = 429
    code = "too_many_requests"


class ServiceUnavailableError(AppError):
    status_code = 503
    code = "service_unavailable"


def _envelope(request: Request, error: AppError) -> JSONResponse:
    rid = getattr(request.state, "request_id", None) or error.request_id
    return JSONResponse(
        status_code=error.status_code,
        content={
            "success": False,
            "error": {"code": error.code, "message": error.message},
            "request_id": rid,
        },
    )


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return _envelope(request, exc)


async def validation_error_handler(request: Request,
                                   exc: RequestValidationError) -> JSONResponse:
    message = "Request validation failed"
    errors = getattr(exc, "errors", lambda: [])()
    if errors:
        first = errors[0]
        loc = " -> ".join(str(x) for x in first.get("loc", []))
        if loc:
            message = f"{message}: {loc}"
    error = RequestValidationFailure(message)
    return _envelope(request, error)


async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    error = AppError("An internal error occurred.", code="internal")
    return _envelope(request, error)


def exception_handlers() -> dict:
    return {
        AppError: app_error_handler,
        RequestValidationError: validation_error_handler,
        Exception: unhandled_error_handler,
    }