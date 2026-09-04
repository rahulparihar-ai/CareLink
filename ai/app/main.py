"""CareLink AI - FastAPI application factory.

Run with:
    uvicorn app.main:app --reload     (from within the ai/ directory)

The readme details install steps.
"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from ai.config.settings import get_settings
from ai.prompts import registered_tasks
from ai.app.routes import router as ai_router
from ai.app.routes import set_services
from ai.app.services.orchestration import create_app_services
from ai.app.middleware import (
    RequestIdMiddleware,
    SecurityMiddleware,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="CareLink AI Service",
        version="0.1.0",
        description=(
            "Server-side AI service for CareLink: multilingual intake, "
            "history structuring, red-flag suggestions, document processing, "
            "and clinical summaries. Runs fully in mock mode without a provider."
        ),
    )

    # Middleware order matters: request-id first so downstream can use it.
    app.add_middleware(RequestIdMiddleware, header=settings.request_id_header)
    if settings.cors_origins:
        from starlette.middleware.cors import CORSMiddleware
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    if settings.require_auth:
        app.add_middleware(SecurityMiddleware, settings=settings)

    # Wire services.
    services = create_app_services(settings)
    set_services(services)

    app.include_router(ai_router)

    @app.get("/")
    def root() -> dict:
        return {
            "service": "CareLink AI",
            "mock": settings.is_mock(),
            "provider": settings.provider_kind.value,
            "prompts": registered_tasks(),
        }

    @app.exception_handler(Exception)
    async def unhandled(_request: Request, exc: Exception) -> JSONResponse:
        return JSONResponse(status_code=500, content={
            "success": False,
            "error": {"code": "internal", "message": "An internal error occurred."},
        })

    return app


app = create_app()