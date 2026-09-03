"""CareLink Backend — SQLAlchemy ORM models.

FHIR-oriented entities to make future mapping straightforward. Includes the
core clinical entities plus supporting/session/consent/audit entities.

Design notes:
  * ``created_at`` / ``updated_at`` on most entities (timestamps).
  * Unique constraints prevent duplicate patient accounts & OTP collisions.
  * Foreign keys with sensible relationships.
  * No medical data is stored inside QR tables (QR stores opaque session refs).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at = Column(DateTime(timezone=True), default=_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now, nullable=False)


# ---------------------------------------------------------------------------
# Auth / core identities
# ---------------------------------------------------------------------------


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    mobile = Column(String(20), index=True, nullable=True)
    email = Column(String(255), index=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(32), nullable=False, default="PATIENT")  # PATIENT/DOCTOR/HOSPITAL_ADMIN/SYSTEM_ADMIN
    status = Column(String(32), nullable=False, default="active")
    is_active = Column(Boolean, default=True, nullable=False)
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
    patient_profile = relationship("Patient", back_populates="user", uselist=False)
    practitioner_profile = relationship("Practitioner", back_populates="user", uselist=False)

    __table_args__ = (UniqueConstraint("mobile", name="uq_users_mobile"),)


class Patient(Base, TimestampMixin):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    patient_reference = Column(String(64), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    gender = Column(String(32), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    blood_group = Column(String(8), nullable=True)
    aadhaar_hint = Column(String(64), nullable=True)      # NEVER full Aadhaar; masked hint only
    abha_address = Column(String(255), nullable=True)
    abha_status = Column(String(32), default="Not Linked", nullable=False)
    aadhaar_verified = Column(Boolean, default=False, nullable=False)
    abha_reference = Column(String(255), nullable=True)
    allergies = Column(Text, nullable=True)
    conditions = Column(Text, nullable=True)

    user = relationship("User", back_populates="patient_profile")

    __table_args__ = (UniqueConstraint("patient_reference", name="uq_patient_reference"),)


class Practitioner(Base, TimestampMixin):
    __tablename__ = "practitioners"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    profession = Column(String(64), nullable=False)
    gender = Column(String(32), nullable=True)
    specialization = Column(String(128), nullable=True)
    practice_type = Column(String(64), nullable=True)
    independent_practice = Column(Boolean, default=False, nullable=False)
    primary_workplace_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)

    user = relationship("User", back_populates="practitioner_profile")
    primary_workplace = relationship("Organization", foreign_keys=[primary_workplace_id])
    verifications = relationship("VerificationRecord", back_populates="practitioner", cascade="all, delete-orphan")
    affiliations = relationship("WorkplaceAffiliation", back_populates="practitioner", cascade="all, delete-orphan")


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(255), nullable=False)
    org_type = Column(String(64), nullable=False)       # Hospital / Clinic / Healthcare Facility
    registration_number = Column(String(128), nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(128), nullable=True)
    state = Column(String(128), nullable=True)
    status = Column(String(32), default="Pending", nullable=False)  # Pending/Approved/Rejected

    practitioners = relationship("Practitioner", foreign_keys=[Practitioner.primary_workplace_id],
                                 overlaps="primary_workplace")


class PractitionerRole(Base, TimestampMixin):
    __tablename__ = "practitioner_roles"

    id = Column(String(36), primary_key=True, default=_uuid)
    practitioner_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    code = Column(String(64), nullable=False)
    display = Column(String(128), nullable=True)
    active = Column(Boolean, default=True, nullable=False)


# ---------------------------------------------------------------------------
# Auth session / OTP / affiliation / verification
# ---------------------------------------------------------------------------


class Session(Base, TimestampMixin):
    __tablename__ = "sessions"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    refresh_token_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    ip_address = Column(String(64), nullable=True)
    user_agent = Column(String(255), nullable=True)

    user = relationship("User", back_populates="sessions")


class OTPVerification(Base, TimestampMixin):
    __tablename__ = "otp_verifications"

    id = Column(String(36), primary_key=True, default=_uuid)
    mobile = Column(String(20), nullable=False)
    purpose = Column(String(32), default="login", nullable=False)  # login/register/reset/aadhaar
    code_hash = Column(String(255), nullable=False)                 # NEVER plaintext OTP
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=5, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    cooldown_until = Column(DateTime(timezone=True), nullable=True)
    consumed = Column(Boolean, default=False, nullable=False)
    request_id = Column(String(64), nullable=True)


class WorkplaceAffiliation(Base, TimestampMixin):
    __tablename__ = "workplace_affiliations"

    id = Column(String(36), primary_key=True, default=_uuid)
    practitioner_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    status = Column(String(32), default="Pending", nullable=False)   # Pending/Approved/Rejected
    role = Column(String(64), nullable=True)

    practitioner = relationship("Practitioner", back_populates="affiliations")
    organization = relationship("Organization")


class VerificationRecord(Base, TimestampMixin):
    __tablename__ = "verification_records"

    id = Column(String(36), primary_key=True, default=_uuid)
    practitioner_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    verification_type = Column(String(64), nullable=False)  # professional / identity / council
    provider = Column(String(64), default="mock", nullable=False)
    status = Column(String(32), default="Pending", nullable=False)  # Pending/Demo_Verified/Verified/Failed
    external_reference = Column(String(255), nullable=True)
    detail = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)

    practitioner = relationship("Practitioner", back_populates="verifications")


# ---------------------------------------------------------------------------
# Clinical core
# ---------------------------------------------------------------------------


class Encounter(Base, TimestampMixin):
    __tablename__ = "encounters"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    encounter_date = Column(DateTime(timezone=True), default=_now, nullable=False)
    status = Column(String(32), default="in_progress", nullable=False)
    chief_complaint = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    assessment = Column(Text, nullable=True)
    plan = Column(Text, nullable=True)
    ai_summary_id = Column(String(36), nullable=True)

    patient = relationship("Patient")
    doctor = relationship("Practitioner")
    prescriptions = relationship("MedicationRequest", back_populates="encounter", cascade="all, delete-orphan")
    investigations = relationship("InvestigationRequest", back_populates="encounter", cascade="all, delete-orphan")
    followups = relationship("FollowUp", back_populates="encounter", cascade="all, delete-orphan")
    auditable = relationship("AuditEvent", back_populates="encounter", cascade="all, delete-orphan")


class Condition(Base, TimestampMixin):
    __tablename__ = "conditions"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    code = Column(String(128), nullable=True)
    display = Column(String(255), nullable=True)
    clinical_status = Column(String(32), default="active", nullable=False)
    verification_status = Column(String(32), default="unconfirmed", nullable=False)
    onset = Column(String(64), nullable=True)
    note = Column(Text, nullable=True)

    patient = relationship("Patient")


class Observation(Base, TimestampMixin):
    __tablename__ = "observations"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)
    code = Column(String(128), nullable=True)
    display = Column(String(255), nullable=True)
    value = Column(String(255), nullable=True)
    unit = Column(String(32), nullable=True)
    reference_range = Column(String(64), nullable=True)
    interpretation = Column(String(32), nullable=True)  # normal/high/low/critical
    note = Column(Text, nullable=True)

    patient = relationship("Patient")
    encounter = relationship("Encounter")


class Medication(Base, TimestampMixin):
    __tablename__ = "medications"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    name = Column(String(255), nullable=False)
    strength = Column(String(64), nullable=True)
    form = Column(String(64), nullable=True)
    status = Column(String(32), default="active", nullable=False)

    patient = relationship("Patient")


class AllergyIntolerance(Base, TimestampMixin):
    __tablename__ = "allergy_intolerances"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    substance = Column(String(255), nullable=False)
    category = Column(String(64), nullable=True)
    clinical_status = Column(String(32), default="active", nullable=False)
    note = Column(Text, nullable=True)

    patient = relationship("Patient")


class MedicationRequest(Base, TimestampMixin):
    __tablename__ = "medication_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    medicine = Column(String(255), nullable=False)
    dosage = Column(String(64), nullable=True)
    route = Column(String(64), nullable=True)
    frequency = Column(String(64), nullable=True)
    duration = Column(String(64), nullable=True)
    instructions = Column(Text, nullable=True)
    status = Column(String(32), default="active", nullable=False)

    encounter = relationship("Encounter")
    patient = relationship("Patient")
    doctor = relationship("Practitioner")


class DiagnosticReport(Base, TimestampMixin):
    __tablename__ = "diagnostic_reports"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)
    report_type = Column(String(64), nullable=True)
    conclusion = Column(Text, nullable=True)
    document_id = Column(String(36), ForeignKey("document_references.id"), nullable=True)

    document = relationship("DocumentReference", back_populates="reports")


class DocumentReference(Base, TimestampMixin):
    __tablename__ = "document_references"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    uploader_id = Column(String(36), nullable=True)
    kind = Column(String(64), nullable=False)
    ocr_status = Column(String(32), default="pending", nullable=False)
    ocr_confidence = Column(Float, nullable=True)
    extracted_text = Column(Text, nullable=True)
    entities_json = Column(Text, nullable=True)
    storage_key = Column(String(512), nullable=True)
    content_type = Column(String(128), nullable=True)
    status = Column(String(32), default="needs_review", nullable=False)
    needs_review = Column(Boolean, default=True, nullable=False)
    provenance_json = Column(Text, nullable=True)

    patient = relationship("Patient")
    reports = relationship("DiagnosticReport", back_populates="document")


class Procedure(Base, TimestampMixin):
    __tablename__ = "procedures"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)
    code = Column(String(128), nullable=True)
    display = Column(String(255), nullable=True)
    performed_date = Column(String(64), nullable=True)
    note = Column(Text, nullable=True)

    patient = relationship("Patient")


class Immunization(Base, TimestampMixin):
    __tablename__ = "immunizations"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    vaccine = Column(String(255), nullable=False)
    date = Column(String(64), nullable=True)
    lot_number = Column(String(64), nullable=True)

    patient = relationship("Patient")


class FamilyMemberHistory(Base, TimestampMixin):
    __tablename__ = "family_member_histories"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    family_relationship = Column("relationship", String(64), nullable=True)
    condition = Column(String(255), nullable=True)
    note = Column(Text, nullable=True)

    patient = relationship("Patient")


class CarePlan(Base, TimestampMixin):
    __tablename__ = "care_plans"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)
    title = Column(String(255), nullable=True)
    status = Column(String(32), default="active", nullable=False)
    detail = Column(Text, nullable=True)

    patient = relationship("Patient")


class Goal(Base, TimestampMixin):
    __tablename__ = "goals"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(32), default="active", nullable=False)
    due = Column(String(64), nullable=True)

    patient = relationship("Patient")


class Appointment(Base, TimestampMixin):
    __tablename__ = "appointments"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=True)
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(32), default="booked", nullable=False)
    reason = Column(Text, nullable=True)

    patient = relationship("Patient")


# ---------------------------------------------------------------------------
# Consent / provenance / audit / QR
# ---------------------------------------------------------------------------


class Consent(Base, TimestampMixin):
    __tablename__ = "consents"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)
    purpose = Column(String(128), nullable=False)
    scope = Column(Text, nullable=True)
    status = Column(String(32), default="Pending", nullable=False)
    granted_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("Patient")
    doctor = relationship("Practitioner")


class ProvenanceEvent(Base, TimestampMixin):
    __tablename__ = "provenance_events"

    id = Column(String(36), primary_key=True, default=_uuid)
    target_type = Column(String(64), nullable=False)
    target_id = Column(String(36), nullable=False)
    source_type = Column(String(64), nullable=False)
    source_id = Column(String(36), nullable=True)
    actor_id = Column(String(36), nullable=True)
    activity = Column(String(64), nullable=True)
    evidence_json = Column(Text, nullable=True)


class AuditEvent(Base, TimestampMixin):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=_uuid)
    actor_id = Column(String(36), nullable=True)
    actor_role = Column(String(32), nullable=True)
    action = Column(String(64), nullable=False)
    resource_type = Column(String(64), nullable=True)
    resource_id = Column(String(36), nullable=True)
    request_id = Column(String(64), nullable=True)
    ip_address = Column(String(64), nullable=True)
    detail = Column(Text, nullable=True)                # NON-clinical summary; PII redacted
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)

    encounter = relationship("Encounter", back_populates="auditable")


class PatientQR(Base, TimestampMixin):
    __tablename__ = "patient_qr"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    token = Column(String(128), unique=True, index=True, nullable=False)  # secure session ref only
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False, nullable=False)

    patient = relationship("Patient")


class PatientDoctorRelationship(Base, TimestampMixin):
    __tablename__ = "patient_doctor_relationships"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)

    patient = relationship("Patient")
    doctor = relationship("Practitioner")


# ---------------------------------------------------------------------------
# Documents / AI / followup / investigation / notification / RFC
# ---------------------------------------------------------------------------


class DocumentProcessingJob(Base, TimestampMixin):
    __tablename__ = "document_processing_jobs"

    id = Column(String(36), primary_key=True, default=_uuid)
    document_id = Column(String(36), ForeignKey("document_references.id"), nullable=False)
    status = Column(String(32), default="queued", nullable=False)
    error = Column(Text, nullable=True)


class AIInteraction(Base, TimestampMixin):
    __tablename__ = "ai_interactions"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True)
    task = Column(String(64), nullable=True)
    language = Column(String(16), default="en", nullable=False)
    provider = Column(String(64), nullable=True)
    model = Column(String(64), nullable=True)
    mock = Column(Boolean, default=True, nullable=False)
    request_summary = Column(Text, nullable=True)
    output_json = Column(Text, nullable=True)
    status = Column(String(32), default="completed", nullable=False)
    request_id = Column(String(64), nullable=True)


class FollowUp(Base, TimestampMixin):
    __tablename__ = "follow_ups"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)
    followup_date = Column(DateTime(timezone=True), nullable=True)
    reason = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="scheduled", nullable=False)

    doctor = relationship("Practitioner")
    encounter = relationship("Encounter")


class InvestigationRequest(Base, TimestampMixin):
    __tablename__ = "investigation_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    encounter_id = Column(String(36), ForeignKey("encounters.id"), nullable=True)
    test = Column(String(255), nullable=False)
    reason = Column(Text, nullable=True)
    priority = Column(String(32), default="normal", nullable=False)
    notes = Column(Text, nullable=True)
    status = Column(String(32), default="requested", nullable=False)
    result_summary = Column(Text, nullable=True)

    doctor = relationship("Practitioner")
    encounter = relationship("Encounter")


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=_uuid)
    recipient_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    kind = Column(String(64), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    read = Column(Boolean, default=False, nullable=False)
    data_json = Column(Text, nullable=True)

    recipient = relationship("User")


class PatientDocumentRequest(Base, TimestampMixin):
    """RFI: a doctor requests missing information from a patient."""

    __tablename__ = "patient_document_requests"

    id = Column(String(36), primary_key=True, default=_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("practitioners.id"), nullable=False)
    request_type = Column(String(64), nullable=False)   # document / info
    request_text = Column(Text, nullable=False)
    status = Column(String(32), default="pending", nullable=False)
    answered_document_id = Column(String(36), ForeignKey("document_references.id"), nullable=True)

    patient = relationship("Patient")


# Many-to-many: encounters <-> documents
encounter_documents = Table(
    "encounter_documents",
    Base.metadata,
    Column("encounter_id", String(36), ForeignKey("encounters.id"), primary_key=True),
    Column("document_id", String(36), ForeignKey("document_references.id"), primary_key=True),
)