"""CareLink Backend — FastAPI application factory.

Run with (from backend/):
    uvicorn app.main:app --reload

The backend controls auth, authorization, consent, database access and all
business logic. AI lives in a separate service that the backend calls.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import api_router
from .config import get_settings
from .database import init_db
from .middleware.core_middleware import RequestContextMiddleware, add_middleware
from .middleware.errors import exception_handlers

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("carelink.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    if not settings.is_testing:
        init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="CareLink Backend",
        version="0.1.0",
        description=(
            "CareLink backend: auth, authorization, consent, QR sessions, "
            "documents, encounters, prescriptions, investigations, followups, "
            "notifications, RBAC and audit. AI runs in a separate service."
        ),
        lifespan=lifespan,
    )

    # Middleware.
    app.add_middleware(RequestContextMiddleware)
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    add_middleware(
        app,
        rate_limit=settings.rate_limit_per_minute,
        rate_window=60,
        rate_limit_enabled=settings.rate_limit_enabled,
    )

    # Error handlers (consistent envelope).
    for exc_type, handler in exception_handlers().items():
        app.add_exception_handler(exc_type, handler)

    # Routes.
    app.include_router(api_router)

    @app.get("/health")
    def health() -> dict:
        return {
            "name": "CareLink Backend",
            "ok": True,
            "environment": settings.environment.value,
            "db": settings.database_url.split(":")[0],
            "ai_service": settings.ai_service_url,
            "mock_otp": settings.otp_store == "mock",
        }

    @app.get("/")
    def root() -> dict:
        return {"service": "CareLink Backend", "docs": "/docs"}

    return app


app = create_app()