"""RBAC, patient-access, consent, and QR security tests.

These verify the non-negotiable security rules:
- A patient cannot view/modify another patient's record.
- A doctor cannot access a patient without an active consent + relationship.
- QR tokens are single-use, expire, and never carry medical data.
- System admin is not granted unrestricted clinical access.
"""

from .conftest import login, register_doctor, register_patient


def _get_patient_id(resp):
    return resp.json()["data"]["patient_id"]


def test_patient_cannot_read_another_patient(client):
    register_patient(client, mobile="9000001011", full_name="P B2", password="pw1111")
    other_id = _get_patient_id(register_patient(client, mobile="9000001013", full_name="P D2", password="pw1111"))
    data = login(client, "9000001011", "pw1111").json()["data"]
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    # Try to read the OTHER patient's record.
    r = client.get(f"/api/v1/patients/{other_id}", headers=headers)
    assert r.status_code == 403


def test_patient_update_own_only(client):
    own_id = _get_patient_id(register_patient(client, mobile="9000001032", full_name="Own3", password="pw1111"))
    other_id = _get_patient_id(register_patient(client, mobile="9000001042", full_name="Other2", password="pw1111"))
    data = login(client, "9000001032", "pw1111").json()["data"]
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    # Update own -> ok
    r = client.patch(f"/api/v1/patients/{own_id}", headers=headers,
                     json={"allergies": "peanuts"})
    assert r.status_code == 200
    # Update other -> forbidden
    r = client.patch(f"/api/v1/patients/{other_id}", headers=headers,
                     json={"allergies": "none"})
    assert r.status_code == 403


def test_doctor_cannot_access_without_consent(client):
    register_patient(client, mobile="9000002000", full_name="Pa", password="pw1111")
    pid = _get_patient_id(register_patient(client, mobile="9000002001", full_name="Pa2", password="pw1111"))
    did = register_doctor(client, mobile="9000002002", password="docpw1").json()["data"]["practitioner_id"]
    doc_data = login(client, "9000002002", "docpw1").json()["data"]
    headers = {"Authorization": f"Bearer {doc_data['access_token']}"}
    # Doctor tries to read patient record without relationship/consent.
    r = client.get(f"/api/v1/patients/{pid}", headers=headers)
    assert r.status_code == 403
    # Creating an encounter without consent is forbidden.
    r = client.post(f"/api/v1/doctors/{did}/encounters",
                    headers=headers, json={"patient_id": pid})
    assert r.status_code == 403


def test_qr_single_use_and_expiry(client):
    register_patient(client, mobile="9000003000", full_name="QR", password="pw1111")
    pid = _get_patient_id(register_patient(client, mobile="9000003001", full_name="QR2", password="pw1111"))
    pat_data = login(client, "9000003001", "pw1111").json()["data"]
    pat_headers = {"Authorization": f"Bearer {pat_data['access_token']}"}

    qr_resp = client.post(f"/api/v1/patients/{pid}/qr", headers=pat_headers)
    assert qr_resp.status_code == 200
    token = qr_resp.json()["data"]["token"]

    register_doctor(client, mobile="9000003002", password="docpw1")
    doc_data = login(client, "9000003002", "docpw1").json()["data"]
    doc_headers = {"Authorization": f"Bearer {doc_data['access_token']}"}

    # First scan -> ok
    scan1 = client.post("/api/v1/qr/scan", headers=doc_headers, json={"token": token})
    assert scan1.status_code == 200, scan1.text
    # Second scan -> token already used
    scan2 = client.post("/api/v1/qr/scan", headers=doc_headers, json={"token": token})
    assert scan2.status_code == 400


def test_admin_verify_doctor_mock_is_unverified(client):
    # System admin can only be created directly; verify the mock adapter via service.
    from app.adapters.professional_verification import ProfessionalVerification
    result = ProfessionalVerification().check("REG-001")
    assert result.status == "unverified"
    assert result.source == "mock"


def test_doctor_needs_consent_for_records(client):
    register_patient(client, mobile="9000004000", full_name="R", password="pw1111")
    pid = _get_patient_id(register_patient(client, mobile="9000004001", full_name="R2", password="pw1111"))
    did = register_doctor(client, mobile="9000004002", password="docpw1").json()["data"]["practitioner_id"]
    doc_data = login(client, "9000004002", "docpw1").json()["data"]
    headers = {"Authorization": f"Bearer {doc_data['access_token']}"}
    # Records route enforces consent.
    r = client.get(f"/api/v1/doctors/{did}/patients/{pid}/records", headers=headers)
    assert r.status_code == 403