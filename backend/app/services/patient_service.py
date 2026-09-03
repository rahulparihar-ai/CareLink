"""Patient domain service: profile, consent, QR session tokens.

QR codes contain ONLY a secure, short-lived session token (never medical
data). The token is stored server-side and can be revoked/expired.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from ..middleware.errors import BadRequestError, NotFoundError
from ..models.models import (
    Consent,
    Patient,
    PatientQR,
    Practitioner,
    User,
)
from ..security import new_token_hex, token_fingerprint

QR_TTL_MINUTES = 15


def serialize_patient(db: Session, patient: Patient) -> dict:
    user = db.get(User, patient.user_id) if patient.user_id else None
    return {
        "id": patient.id,
        "patient_reference": patient.patient_reference,
        "full_name": patient.full_name,
        "gender": patient.gender,
        "date_of_birth": patient.date_of_birth,
        "age": patient.age,
        "blood_group": patient.blood_group,
        "abha_status": patient.abha_status,
        "abha_address": patient.abha_address,
        "aadhaar_verified": patient.aadhaar_verified,
        "allergies": patient.allergies,
        "conditions": patient.conditions,
        "mobile": user.mobile if user else None,
        "email": user.email if user else None,
    }


def update_patient(db: Session, patient_id: str, update) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise NotFoundError("Patient not found.")
    for field in ("full_name", "gender", "date_of_birth", "age",
                  "blood_group", "allergies", "conditions"):
        value = getattr(update, field, None)
        if value is not None:
            setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    return patient


def _consent_out(c: Consent) -> dict:
    return {
        "id": c.id,
        "patient_id": c.patient_id,
        "doctor_id": c.doctor_id,
        "organization_id": c.organization_id,
        "purpose": c.purpose,
        "scope": c.scope,
        "status": c.status,
        "granted_at": c.granted_at.isoformat() if c.granted_at else None,
        "revoked_at": c.revoked_at.isoformat() if c.revoked_at else None,
        "expires_at": c.expires_at.isoformat() if c.expires_at else None,
    }


def list_consents(db: Session, patient_id: str) -> list:
    rows = db.query(Consent).filter(
        Consent.patient_id == patient_id).order_by(Consent.created_at.desc()).all()
    return [_consent_out(c) for c in rows]


def grant_consent(db: Session, patient_id: str, body: dict) -> dict:
    doctor_id = body.get("doctor_id")
    if not doctor_id:
        raise BadRequestError("doctor_id is required.")
    doctor = db.get(Practitioner, doctor_id)
    if not doctor:
        raise NotFoundError("Doctor not found.")
    # Deactivate any prior active consent from this doctor.
    prior = db.query(Consent).filter(
        Consent.patient_id == patient_id,
        Consent.doctor_id == doctor_id,
        Consent.status == "Granted",
    ).all()
    for p in prior:
        p.status = "Revoked"
        p.revoked_at = datetime.now(timezone.utc)

    consent = Consent(
        patient_id=patient_id,
        doctor_id=doctor_id,
        purpose=body.get("purpose", "clinical"),
        scope=body.get("scope"),
        status="Granted",
        granted_at=datetime.now(timezone.utc),
        expires_at=None,
    )
    db.add(consent)
    db.commit()
    db.refresh(consent)
    return _consent_out(consent)


def revoke_consent(db: Session, patient_id: str, consent_id: str) -> None:
    consent = db.get(Consent, consent_id)
    if not consent or consent.patient_id != patient_id:
        raise NotFoundError("Consent not found.")
    if consent.status != "Granted":
        raise BadRequestError("Consent is not active.")
    consent.status = "Revoked"
    consent.revoked_at = datetime.now(timezone.utc)
    db.commit()


def create_qr_token(db: Session, patient_id: str) -> dict:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise NotFoundError("Patient not found.")
    token = token_fingerprint(f"{uuid4().hex}:{new_token_hex(32)}")
    qr = PatientQR(
        patient_id=patient_id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=QR_TTL_MINUTES),
        used=False,
    )
    db.add(qr)
    db.commit()
    db.refresh(qr)
    return {
        "token": qr.token,
        "expires_at": qr.expires_at.isoformat(),
        "scan_url": None,  # client builds QR from token; never carries medical data
    }


def current_qr(db: Session, patient_id: str) -> dict:
    qr = db.query(PatientQR).filter(
        PatientQR.patient_id == patient_id,
        PatientQR.used == False,  # noqa: E712
    ).order_by(PatientQR.created_at.desc()).first()
    if not qr:
        return {"token": None, "expires_at": None}
    return {"token": qr.token,
            "expires_at": qr.expires_at.isoformat() if qr.expires_at else None}


def validate_qr_session(db: Session, token: str) -> dict:
    """Validate a QR session token (used by a scanning doctor)."""
    qr = db.query(PatientQR).filter(PatientQR.token == token).first()
    if not qr:
        raise BadRequestError("Invalid QR token.")
    if qr.used:
        raise BadRequestError("QR token already used.")
    if qr.expires_at is not None and _is_expired(qr.expires_at):
        raise BadRequestError("QR token expired.")
    qr.used = True
    db.commit()
    return {"ok": True, "patient_id": qr.patient_id}


def _is_expired(value: datetime) -> bool:
    from datetime import datetime as _dt

    now = datetime.now(timezone.utc)
    try:
        return now > value
    except TypeError:
        # SQLite returns naive; treat as UTC.
        naive = value.replace(tzinfo=timezone.utc)
        return now > naive