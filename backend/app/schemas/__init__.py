"""CareLink Backend — Pydantic schemas.

Every response uses a consistent envelope. Request/response models live here.
"""

from __future__ import annotations

from typing import Any, Dict, Generic, Optional, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


# ---------------------------------------------------------------- envelope


class ApiMeta(BaseModel):
    request_id: Optional[str] = None
    count: Optional[int] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = ""
    request_id: Optional[str] = None


class ApiErrorDetail(BaseModel):
    code: str
    message: str


class ApiError(BaseModel):
    success: bool = False
    error: ApiErrorDetail
    request_id: Optional[str] = None


# ---------------------------------------------------------------- auth


class SendOtpRequest(BaseModel):
    mobile: str = Field(min_length=10, max_length=12)
    purpose: str = "login"              # login/register/reset/aadhaar
    resend: bool = False


class VerifyOtpRequest(BaseModel):
    mobile: str = Field(min_length=10, max_length=12)
    otp: str = Field(min_length=4, max_length=6)
    purpose: str = "login"


class RegisterPatientRequest(BaseModel):
    mobile: str = Field(min_length=10, max_length=12)
    full_name: str = Field(min_length=1, max_length=255)
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=150)
    blood_group: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)
    email: Optional[str] = None
    aadhaar_verified: bool = False
    abha_status: str = "Not Linked"
    abha_reference: Optional[str] = None


class RegisterDoctorRequest(BaseModel):
    mobile: str = Field(min_length=10, max_length=12)
    full_name: str = Field(min_length=1, max_length=255)
    profession: str
    gender: Optional[str] = None
    specialization: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=6)
    email: Optional[str] = None
    independent_practice: bool = False
    practice_type: Optional[str] = None
    organization_id: Optional[str] = None


class LoginRequest(BaseModel):
    mobile: Optional[str] = None
    password: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    patient_id: Optional[str] = None
    practitioner_id: Optional[str] = None


# ---------------------------------------------------------------- patients


class PatientProfileOut(BaseModel):
    id: str
    patient_reference: Optional[str] = None
    full_name: str
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    blood_group: Optional[str] = None
    abha_status: str = "Not Linked"
    abha_address: Optional[str] = None
    aadhaar_verified: bool = False
    allergies: Optional[str] = None
    conditions: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None


class PatientUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = Field(default=None, ge=0, le=150)
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    conditions: Optional[str] = None


# ---------------------------------------------------------------- doctors


class PractitionerProfileOut(BaseModel):
    id: str
    full_name: str
    profession: str
    gender: Optional[str] = None
    specialization: Optional[str] = None
    practice_type: Optional[str] = None
    independent_practice: bool = False
    primary_workplace_id: Optional[str] = None
    mobile: Optional[str] = None
    email: Optional[str] = None


class DoctorUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    practice_type: Optional[str] = None
    independent_practice: Optional[bool] = None


# ---------------------------------------------------------------- orgs


class OrganizationCreate(BaseModel):
    name: str
    org_type: str
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None


class OrganizationOut(BaseModel):
    id: str
    name: str
    org_type: str
    registration_number: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: str = "Pending"


class AffiliationAction(BaseModel):
    status: str   # approved / rejected


# ---------------------------------------------------------------- consent


class ConsentCreate(BaseModel):
    doctor_id: Optional[str] = None
    organization_id: Optional[str] = None
    purpose: str
    scope: Optional[str] = None
    expires_at: Optional[str] = None


class ConsentOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str] = None
    organization_id: Optional[str] = None
    purpose: str
    scope: Optional[str] = None
    status: str
    granted_at: Optional[str] = None
    revoked_at: Optional[str] = None
    expires_at: Optional[str] = None


class ConsentAction(BaseModel):
    status: str   # granted / denied / revoked


# ---------------------------------------------------------------- qr


class QRCreateOut(BaseModel):
    token: str
    expires_at: str
    url: Optional[str] = None


class QRScanRequest(BaseModel):
    token: str


class QRScanOut(BaseModel):
    ok: bool
    patient_id: Optional[str] = None
    message: str = ""


# ---------------------------------------------------------------- encounter


class EncounterCreate(BaseModel):
    patient_id: str
    doctor_id: Optional[str] = None
    organization_id: Optional[str] = None
    chief_complaint: Optional[str] = None


class EncounterOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    organization_id: Optional[str] = None
    status: str
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    created_at: Optional[str] = None


class EncounterUpdate(BaseModel):
    status: Optional[str] = None
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


# ---------------------------------------------------------------- prescriptions


class PrescriptionCreate(BaseModel):
    encounter_id: Optional[str] = None
    medicine: str
    dosage: Optional[str] = None
    route: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


class PrescriptionOut(BaseModel):
    id: str
    patient_id: str
    encounter_id: str
    doctor_id: str
    medicine: str
    dosage: Optional[str] = None
    route: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None


# ---------------------------------------------------------------- investigations


class InvestigationCreate(BaseModel):
    encounter_id: Optional[str] = None
    test: str
    reason: Optional[str] = None
    priority: str = "normal"
    notes: Optional[str] = None


class InvestigationOut(BaseModel):
    id: str
    patient_id: str
    encounter_id: Optional[str] = None
    doctor_id: str
    test: str
    reason: Optional[str] = None
    priority: str
    notes: Optional[str] = None
    status: str


# ---------------------------------------------------------------- followups


class FollowUpCreate(BaseModel):
    encounter_id: Optional[str] = None
    followup_date: Optional[str] = None
    reason: Optional[str] = None
    instructions: Optional[str] = None
    notes: Optional[str] = None


class FollowUpOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    encounter_id: Optional[str] = None
    followup_date: Optional[str] = None
    reason: Optional[str] = None
    instructions: Optional[str] = None
    notes: Optional[str] = None
    status: str


# ---------------------------------------------------------------- documents


class DocumentUploadOut(BaseModel):
    id: str
    kind: str
    ocr_status: str
    status: str
    needs_review: bool
    message: Optional[str] = None


class DocumentListViewItem(BaseModel):
    id: str
    kind: str
    ocr_status: str
    status: str
    created_at: Optional[str] = None


class DocumentRequestCreate(BaseModel):   # RFI from doctor
    patient_id: str
    request_type: str          # document / info
    request_text: str


class DocumentRequestOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    request_type: str
    request_text: str
    status: str


# ---------------------------------------------------------------- notifications


class NotificationCreate(BaseModel):
    recipient_user_id: str
    kind: str
    title: str
    body: Optional[str] = None


class NotificationOut(BaseModel):
    id: str
    kind: str
    title: str
    body: Optional[str] = None
    read: bool
    created_at: Optional[str] = None


# ---------------------------------------------------------------- ai


class AiHistoryRequest(BaseModel):
    patient_id: str
    message: str
    language: str = "en"
    complaint: Optional[str] = None
    answered_questions: list[str] = Field(default_factory=list)


class AiHistoryResponseRef(BaseModel):
    reply: Optional[str] = None
    next_question: Optional[str] = None
    completed: bool = False
    history: Optional[Dict[str, Any]] = None
    red_flags: list[Dict[str, Any]] = Field(default_factory=list)
    mock: bool = True


# ---------------------------------------------------------------- audit


class AuditEventOut(BaseModel):
    id: Optional[str] = None
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    created_at: Optional[str] = None


# ---------------------------------------------------------------- search


class SearchResult(BaseModel):
    type: str
    id: str
    label: str
    subtitle: str = ""