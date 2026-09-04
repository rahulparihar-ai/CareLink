"""CareLink Backend — auth service.

Handles OTP flow (send/verify/resend), registration, login, token refresh,
logout, password reset. Deterministic mock OTP ("123456") is used only when
the otp store is configured as 'mock' (dev/test).
"""

from __future__ import annotations

from typing import Optional

from sqlalchemy.orm import Session

from ..config import get_settings
from ..middleware.errors import (
    BadRequestError,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
)
from ..models.models import (
    OTPVerification,
    Patient,
    Practitioner,
    Session as SessionModel,
    User,
)
from ..security import (
    create_access_token,
    create_refresh_token,
    hash_otp,
    hash_password,
    new_otp_code,
    token_fingerprint,
    verify_otp_hash,
    verify_password,
)

settings = get_settings()
OTP_TTL_SECONDS = 300


def _mobile_key(mobile: str) -> str:
    return "".join(ch for ch in mobile if ch.isdigit())


def send_otp(db: Session, mobile: str, purpose: str = "login",
             resend: bool = False) -> str:
    from datetime import datetime, timedelta, timezone

    key = _mobile_key(mobile)
    code = new_otp_code()

    existing = db.query(OTPVerification).filter(
        OTPVerification.mobile == key,
        OTPVerification.purpose == purpose,
    ).first()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(seconds=OTP_TTL_SECONDS)
    if existing:
        existing.code_hash = hash_otp(code)
        existing.consumed = False
        existing.attempts = 0
        existing.expires_at = expire
        existing.cooldown_until = None
        obj = existing
    else:
        obj = OTPVerification(
            mobile=key,
            purpose=purpose,
            code_hash=hash_otp(code),
            consumed=False,
            attempts=0,
            expires_at=expire,
        )
        db.add(obj)
    db.commit()
    return code


def verify_otp(db: Session, mobile: str, otp: str,
               purpose: str = "login") -> bool:
    key = _mobile_key(mobile)
    record = db.query(OTPVerification).filter(
        OTPVerification.mobile == key,
        OTPVerification.purpose == purpose,
    ).order_by(OTPVerification.created_at.desc()).first()
    if not record or record.consumed:
        return False
    from datetime import datetime, timezone

    if record.expires_at is not None:
        expires = record.expires_at
        # SQLite returns naive datetimes for DateTime(timezone=True); treat them
        # as UTC to compare correctly against a timezone-aware "now".
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            return False
    if not verify_otp_hash(otp, record.code_hash):
        return False
    record.consumed = True
    db.commit()
    return True


def _get_user_by_mobile(db: Session, mobile: str) -> Optional[User]:
    return db.query(User).filter(User.mobile == _mobile_key(mobile)).first()


def issue_tokens(db: Session, user: User) -> dict:
    access = create_access_token(subject=str(user.id), role=user.role)
    refresh = create_refresh_token(subject=str(user.id), role=user.role)
    _store_session(db, user, refresh)
    return {"access_token": access, "refresh_token": refresh,
            "role": user.role, "user_id": user.id}


def _store_session(db: Session, user: User, refresh_token: str) -> None:
    from datetime import datetime, timedelta, timezone

    db.add(SessionModel(
        user_id=user.id,
        refresh_token_hash=token_fingerprint(refresh_token),
        is_active=True,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.refresh_token_expire_days),
    ))
    db.commit()


def build_token_payload(user: User, db: Session) -> dict:
    payload = {"access_token": "", "refresh_token": "",
               "role": user.role, "user_id": user.id,
               "patient_id": None, "practitioner_id": None}
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    pract = db.query(Practitioner).filter(Practitioner.user_id == user.id).first()
    if patient:
        payload["patient_id"] = patient.id
    if pract:
        payload["practitioner_id"] = pract.id
    return payload


def register_patient(db: Session, data, otp: Optional[str] = None) -> dict:
    mobile = _mobile_key(data.mobile)
    if _get_user_by_mobile(db, mobile):
        raise ConflictError("A user with this mobile already exists.")

    if otp is not None and not verify_otp(db, mobile, otp, "register"):
        raise BadRequestError("Invalid or expired OTP.")

    hashed = hash_password(data.password) if data.password else None
    user = User(
        mobile=mobile,
        email=data.email,
        password_hash=hashed,
        role="PATIENT",
        is_active=True,
    )
    db.add(user)
    db.flush()
    patient = Patient(
        user_id=user.id,
        full_name=data.full_name,
        gender=data.gender,
        date_of_birth=data.date_of_birth,
        age=data.age,
        blood_group=data.blood_group,
        aadhaar_verified=data.aadhaar_verified,
        abha_status=data.abha_status,
        abha_reference=data.abha_reference,
    )
    db.add(patient)
    db.commit()
    payload = build_token_payload(user, db)
    return {"user": payload}


