"""Doctor clinical workflow tests: consent -> encounter -> rx/investigation."""

from .conftest import login, register_doctor, register_patient


def _get_pid(client, mobile, password):
    register_patient(client, mobile=mobile, full_name=f"P{mobile[-4:]}", password=password)
    return _pid_of(client, mobile, password)


def _pid_of(client, mobile, password):
    data = login(client, mobile, password).json()["data"]
    return data["patient_id"]


def _doc(client, mobile="9010000001"):
    did = register_doctor(client, mobile=mobile, password="docpw1").json()["data"]["practitioner_id"]
    tok = login(client, mobile, "docpw1").json()["data"]["access_token"]
    return did, {"Authorization": f"Bearer {tok}"}


def test_full_consent_encounter_workflow(client):
    register_patient(client, mobile="9010000100", full_name="Pat", password="pw1111")
    pat_tok = login(client, "9010000100", "pw1111").json()["data"]["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_tok}"}
    pid = _pid_of(client, "9010000100", "pw1111")

    did, doc_headers = _doc(client, "9010000200")

    # Doctor cannot create encounter before relationship+consent.
    r = client.post(f"/api/v1/doctors/{did}/encounters", headers=doc_headers,
                    json={"patient_id": pid, "chief_complaint": "fever"})
    assert r.status_code == 403

    # Patient grants consent to doctor.
    c = client.post(f"/api/v1/patients/{pid}/consent", headers=pat_headers,
                    json={"doctor_id": did, "purpose": "clinical"})
    assert c.status_code == 200, c.text
    assert c.json()["data"]["status"] == "Granted"

    # Establish relationship via QR scan.
    qr = client.post(f"/api/v1/patients/{pid}/qr", headers=pat_headers).json()["data"]
    scan = client.post("/api/v1/qr/scan", headers=doc_headers, json={"token": qr["token"]})
    assert scan.status_code == 200, scan.text

    # Now doctor can create encounter, prescription, investigation.
    r = client.post(f"/api/v1/doctors/{did}/encounters", headers=doc_headers,
                    json={"patient_id": pid, "chief_complaint": "fever"})
    assert r.status_code == 200, r.text
    enc_id = r.json()["data"]["id"]

    rx = client.post(f"/api/v1/doctors/{did}/encounters/{enc_id}/prescriptions",
                     headers=doc_headers,
                     json={"medicine": "Paracetamol", "dosage": "500mg",
                           "frequency": "3x/day", "duration": "5 days"})
    assert rx.status_code == 200, rx.text
    assert rx.json()["data"]["medicine"] == "Paracetamol"

    inv = client.post(f"/api/v1/doctors/{did}/encounters/{enc_id}/investigations",
                      headers=doc_headers, json={"test": "CBC"})
    assert inv.status_code == 200, inv.text

    # Doctor can read the patient record now.
    rec = client.get(f"/api/v1/doctors/{did}/patients/{pid}/records", headers=doc_headers)
    assert rec.status_code == 200
    assert rec.json()["data"]["encounters"]

    # Patient can list consents.
    cons = client.get(f"/api/v1/patients/{pid}/consents", headers=pat_headers)
    assert cons.status_code == 200
    assert len(cons.json()["data"]) == 1

    # Revoke consent -> doctor can no longer read records.
    consent_id = cons.json()["data"][0]["id"]
    rev = client.post(f"/api/v1/patients/{pid}/consent/{consent_id}/revoke",
                      headers=pat_headers)
    assert rev.status_code == 200
    rec2 = client.get(f"/api/v1/doctors/{did}/patients/{pid}/records", headers=doc_headers)
    assert rec2.status_code == 403


def test_patient_document_upload_and_doctor_read(client):
    register_patient(client, mobile="9020000100", full_name="PatD", password="pw1111")
    pid = _pid_of(client, "9020000100", "pw1111")
    pat_tok = login(client, "9020000100", "pw1111").json()["data"]["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_tok}"}

    up = client.post(f"/api/v1/documents/patients/{pid}/upload", headers=pat_headers,
                     files={"file": ("report.pdf", b"fake-pdf-bytes", "application/pdf")},
                     data={"kind": "lab_report"})
    assert up.status_code == 200, up.text
    doc_id = up.json()["data"]["id"]
    assert doc_id

    listing = client.get(f"/api/v1/documents/patients/{pid}", headers=pat_headers)
    assert listing.status_code == 200
    assert any(d["id"] == doc_id for d in listing.json()["data"])

    # Patient can read own document content.
    content = client.get(f"/api/v1/documents/{doc_id}/content", headers=pat_headers)
    assert content.status_code == 200
    assert content.content == b"fake-pdf-bytes"


def test_followup_added(client):
    register_patient(client, mobile="9030000100", full_name="PatF", password="pw1111")
    pid = _pid_of(client, "9030000100", "pw1111")
    did, doc_headers = _doc(client, "9030000200")

    fu = client.post(f"/api/v1/doctors/{did}/patients/{pid}/followups",
                     headers=doc_headers,
                     json={"followup_date": "2026-10-01", "reason": "review"})
    # should be forbidden without consent
    assert fu.status_code == 403


def test_ai_guidance_nutrition_chat(client):
    # Patient can request wellness guidance; backend proxies to AI service and
    # degrades to a mock reply (never a 5xx) even when the AI service is
    # unreachable in tests.
    register_patient(client, mobile="9040000100", full_name="PatAI", password="pw1111")
    tok = login(client, "9040000100", "pw1111").json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {tok}"}

    g = client.post("/api/v1/ai/guidance", headers=headers,
                    json={"topic": "sleep", "language": "en"})
    assert g.status_code == 200, g.text
    assert "reply" in g.json()["data"]

    n = client.post("/api/v1/ai/nutrition", headers=headers,
                    json={"question": "healthy breakfast ideas?", "language": "en"})
    assert n.status_code == 200, n.text
    assert "reply" in n.json()["data"]

    c = client.post("/api/v1/ai/chat", headers=headers,
                    json={"message": "hello", "language": "en"})
    assert c.status_code == 200, c.text
    assert "reply" in c.json()["data"]

    # Unauthenticated requests are rejected.
    assert client.post("/api/v1/ai/guidance",
                       json={"topic": "sleep"}).status_code == 401