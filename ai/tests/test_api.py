"""End-to-end HTTP tests against the FastAPI app (mock mode)."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health_returns_mock(client: TestClient):
    resp = client.get("/api/ai/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["data"]["mock"] is True


def test_root_provides_service_info(client: TestClient):
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["service"] == "CareLink AI"


def test_language_detect_hindi(client: TestClient):
    resp = client.post("/api/ai/lang/detect", json={"text": "मुझे बुखार है"})
    assert resp.status_code == 200
    det = resp.json()["data"]["detection"]
    assert det["language_code"] == "hi"


def test_translate_urdu_rtl(client: TestClient):
    resp = client.post("/api/ai/lang/translate", json={"text": "stomach pain", "target": "ur"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["metadata"]["direction"] == "rtl"


def test_interview_returns_question_and_metadata(client: TestClient):
    resp = client.post("/api/ai/interview/message", json={
        "message": "I have a fever", "complaint": "fever",
        "language": "en", "answered_questions": [],
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["next_question"]
    assert "request_id" in body["metadata"]


def test_history_structure_endpoint(client: TestClient):
    resp = client.post("/api/ai/history/structure", json={
        "transcript": "I have headache", "answers": [],
        "language": "en",
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["history"]["complaint"] == "headache"


def test_red_flags_endpoint(client: TestClient):
    resp = client.post("/api/ai/red-flags", json={"text": "severe chest pain"})
    assert resp.status_code == 200
    assert resp.json()["data"]["red_flags"]


def test_documents_classify_endpoint(client: TestClient):
    resp = client.post("/api/ai/documents/classify", json={
        "filename": "prescription.jpg", "text": "tab paracetamol 500mg",
    })
    assert resp.status_code == 200
    assert resp.json()["data"]["classification"]["document_kind"] == "prescription"


def test_validate_rejects_none(client: TestClient):
    resp = client.post("/api/ai/validate", json={"text": "hello"})
    assert resp.status_code == 200
    assert resp.json()["data"]["valid"] is True


def test_error_shapes_are_consistent_when_missing_body(client: TestClient):
    # FastAPI validation produces a 422; our StandardError is used for 5xx only,
    # so a missing field should still be a structured 422.
    resp = client.post("/api/ai/lang/detect", json={})
    assert resp.status_code == 422


def test_guidance_endpoint(client: TestClient):
    resp = client.post("/api/ai/guidance", json={"topic": "sleep", "language": "en"})
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["title"]
    assert "reply" in data
    assert data["disclaimer"]
    assert data["mock"] is True  # mock mode by default


def test_nutrition_endpoint(client: TestClient):
    resp = client.post("/api/ai/nutrition", json={
        "question": "Ideas for a healthy breakfast?",
        "preferences": ["vegetarian"], "language": "en",
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert data["title"] == "Nutrition guidance"
    assert "reply" in data
    assert data["disclaimer"]


def test_patient_chat_endpoint(client: TestClient):
    resp = client.post("/api/ai/chat", json={
        "message": "I have a headache", "language": "en",
    })
    assert resp.status_code == 200
    data = resp.json()["data"]
    assert "reply" in data
    assert data["disclaimer"]
    assert data["mock"] is True


def test_nutrition_requires_question(client: TestClient):
    resp = client.post("/api/ai/nutrition", json={"language": "en"})
    assert resp.status_code == 422