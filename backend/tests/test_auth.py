"""Auth + OTP + JWT tests."""

from .conftest import login, register_doctor, register_patient


def test_send_otp_mock(client):
    r = client.post("/api/v1/auth/send-otp",
                    json={"mobile": "9876543210", "purpose": "login"})
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["success"] is True
    assert body["data"]["mock"] is True


def test_register_patient(client):
    r = register_patient(client)
    assert r.status_code == 200, r.text
    body = r.json()["data"]
    assert body["role"] == "PATIENT"
    assert body["patient_id"]


def test_duplicate_mobile_conflict(client):
    register_patient(client, mobile="9000000100")
    r = register_patient(client, mobile="9000000100")
    assert r.status_code == 409


def test_password_login_and_refresh(client):
    register_patient(client, mobile="9000000200", password="secret123")
    r = login(client, "9000000200", "secret123")
    assert r.status_code == 200, r.text
    data = r.json()["data"]
    assert data["access_token"]
    assert data["refresh_token"]

    rr = client.post("/api/v1/auth/refresh",
                     json={"refresh_token": data["refresh_token"]})
    assert rr.status_code == 200
    assert rr.json()["data"]["access_token"]


def test_wrong_password_rejected(client):
    register_patient(client, mobile="9000000300", password="rightpass")
    r = login(client, "9000000300", "wrongpass")
    assert r.status_code == 401


def test_logout_revokes_refresh(client):
    register_patient(client, mobile="9000000400", password="pass1234")
    data = login(client, "9000000400", "pass1234").json()["data"]
    r = client.post("/api/v1/auth/logout",
                    json={"refresh_token": data["refresh_token"]})
    assert r.status_code == 200
    rr = client.post("/api/v1/auth/refresh",
                     json={"refresh_token": data["refresh_token"]})
    assert rr.status_code == 401


def test_me_requires_token(client):
    r = client.get("/api/v1/auth/me")
    assert r.status_code == 401


def test_me_with_token(client):
    register_patient(client, mobile="9000000500", password="pass1234")
    data = login(client, "9000000500", "pass1234").json()["data"]
    r = client.get("/api/v1/auth/me",
                   headers={"Authorization": f"Bearer {data['access_token']}"})
    assert r.status_code == 200
    assert r.json()["data"]["role"] == "PATIENT"


def test_invalid_token_rejected(client):
    r = client.get("/api/v1/auth/me",
                   headers={"Authorization": "Bearer not-a-real-token"})
    assert r.status_code == 401


def test_doctor_registration(client):
    r = register_doctor(client)
    assert r.status_code == 200, r.text
    assert r.json()["data"]["role"] == "DOCTOR"


def test_otp_verify_and_login(client):
    # Regression: DateTime(timezone=True) on SQLite returns naive datetimes;
    # verify_otp must handle the comparison without a TypeError.
    client.post("/api/v1/auth/send-otp",
                json={"mobile": "9000000600", "purpose": "login"})
    r = client.post("/api/v1/auth/verify-otp",
                    json={"mobile": "9000000600", "otp": "123456", "purpose": "login"})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["verified"] is True

    register_patient(client, mobile="9000000600", password="pass1234")
    client.post("/api/v1/auth/send-otp",
                json={"mobile": "9000000600", "purpose": "login"})
    r = client.post("/api/v1/auth/login/otp",
                    json={"mobile": "9000000600", "otp": "123456"})
    assert r.status_code == 200, r.text
    assert r.json()["data"]["access_token"]


def test_register_invalid_body_returns_422_not_500(client):
    # Regression: manually-built pydantic profile must yield a clean 422,
    # never an internal 500.
    r = client.post("/api/v1/auth/register",
                    json={"role": "doctor",
                          "profile": {"mobile": "9000000700", "full_name": "Dr X",
                                      "profession": "Physician", "password": "bad"}})
    assert r.status_code == 422, r.text
    assert r.json()["error"]["code"] == "validation_error"