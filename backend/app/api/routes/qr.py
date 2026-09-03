"""QR code scan route.

A QR token is a secure, short-lived, single-use session reference — it never
contains medical data. A scanning doctor exchanges the token for a patient
identifier only after consent/permission checks.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...database import get_db
from ...deps import require_any_role
from ...middleware.errors import BadRequestError, ForbiddenError
from ...models.models import PatientDoctorRelationship
from ...services import patient_service
from ...schemas import ApiResponse

router = APIRouter(prefix="/qr", tags=["qr"])


@router.post("/scan", response_model=ApiResponse[dict])
def scan_qr(body: dict, db: Session = Depends(get_db),
            current=Depends(require_any_role("DOCTOR"))):
    token = body.get("token", "")
    if not token:
        raise BadRequestError("token is required.")
    result = patient_service.validate_qr_session(db, token)

    # A relationship must already exist or be established before records flow.
    rel = db.query(PatientDoctorRelationship).filter(
        PatientDoctorRelationship.patient_id == result["patient_id"],
        PatientDoctorRelationship.doctor_id == current.practitioner.id,
    ).first()
    if not rel:
        rel = PatientDoctorRelationship(
            patient_id=result["patient_id"],
            doctor_id=current.practitioner.id,
            status="authorized",
        )
        db.add(rel)
        db.commit()
    elif rel.status != "authorized":
        raise ForbiddenError("Patient-doctor relationship not authorized.")

    return ApiResponse(data={"ok": True, "patient_id": result["patient_id"]})