"""Practitioner (doctor) routes.

A doctor may only act on a patient record when a current patient-doctor
relationship AND an active granted consent exist. Doctor is the final clinical
decision-maker; AI output is gated.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...deps import CurrentUser, authorize_patient_access, require_any_role
from ...middleware.errors import ForbiddenError, NotFoundError
from ...models.models import Patient, Practitioner
from ...schemas import (
    ApiResponse,
    EncounterCreate,
    EncounterOut,
    EncounterUpdate,
    FollowUpCreate,
    FollowUpOut,
    InvestigationCreate,
    InvestigationOut,
    PrescriptionCreate,
    PrescriptionOut,
)
from ...services import doctor_service

router = APIRouter(prefix="/doctors", tags=["doctors"])


def _doctor(db: Session, current: CurrentUser) -> Practitioner:
    if current.role != "DOCTOR" or not current.practitioner:
        raise ForbiddenError("Doctor access required.")
    return current.practitioner


def _patient(db: Session, patient_id: str) -> Patient:
    patient = db.get(Patient, patient_id)
    if not patient:
        raise NotFoundError("Patient not found.")
    return patient


@router.get("/me", response_model=ApiResponse[dict])
def me(current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    return ApiResponse(data=doctor_service.profile(current))


@router.get("/{doctor_id}/patients", response_model=ApiResponse[List[dict]])
def my_patients(doctor_id: str, db: Session = Depends(get_db),
                current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("You may only access your own patient list.")
    return ApiResponse(data=doctor_service.list_patients(db, doctor_id))


@router.post("/{doctor_id}/encounters", response_model=ApiResponse[EncounterOut])
def create_encounter(doctor_id: str, body: EncounterCreate,
                     db: Session = Depends(get_db),
                     current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("You may only create encounters for yourself.")
    _patient(db, body.patient_id)
    authorize_patient_access(db, current.practitioner, body.patient_id)
    enc = doctor_service.create_encounter(db, doctor_id, body)
    return ApiResponse(data=enc)


@router.get("/{doctor_id}/encounters/{encounter_id}", response_model=ApiResponse[dict])
def get_encounter(doctor_id: str, encounter_id: str, db: Session = Depends(get_db),
                  current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    enc = doctor_service.get_encounter(db, doctor_id, encounter_id)
    if not enc:
        raise NotFoundError("Encounter not found or not yours.")
    return ApiResponse(data=enc)


@router.patch("/{doctor_id}/encounters/{encounter_id}", response_model=ApiResponse[dict])
def update_encounter(doctor_id: str, encounter_id: str, body: EncounterUpdate,
                     db: Session = Depends(get_db),
                     current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    enc = doctor_service.update_encounter(db, doctor_id, encounter_id, body)
    return ApiResponse(data=enc)


@router.post("/{doctor_id}/encounters/{encounter_id}/prescriptions",
             response_model=ApiResponse[PrescriptionOut])
def add_prescription(doctor_id: str, encounter_id: str, body: PrescriptionCreate,
                     db: Session = Depends(get_db),
                     current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    rx = doctor_service.add_prescription(db, doctor_id, encounter_id, body)
    return ApiResponse(data=rx)


@router.post("/{doctor_id}/encounters/{encounter_id}/investigations",
             response_model=ApiResponse[InvestigationOut])
def add_investigation(doctor_id: str, encounter_id: str, body: InvestigationCreate,
                      db: Session = Depends(get_db),
                      current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    inv = doctor_service.add_investigation(db, doctor_id, encounter_id, body)
    return ApiResponse(data=inv)


@router.post("/{doctor_id}/patients/{patient_id}/followups",
             response_model=ApiResponse[FollowUpOut])
def add_followup(doctor_id: str, patient_id: str, body: FollowUpCreate,
                 db: Session = Depends(get_db),
                 current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    _patient(db, patient_id)
    authorize_patient_access(db, current.practitioner, patient_id)
    fu = doctor_service.add_followup(db, doctor_id, patient_id, body)
    return ApiResponse(data=fu)


@router.get("/{doctor_id}/patients/{patient_id}/records", response_model=ApiResponse[dict])
def patient_records(doctor_id: str, patient_id: str, db: Session = Depends(get_db),
                    current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    _patient(db, patient_id)
    authorize_patient_access(db, current.practitioner, patient_id)
    return ApiResponse(data=doctor_service.patient_records(db, doctor_id, patient_id))


@router.post("/{doctor_id}/patients/{patient_id}/request-document",
             response_model=ApiResponse[dict])
def request_document(doctor_id: str, patient_id: str, body: dict,
                     db: Session = Depends(get_db),
                     current: CurrentUser = Depends(require_any_role("DOCTOR"))):
    if current.practitioner.id != doctor_id:
        raise ForbiddenError("Forbidden.")
    _patient(db, patient_id)
    authorize_patient_access(db, current.practitioner, patient_id)
    rfi = doctor_service.request_document(db, doctor_id, patient_id, body)
    return ApiResponse(data=rfi)