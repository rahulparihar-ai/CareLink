"""Authentication routes.

POST /auth/send-otp      send OTP (mock returns "123456" in dev/test)
POST /auth/verify-otp    verify OTP for login/register/reset/aadhaar
POST /auth/register      register patient or doctor
POST /auth/login         password login (returns tokens)
POST /auth/refresh       refresh access token
POST /auth/logout        revoke current session (refresh token)
POST /auth/reset-password
GET  /auth/me            current user profile (protected)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ...deps import get_current_user
from ...database import get_db
from ...middleware.errors import BadRequestError
from ...schemas import (
    ApiResponse,
    LoginRequest,
    RegisterDoctorRequest,
    RegisterPatientRequest,
    RefreshRequest,
    SendOtpRequest,
    VerifyOtpRequest,
)
from ...services import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class OtpResponse(BaseModel):
    sent: bool
    resend_allowed: bool = True
    mock: bool = True


@router.post("/send-otp", response_model=ApiResponse[OtpResponse])
def send_otp(req: SendOtpRequest, db: Session = Depends(get_db)) -> ApiResponse:
    code = auth_service.send_otp(db, req.mobile, purpose=req.purpose, resend=req.resend)
    from ...config import get_settings

    settings = get_settings()
    mock = settings.otp_store == "mock"
    return ApiResponse(data=OtpResponse(sent=True, resend_allowed=True, mock=mock),
                       request_id=None)


@router.post("/verify-otp", response_model=ApiResponse[dict])
def verify_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)) -> ApiResponse:
    ok = auth_service.verify_otp(db, req.mobile, req.otp, purpose=req.purpose)
    if not ok:
        raise BadRequestError("Invalid or expired OTP.")
    return ApiResponse(data={"verified": True, "mobile": req.mobile})


@router.post("/register", response_model=ApiResponse[dict])
def register(req: Request, body: dict, db: Session = Depends(get_db)) -> ApiResponse:
    role = (body.get("role") or "patient").lower()
    if role in ("patient", "doctor"):
        pass  # handled below
    else:
        raise BadRequestError("Unsupported role.")

    if role == "doctor":
        data = RegisterDoctorRequest(**body.get("profile", body))
        result = auth_service.register_doctor(db, data)
    else:
        data = RegisterPatientRequest(**body.get("profile", body))
        otp = body.get("otp")
        result = auth_service.register_patient(db, data, otp=otp)
    return ApiResponse(data=result["user"], message="Registration successful.")


@router.post("/login", response_model=ApiResponse[dict])
def login(req: LoginRequest, db: Session = Depends(get_db)) -> ApiResponse:
    if not req.mobile or not req.password:
        raise BadRequestError("Mobile and password are required.")
    result = auth_service.login_password(db, req.mobile, req.password)
    return ApiResponse(data=result)


@router.post("/login/otp", response_model=ApiResponse[dict])
def login_otp(req: VerifyOtpRequest, db: Session = Depends(get_db)) -> ApiResponse:
    result = auth_service.login_otp(db, req.mobile, req.otp)
    return ApiResponse(data=result)


@router.post("/refresh", response_model=ApiResponse[dict])
def refresh(req: RefreshRequest, db: Session = Depends(get_db)) -> ApiResponse:
    result = auth_service.refresh(db, req.refresh_token)
    return ApiResponse(data=result)


@router.post("/logout", response_model=ApiResponse[dict])
def logout(req: RefreshRequest, db: Session = Depends(get_db)) -> ApiResponse:
    auth_service.logout(db, req.refresh_token)
    return ApiResponse(data={"logged_out": True})


@router.post("/reset-password", response_model=ApiResponse[dict])
def reset_password(body: dict, db: Session = Depends(get_db)) -> ApiResponse:
    mobile = body.get("mobile")
    otp = body.get("otp")
    new_password = body.get("new_password")
    if not mobile or not otp or not new_password:
        raise BadRequestError("mobile, otp and new_password are required.")
    auth_service.reset_password(db, mobile, otp, new_password)
    return ApiResponse(data={"reset": True})


@router.get("/me", response_model=ApiResponse[dict])
def me(current=Depends(get_current_user)) -> ApiResponse:
    payload = {
        "user_id": current.user.id,
        "role": current.user.role,
        "mobile": current.user.mobile,
        "patient_id": current.patient_id,
        "practitioner_id": current.practitioner.id if current.practitioner else None,
    }
    return ApiResponse(data=payload)