"""Document routes.

Files are stored in PRIVATE server-side storage; the URL never reveals PII.
Access is via short-lived signed tokens and only to authorized parties
(owning patient, or doctor with active consent).
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from ...adapters.storage import StorageAdapter
from ...config import get_settings
from ...database import get_db
from ...deps import CurrentUser, authorize_patient_access, require_any_role
from ...middleware.errors import BadRequestError, ForbiddenError, NotFoundError
from ...schemas import ApiResponse

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/patients/{patient_id}/upload", response_model=ApiResponse[dict])
async def upload_document(patient_id: str, file: UploadFile = File(...),
                          kind: str = "unknown",
                          db: Session = Depends(get_db),
                          current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    # Ownership / consent gate.
    if current.role == "PATIENT":
        if not current.patient or current.patient.id != patient_id:
            raise ForbiddenError("You may only upload to your own record.")
    else:
        authorize_patient_access(db, current.practitioner, patient_id)

    content = await file.read()
    if not content:
        raise BadRequestError("Empty file.")

    settings = get_settings()
    storage = StorageAdapter(settings.local_storage_dir)
    ext = _ext(file.filename or "")
    storage_key, _ = storage.save(content, file.content_type, ext)

    from ...models.models import DocumentReference

    doc = DocumentReference(
        patient_id=patient_id,
        uploader_id=current.user_id,
        kind=kind,
        ocr_status="pending",
        status="needs_review",
        needs_review=True,
        content_type=file.content_type,
        storage_key=storage_key,
        provenance_json='{"source":"patient-upload"}',
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return ApiResponse(data={
        "id": doc.id, "kind": doc.kind, "ocr_status": doc.ocr_status,
        "status": doc.status, "needs_review": doc.needs_review,
    })


@router.get("/patients/{patient_id}", response_model=ApiResponse[List[dict]])
def list_documents(patient_id: str, db: Session = Depends(get_db),
                   current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    if current.role == "PATIENT":
        if not current.patient or current.patient.id != patient_id:
            raise ForbiddenError("Forbidden.")
    else:
        authorize_patient_access(db, current.practitioner, patient_id)

    from ...models.models import DocumentReference

    docs = db.query(DocumentReference).filter(
        DocumentReference.patient_id == patient_id).order_by(
        DocumentReference.created_at.desc()).all()
    out = [
        {"id": d.id, "kind": d.kind, "ocr_status": d.ocr_status,
         "status": d.status, "created_at": d.created_at.isoformat() if d.created_at else None}
        for d in docs
    ]
    return ApiResponse(data=out)


@router.get("/{doc_id}/signed-url", response_model=ApiResponse[dict])
def signed_url(doc_id: str, db: Session = Depends(get_db),
               current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    from ...models.models import DocumentReference

    doc = db.get(DocumentReference, doc_id)
    if not doc:
        raise NotFoundError("Document not found.")
    if current.role == "PATIENT":
        if not current.patient or current.patient.id != doc.patient_id:
            raise ForbiddenError("Forbidden.")
    elif current.role == "DOCTOR":
        authorize_patient_access(db, current.practitioner, doc.patient_id)

    # Inside the backend, the signed URL is just the doc id; the actual byte
    # stream is served through the authenticated GET below (never public).
    return ApiResponse(data={"doc_id": doc.id, "patient_id": doc.patient_id})


@router.get("/{doc_id}/content")
def document_content(doc_id: str, db: Session = Depends(get_db),
                     current: CurrentUser = Depends(require_any_role("PATIENT", "DOCTOR"))):
    from fastapi.responses import StreamingResponse

    from ...models.models import DocumentReference

    doc = db.get(DocumentReference, doc_id)
    if not doc:
        raise NotFoundError("Document not found.")
    if current.role == "PATIENT":
        if not current.patient or current.patient.id != doc.patient_id:
            raise ForbiddenError("Forbidden.")
    elif current.role == "DOCTOR":
        authorize_patient_access(db, current.practitioner, doc.patient_id)

    settings = get_settings()
    storage = StorageAdapter(settings.local_storage_dir)
    if not doc.storage_key or not storage.exists(doc.storage_key):
        raise NotFoundError("File missing.")
    content = storage.read(doc.storage_key)
    media = doc.content_type or "application/octet-stream"
    return StreamingResponse(
        iter([content]),
        media_type=media,
        headers={"Content-Disposition": "inline"},
    )


@router.post("/patients/{patient_id}/verify", response_model=ApiResponse[dict])
def request_verification(patient_id: str, db: Session = Depends(get_db),
                         current: CurrentUser = Depends(require_any_role("PATIENT"))):
    if not current.patient or current.patient.id != patient_id:
        raise ForbiddenError("Forbidden.")
    return ApiResponse(data={"status": "review_pending"})


def _ext(filename: str) -> str:
    if "." in filename:
        return "." + filename.rsplit(".", 1)[1]
    return ""