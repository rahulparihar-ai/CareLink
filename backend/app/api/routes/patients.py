"""Patient routes (owned by the patient themselves).

These enforce that a patient may only read/write their own record unless a
doctor holds an active consent. Server-side ownership checks only.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...deps import CurrentUser, authorize_patient_access, require_any_role
from ...middleware.errors import ForbiddenError, NotFoundError
from ...models.models import Patient
from ...schemas import (
    ApiResponse,
    ConsentOut,
    PatientUpdateRequest,
)
from ...services import patient_service

router = APIRouter(prefix="/patients", tags=["patients"])


def _own_patient(db: Session, patient_id: str, current: CurrentUser,
                 require_consent_for_doctor: bool = True) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise NotFoundError("Patient not found.")
    if current.role == "PATIENT":
        if not current.patient or current.patient.id != patient_id:
            raise ForbiddenError("You may only access your own patient record.")
    elif current.role == "DOCTOR":
        if require_consent_for_doctor:
            authorize_patient_access(db, current.practitioner, patient_id)
    return patient


@router.get("/{patient_id}", response_model=ApiResponse[dict])
def get_patient(patient_id: str, db: Session = Depends(get_db),
                current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR", "SYSTEM_ADMIN"))):
    patient = _own_patient(db, patient_id, current)
    return ApiResponse(data=patient_service.serialize_patient(db, patient))


@router.patch("/{patient_id}", response_model=ApiResponse[dict])
def update_patient(patient_id: str, update: PatientUpdateRequest,
                   db: Session = Depends(get_db),
                   current: CurrentUser = Depends(require_any_role("PATIENT"))):
    if not current.patient or current.patient.id != patient_id:
        raise ForbiddenError("You may only update your own patient record.")
    patient = patient_service.update_patient(db, patient_id, update)
    return ApiResponse(data=patient_service.serialize_patient(db, patient))


@router.get("/{patient_id}/consents", response_model=ApiResponse[List[ConsentOut]])
def list_consents(patient_id: str, db: Session = Depends(get_db),
                  current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    _own_patient(db, patient_id, current)
    consents = patient_service.list_consents(db, patient_id)
    return ApiResponse(data=consents)


@router.post("/{patient_id}/consent", response_model=ApiResponse[ConsentOut])
def grant_consent(patient_id: str, body: dict, db: Session = Depends(get_db),
                  current: CurrentUser = Depends(require_any_role("PATIENT"))):
    if not current.patient or current.patient.id != patient_id:
        raise ForbiddenError("You may only grant consent on your own record.")
    consent = patient_service.grant_consent(db, patient_id, body)
    return ApiResponse(data=consent)


@router.post("/{patient_id}/consent/{consent_id}/revoke", response_model=ApiResponse[dict])
def revoke_consent(patient_id: str, consent_id: str, db: Session = Depends(get_db),
                   current: CurrentUser = Depends(require_any_role("PATIENT"))):
    if not current.patient or current.patient.id != patient_id:
        raise ForbiddenError("You may only revoke consent on your own record.")
    patient_service.revoke_consent(db, patient_id, consent_id)
    return ApiResponse(data={"revoked": consent_id})


@router.post("/{patient_id}/qr", response_model=ApiResponse[dict])
def create_qr(patient_id: str, db: Session = Depends(get_db),
              current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    _own_patient(db, patient_id, current)
    qr = patient_service.create_qr_token(db, patient_id)
    return ApiResponse(data=qr)


@router.get("/{patient_id}/qr/current", response_model=ApiResponse[dict])
def current_qr(patient_id: str, db: Session = Depends(get_db),
               current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    _own_patient(db, patient_id, current)
    return ApiResponse(data=patient_service.current_qr(db, patient_id))