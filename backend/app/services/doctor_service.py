"""Practitioner (doctor) domain service.

Doctor is the FINAL clinical decision-maker. AI output that assists is gated
behind the doctor and tagged with provenance; it is never auto-persisted as
clinical truth.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from ..deps import CurrentUser
from ..middleware.errors import ForbiddenError, NotFoundError
from ..models.models import (
    Encounter,
    FollowUp,
    InvestigationRequest,
    MedicationRequest,
    Patient,
    PatientDocumentRequest,
    PatientDoctorRelationship,
)


def profile(current: CurrentUser) -> dict:
    p = current.practitioner
    return {
        "id": p.id,
        "full_name": p.full_name,
        "profession": p.profession,
        "gender": p.gender,
        "specialization": p.specialization,
        "practice_type": p.practice_type,
        "independent_practice": p.independent_practice,
        "primary_workplace_id": p.primary_workplace_id,
        "mobile": current.user.mobile,
        "email": current.user.email,
    }


def list_patients(db: Session, doctor_id: str) -> list:
    rows = db.query(PatientDoctorRelationship).filter(
        PatientDoctorRelationship.doctor_id == doctor_id,
        PatientDoctorRelationship.status == "authorized",
    ).all()
    out = []
    for rel in rows:
        patient = db.get(Patient, rel.patient_id)
        if patient:
            out.append({"id": patient.id, "full_name": patient.full_name})
    return out


def _encounter_out(e: Encounter) -> dict:
    return {
        "id": e.id, "patient_id": e.patient_id, "doctor_id": e.doctor_id,
        "organization_id": e.organization_id, "status": e.status,
        "chief_complaint": e.chief_complaint, "notes": e.notes,
        "assessment": e.assessment, "plan": e.plan,
        "created_at": e.encounter_date.isoformat() if e.encounter_date else None,
    }


def create_encounter(db: Session, doctor_id: str, body) -> dict:
    enc = Encounter(
        patient_id=body.patient_id,
        doctor_id=doctor_id,
        organization_id=body.organization_id,
        chief_complaint=body.chief_complaint,
        status="in_progress",
    )
    db.add(enc)
    db.commit()
    db.refresh(enc)
    return _encounter_out(enc)


def get_encounter(db: Session, doctor_id: str, encounter_id: str) -> Optional[dict]:
    enc = db.get(Encounter, encounter_id)
    if not enc or enc.doctor_id != doctor_id:
        return None
    rx = db.query(MedicationRequest).filter(
        MedicationRequest.encounter_id == enc.id).all()
    inv = db.query(InvestigationRequest).filter(
        InvestigationRequest.encounter_id == enc.id).all()
    data = _encounter_out(enc)
    data["prescriptions"] = [
        {"id": m.id, "medicine": m.medicine, "dosage": m.dosage,
         "frequency": m.frequency, "duration": m.duration}
        for m in rx
    ]
    data["investigations"] = [
        {"id": i.id, "test": i.test, "priority": i.priority,
         "status": i.status, "result_summary": i.result_summary}
        for i in inv
    ]
    return data


def update_encounter(db: Session, doctor_id: str, encounter_id: str, body) -> dict:
    enc = db.get(Encounter, encounter_id)
    if not enc or enc.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found or not yours.")
    for field in ("status", "chief_complaint", "notes", "assessment", "plan"):
        val = getattr(body, field, None)
        if val is not None:
            setattr(enc, field, val)
    db.commit()
    db.refresh(enc)
    return _encounter_out(enc)


def add_prescription(db: Session, doctor_id: str, encounter_id: str, body) -> MedicationRequest:
    enc = db.get(Encounter, encounter_id)
    if not enc or enc.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found or not yours.")
    rx = MedicationRequest(
        patient_id=enc.patient_id, encounter_id=enc.id, doctor_id=doctor_id,
        medicine=body.medicine, dosage=body.dosage, route=body.route,
        frequency=body.frequency, duration=body.duration,
        instructions=body.instructions, status="active",
    )
    db.add(rx)
    db.commit()
    db.refresh(rx)
    return rx


def add_investigation(db: Session, doctor_id: str, encounter_id: str, body) -> InvestigationRequest:
    enc = db.get(Encounter, encounter_id)
    if not enc or enc.doctor_id != doctor_id:
        raise NotFoundError("Encounter not found or not yours.")
    inv = InvestigationRequest(
        patient_id=enc.patient_id, doctor_id=doctor_id, encounter_id=enc.id,
        test=body.test, reason=body.reason, priority=body.priority,
        notes=body.notes, status="requested",
    )
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return inv


def add_followup(db: Session, doctor_id: str, patient_id: str, body) -> FollowUp:
    from datetime import datetime

    encounter_id = body.encounter_id
    if encounter_id:
        enc = db.get(Encounter, encounter_id)
        if not enc or enc.doctor_id != doctor_id:
            raise NotFoundError("Encounter not found or not yours.")
    date = None
    if body.followup_date:
        try:
            date = datetime.fromisoformat(body.followup_date)
        except ValueError:
            date = None
    fu = FollowUp(
        patient_id=patient_id, doctor_id=doctor_id, encounter_id=encounter_id,
        followup_date=date, reason=body.reason, instructions=body.instructions,
        notes=body.notes, status="scheduled",
    )
    db.add(fu)
    db.commit()
    db.refresh(fu)
    return fu


def patient_records(db: Session, doctor_id: str, patient_id: str) -> dict:
    encs = db.query(Encounter).filter(
        Encounter.patient_id == patient_id,
        Encounter.doctor_id == doctor_id,
    ).order_by(Encounter.encounter_date.desc()).all()
    rx = db.query(MedicationRequest).filter(
        MedicationRequest.patient_id == patient_id,
        MedicationRequest.doctor_id == doctor_id,
    ).all()
    inv = db.query(InvestigationRequest).filter(
        InvestigationRequest.patient_id == patient_id,
        InvestigationRequest.doctor_id == doctor_id,
    ).all()
    fu = db.query(FollowUp).filter(
        FollowUp.patient_id == patient_id,
        FollowUp.doctor_id == doctor_id,
    ).order_by(FollowUp.followup_date).all()
    return {
        "encounters": [_encounter_out(e) for e in encs],
        "prescriptions": [
            {"id": m.id, "medicine": m.medicine, "dosage": m.dosage,
             "frequency": m.frequency, "duration": m.duration, "status": m.status}
            for m in rx
        ],
        "investigations": [
            {"id": i.id, "test": i.test, "priority": i.priority,
             "status": i.status, "result_summary": i.result_summary}
            for i in inv
        ],
        "followups": [
            {"id": f.id, "followup_date": f.followup_date.isoformat() if f.followup_date else None,
             "reason": f.reason, "status": f.status}
            for f in fu
        ],
    }


def request_document(db: Session, doctor_id: str, patient_id: str, body: dict) -> dict:
    request_type = body.get("request_type", "document")
    request_text = body.get("request_text", "")
    if not request_text:
        raise ForbiddenError("request_text is required.")
    rfi = PatientDocumentRequest(
        patient_id=patient_id, doctor_id=doctor_id,
        request_type=request_type, request_text=request_text,
        status="pending",
    )
    db.add(rfi)
    db.commit()
    db.refresh(rfi)
    return {"id": rfi.id, "request_type": rfi.request_type,
            "request_text": rfi.request_text, "status": rfi.status}