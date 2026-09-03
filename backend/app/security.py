"""CareLink Backend — security primitives.

Password hashing, OTP hashing, and JWT token issuance/validation.
Never store plaintext passwords or OTPs.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets
import base64
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt

from .config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Password hashing (use bcrypt via its own direct interface to avoid passlib
# bcrypt-version churn).
# ---------------------------------------------------------------------------


def hash_password(password: str) -> str:
    import bcrypt

    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=settings.hash_rounds)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    import bcrypt

    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------------------------
# OTP
# ---------------------------------------------------------------------------


def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_otp(otp: str) -> str:
    """Hash an OTP so it is never stored/returned in plaintext."""
    salt = hashlib.sha256(secrets.token_bytes(16)).hexdigest()
    digest = hashlib.pbkdf2_hmac("sha256", otp.encode(), salt.encode(), 100_000)
    return f"{salt}${digest.hex()}"


def verify_otp_hash(otp: str, stored: str) -> bool:
    try:
        salt, digest_hex = stored.split("$", 1)
    except ValueError:
        return False
    digest = hashlib.pbkdf2_hmac("sha256", otp.encode(), salt.encode(), 100_000)
    return hmac.compare_digest(digest.hex(), digest_hex)


def new_otp_code() -> str:
    # Deterministic in mock store: "123456" mirrors the frontend demo OTP.
    if settings.otp_store == "mock":
        return "123456"
    return generate_otp()


def new_token_hex(nbytes: int = 32) -> str:
    return secrets.token_hex(nbytes)


def token_fingerprint(token: str) -> str:
    """Deterministic one-way fingerprint for session lookup.

    Refresh tokens are high-entropy JWTs; a deterministic fingerprint is safe
    for indexing (reverse engineering the token from this is infeasible).
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ---------------------------------------------------------------------------
# JWT
# ---------------------------------------------------------------------------


def create_access_token(subject: str, *, role: str, expires_delta: Optional[timedelta] = None) -> str:
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(minutes=settings.access_token_expire_minutes))
    payload = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(subject: str, *, role: str) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=settings.refresh_token_expire_days)
    payload = {
        "sub": subject,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])


def decode_token_safe(token: str) -> Optional[dict]:
    try:
        return decode_token(token)
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# Redaction helper (used by audit/logging)
# ---------------------------------------------------------------------------


def redact(value: str | None) -> str:
    if value is None:
        return ""
    return "[REDACTED]"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def b64decode(data: str) -> bytes:
    return base64.urlsafe_b64decode(data + "==" * (-len(data) % 4))