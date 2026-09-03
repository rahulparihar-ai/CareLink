"""CareLink Backend — API assembly.

All routers are mounted under /api/v1.
"""

from fastapi import APIRouter

from .routes import admin, ai, auth, doctors, documents, notifications, patients, qr

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(doctors.router)
api_router.include_router(documents.router)
api_router.include_router(qr.router)
api_router.include_router(ai.router)
api_router.include_router(notifications.router)
api_router.include_router(admin.orgs)
api_router.include_router(admin.admin)

__all__ = ["api_router"]