def register_doctor(db: Session, data) -> dict:
    mobile = _mobile_key(data.mobile)
    if _get_user_by_mobile(db, mobile):
        raise ConflictError("A user with this mobile already exists.")
    hashed = hash_password(data.password) if data.password else None
    user = User(
        mobile=mobile,
        email=data.email,
        password_hash=hashed,
        role="DOCTOR",
        is_active=True,
    )
    db.add(user)
    db.flush()
    pract = Practitioner(
        user_id=user.id,
        full_name=data.full_name,
        profession=data.profession,
        gender=data.gender,
        specialization=data.specialization,
        independent_practice=data.independent_practice,
        practice_type=data.practice_type,
    )
    db.add(pract)
    db.commit()
    return {"user": build_token_payload(user, db)}


def login_password(db: Session, mobile: str, password: str) -> dict:
    user = _get_user_by_mobile(db, mobile)
    if not user or not user.password_hash:
        raise UnauthorizedError("Invalid credentials.")
    if not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid credentials.")
    if not user.is_active:
        raise UnauthorizedError("Account inactive.")
    # Exchange tokens and persist session.
    tokens = issue_tokens(db, user)
    payload = {"role": user.role, "user_id": user.id,
               "patient_id": None, "practitioner_id": None}
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    pract = db.query(Practitioner).filter(Practitioner.user_id == user.id).first()
    if patient:
        payload["patient_id"] = patient.id
    if pract:
        payload["practitioner_id"] = pract.id
    return {**payload, **tokens}


def login_otp(db: Session, mobile: str, otp: str) -> dict:
    if not verify_otp(db, _mobile_key(mobile), otp, "login"):
        raise UnauthorizedError("Invalid or expired OTP.")
    user = _get_user_by_mobile(db, mobile)
    if not user:
        # Patient may not exist yet -> route to registration.
        raise NotFoundError("Account not found; please register.")
    tokens = issue_tokens(db, user)
    payload = {"role": user.role, "user_id": user.id,
               "patient_id": None, "practitioner_id": None}
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    pract = db.query(Practitioner).filter(Practitioner.user_id == user.id).first()
    if patient:
        payload["patient_id"] = patient.id
    if pract:
        payload["practitioner_id"] = pract.id
    return {**payload, **tokens}


def logout(db: Session, refresh_token: str) -> None:
    sess = db.query(SessionModel).filter(
        SessionModel.refresh_token_hash == token_fingerprint(refresh_token)).first()
    if sess:
        sess.is_active = False
        db.commit()


def refresh(db: Session, refresh_token: str) -> dict:
    from ..security import decode_token_safe
    payload = decode_token_safe(refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token.")
    sess = db.query(SessionModel).filter(
        SessionModel.refresh_token_hash == token_fingerprint(refresh_token),
        SessionModel.is_active == True,  # noqa: E712
    ).first()
    if not sess:
        raise UnauthorizedError("Refresh token no longer active.")
    user = db.get(User, payload.get("sub"))
    if not user or not user.is_active:
        raise UnauthorizedError("Account not found.")
    return _refresh_for(db, user)


def _refresh_for(db: Session, user: User) -> dict:
    access = create_access_token(subject=str(user.id), role=user.role)
    refresh = create_refresh_token(subject=str(user.id), role=user.role)
    _store_session(db, user, refresh)
    payload = {"role": user.role, "user_id": user.id,
               "patient_id": None, "practitioner_id": None}
    patient = db.query(Patient).filter(Patient.user_id == user.id).first()
    pract = db.query(Practitioner).filter(Practitioner.user_id == user.id).first()
    if patient:
        payload["patient_id"] = patient.id
    if pract:
        payload["practitioner_id"] = pract.id
    return {**payload, "access_token": access, "refresh_token": refresh}


def reset_password(db: Session, mobile: str, otp: str, new_password: str) -> None:
    if not verify_otp(db, _mobile_key(mobile), otp, "reset"):
        raise BadRequestError("Invalid or expired OTP.")
    user = _get_user_by_mobile(db, mobile)
    if not user:
        raise NotFoundError("Account not found.")
    user.password_hash = hash_password(new_password)
    db.commit()