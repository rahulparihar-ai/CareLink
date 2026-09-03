"""CareLink Backend — dependency injection for auth/RBAC.

These FastAPI dependencies decode the JWT, load the user, and enforce role /
ownership / consent rules server-side. Frontend role claims are never trusted.
"""

from __future__ import annotations

from typing import Optional

from fastapi import Depends, Request
from sqlalchemy.orm import Session

from .config import Settings, get_settings
from .database import get_db
from .middleware.errors import ForbiddenError, UnauthorizedError
from .models.models import (
    Consent,
    Patient,
    PatientDoctorRelationship,
    Practitioner,
    User,
)
from .security import decode_token_safe

BEARER = "bearer"


class CurrentUser:
    def __init__(self, user: User, *, patient: Optional[Patient] = None,
                 practitioner: Optional[Practitioner] = None) -> None:
        self.user = user
        self.patient = patient
        self.practitioner = practitioner

    @property
    def role(self) -> str:
        return self.user.role

    @property
    def user_id(self) -> str:
        return self.user.id

    @property
    def patient_id(self) -> Optional[str]:
        return self.patient.id if self.patient else None


def get_current_user(request: Request, db: Session = Depends(get_db),
                     settings: Settings = Depends(get_settings)) -> CurrentUser:
    auth = request.headers.get("Authorization", "")
    parts = auth.split(None, 1)
    if len(parts) != 2 or parts[0].lower() != BEARER:
        raise UnauthorizedError("Missing bearer token.")
    payload = decode_token_safe(parts[1])
    if not payload or payload.get("type") != "access":
        raise UnauthorizedError("Invalid or expired token.")
    user_id = payload.get("sub")
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise UnauthorizedError("Account not found or inactive.")

    # Build flattened identity.
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    pract = db.query(Practitioner).filter(Practitioner.user_id == user.id).first()
    return CurrentUser(user, patient=patient, practitioner=pract)


def require_role(role: str):
    def _check(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current.role != role:
            raise ForbiddenError("Insufficient permissions for this role.")
        return current

    return _check


def require_any_role(*roles: str):
    def _check(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current.role not in roles:
            raise ForbiddenError("Insufficient permissions for this role.")
        return current

    return _check


def require_system_admin(current: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current.role != "SYSTEM_ADMIN":
        raise ForbiddenError("System admin access required.")
    return current


def consent_ok(db: Session, patient_id: str, doctor_id: Optional[str],
               purpose: str = "clinical") -> bool:
    """Active granted consent for a doctor to view a patient's records."""
    consent = (
        db.query(Consent)
        .filter(Consent.patient_id == patient_id,
                Consent.doctor_id == doctor_id,
                Consent.purpose == purpose,
                Consent.status == "Granted")
        .first()
    )
    return consent is not None


def authorize_patient_access(db: Session, doctor: Practitioner,
                             patient_id: str) -> None:
    """Doctor may access a patient only if a relationship exists AND a current
    granted consent is active. Enforced server-side."""
    rel = (
        db.query(PatientDoctorRelationship)
        .filter(PatientDoctorRelationship.patient_id == patient_id,
                PatientDoctorRelationship.doctor_id == doctor.id,
                PatientDoctorRelationship.status == "authorized")
        .first()
    )
    if not rel:
        raise ForbiddenError("No patient-doctor relationship.")
    if not consent_ok(db, patient_id, doctor.id):
        raise ForbiddenError("No active consent for this patient.")


def audit_logger(db: Session, *, actor: Optional[str] = None,
                 actor_role: Optional[str] = None, action: str,
                 resource_type: Optional[str] = None,
                 resource_id: Optional[str] = None,
                 request_id: Optional[str] = None,
                 ip: Optional[str] = None, detail: Optional[str] = None) -> None:
    from .models.models import AuditEvent

    event = AuditEvent(
        actor_id=actor, actor_role=actor_role, action=action,
        resource_type=resource_type, resource_id=resource_id,
        request_id=request_id, ip_address=ip, detail=detail,
    )
    db.add(event)