"""Organization & affiliation routes + admin verification/audit."""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...adapters.professional_verification import ProfessionalVerification, VerificationService
from ...config import get_settings
from ...database import get_db
from ...deps import require_any_role, require_system_admin
from ...middleware.errors import BadRequestError, NotFoundError
from ...models.models import (
    AuditEvent,
    Organization,
    WorkplaceAffiliation,
)
from ...schemas import ApiResponse, OrganizationCreate, OrganizationOut

orgs = APIRouter(prefix="/organizations", tags=["organizations"])


@orgs.post("", response_model=ApiResponse[OrganizationOut])
def create_org(body: OrganizationCreate, db: Session = Depends(get_db),
               current=Depends(require_any_role("DOCTOR", "HOSPITAL_ADMIN"))):
    org = Organization(
        name=body.name, org_type=body.org_type,
        registration_number=body.registration_number,
        address=body.address, city=body.city, state=body.state,
        status="Pending",
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return ApiResponse(data=_org_out(org))


@orgs.get("", response_model=ApiResponse[List[OrganizationOut]])
def list_orgs(db: Session = Depends(get_db)):
    rows = db.query(Organization).all()
    return ApiResponse(data=[_org_out(o) for o in rows])


@orgs.get("/{org_id}", response_model=ApiResponse[OrganizationOut])
def get_org(org_id: str, db: Session = Depends(get_db)):
    org = db.get(Organization, org_id)
    if not org:
        raise NotFoundError("Organization not found.")
    return ApiResponse(data=_org_out(org))


@orgs.post("/{org_id}/affiliate", response_model=ApiResponse[dict])
def affiliate(org_id: str, body: dict, db: Session = Depends(get_db),
              current=Depends(require_any_role("DOCTOR"))):
    org = db.get(Organization, org_id)
    if not org:
        raise NotFoundError("Organization not found.")
    aff = WorkplaceAffiliation(
        practitioner_id=current.practitioner.id,
        organization_id=org_id,
        status="pending",
        role=body.get("role"),
    )
    db.add(aff)
    db.commit()
    return ApiResponse(data={"affiliation_id": aff.id, "status": "pending"})


def _org_out(o: Organization) -> dict:
    return {
        "id": o.id, "name": o.name, "org_type": o.org_type,
        "registration_number": o.registration_number, "address": o.address,
        "city": o.city, "state": o.state, "status": o.status,
    }


admin = APIRouter(prefix="/admin", tags=["admin"])


@admin.post("/verify-doctor", response_model=ApiResponse[dict])
def verify_doctor(body: dict, db: Session = Depends(get_db),
                  current=Depends(require_system_admin)):
    """Hospital affiliation is NOT professional verification.

    This submits a registration number to a council registry. In mock mode it
    returns 'unverified' and never fabricates a verified result.
    """
    settings = get_settings()
    svc = VerificationService(ProfessionalVerification())
    doc_id = body.get("doctor_id")
    reg_no = body.get("registration_number")
    if not doc_id or not reg_no:
        raise BadRequestError("doctor_id and registration_number required.")
    result = svc.submit(db, doc_id, reg_no,
                        name=body.get("name"), actor=str(current.user.id))
    return ApiResponse(data={"source": result.source, "status": result.status,
                             "detail": result.detail})


@admin.get("/audit", response_model=ApiResponse[List[dict]])
def audit_log(db: Session = Depends(get_db),
              current=Depends(require_system_admin)):
    evs = db.query(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(200).all()
    out = [
        {"id": e.id, "actor_id": e.actor_id, "actor_role": e.actor_role,
         "action": e.action, "resource_type": e.resource_type,
         "resource_id": e.resource_id, "created_at": e.created_at.isoformat() if e.created_at else None}
        for e in evs
    ]
    return ApiResponse(data=out)


@admin.get("/workplace-affiliations", response_model=ApiResponse[List[dict]])
def affiliations(db: Session = Depends(get_db),
                 current=Depends(require_system_admin)):
    rows = db.query(WorkplaceAffiliation).all()
    out = [
        {"id": a.id, "practitioner_id": a.practitioner_id,
         "organization_id": a.organization_id, "status": a.status, "role": a.role}
        for a in rows
    ]
    return ApiResponse(data=out)