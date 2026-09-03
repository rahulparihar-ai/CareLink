"""CareLink Backend — middleware package."""

from .core_middleware import (
    RateLimitMiddleware,
    RequestContextMiddleware,
    SimpleRateLimiter,
    add_middleware,
    request_id,
)
from .errors import (
    AppError,
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
    RequestValidationFailure,
    ServiceUnavailableError,
    TooManyRequestsError,
    UnauthorizedError,
    exception_handlers,
)

__all__ = [
    "RateLimitMiddleware",
    "RequestContextMiddleware",
    "SimpleRateLimiter",
    "add_middleware",
    "request_id",
    "AppError",
    "BadRequestError",
    "ConflictError",
    "ForbiddenError",
    "NotFoundError",
    "RequestValidationFailure",
    "ServiceUnavailableError",
    "TooManyRequestsError",
    "UnauthorizedError",
    "exception_handlers",
]