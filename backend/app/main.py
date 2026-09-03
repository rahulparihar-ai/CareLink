"""CareLink Backend — FastAPI entry point.

Scaffold: routing + health check. Endpoint modules under app/api are to be
registered here as the backend becomes wired to the frontend.
"""

from fastapi import FastAPI

app = FastAPI(title="CareLink API", version="0.1.0")


@app.get("/health")
def health() -> dict:
    return {"name": "CareLink API", "ok": True}