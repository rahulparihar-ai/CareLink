"""CareLink backend test fixtures."""

import os
import sys
from pathlib import Path

# Ensure backend is importable.
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

# Use an isolated sqlite DB for tests.
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_carelink.db")
os.environ.setdefault("OTP_STORE", "mock")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal, get_db, init_db, reset_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _db_ready():
    reset_db()
    init_db()
    yield


@pytest.fixture()
def db():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client():
    # Override the DB dependency to avoid cross-test bleed where possible.
    def override_get_db():
        session = SessionLocal()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def register_patient(client, mobile="9000000001", password=None, full_name="Test Patient"):
    payload = {"role": "patient", "profile": {
        "mobile": mobile, "full_name": full_name, "password": password,
    }}
    return client.post("/api/v1/auth/register", json=payload)


def register_doctor(client, mobile="9000000002", password="docpass123", full_name="Dr Test"):
    payload = {"role": "doctor", "profile": {
        "mobile": mobile, "full_name": full_name, "profession": "Physician",
        "password": password,
    }}
    return client.post("/api/v1/auth/register", json=payload)


def login(client, mobile, password):
    return client.post("/api/v1/auth/login", json={"mobile": mobile, "password": password})