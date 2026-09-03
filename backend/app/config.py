"""CareLink Backend — configuration.

All settings are sourced from the environment. Never hardcode secrets. In the
absence of configuration the app still boots, but features that need a database
or secrets return controlled errors rather than inspecting the process env.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum


class Environment(str, Enum):
    DEVELOPMENT = "development"
    TESTING = "testing"
    PRODUCTION = "production"


def _env(key: str, default: str = "") -> str:
    return (os.environ.get(key) or default).strip()


def _env_bool(key: str, default: bool = False) -> bool:
    return _env(key, "true" if default else "false").lower() in {"1", "true", "yes", "y", "on"}


def _env_int(key: str, default: int) -> int:
    try:
        return int(_env(key, str(default)))
    except ValueError:
        return default


def _split(value: str) -> list[str]:
    return [x.strip() for x in value.split(",") if x.strip()]


@dataclass
class Settings:
    app_name: str = "CareLink API"
    app_version: str = "0.1.0"
    environment: Environment = Environment.DEVELOPMENT
    debug: bool = True

    # --- database --------------------------------------------------------
    database_url: str = "sqlite:///./dev_carelink.db"
    # Use e.g. "postgresql+psycopg://carelink:carelink@localhost:5432/carelink".

    # --- auth / security -------------------------------------------------
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    otp_expire_minutes: int = 5
    otp_max_attempts: int = 5
    otp_resend_cooldown_seconds: int = 30
    otp_send_rate_limit: int = 5            # OTP per number per window
    otp_rate_window_minutes: int = 15
    hash_rounds: int = 12

    # --- ai service ------------------------------------------------------
    ai_service_url: str = "http://ai:8001"
    ai_api_key: str = ""                    # shared secret if AI requires auth
    ai_timeout_ms: int = 15000

    # --- integrations (mock by default) ----------------------------------
    abdm_base_url: str = ""

    # --- storage ----------------------------------------------------------
    storage_provider: str = "local"         # local | s3 | cloudinary
    storage_bucket: str = "carelink-docs"
    storage_credentials: str = ""
    local_storage_dir: str = "./storage"

    # --- cors --------------------------------------------------------------
    cors_origins: list[str] = field(default_factory=lambda: ["http://localhost:3000"])

    # --- rate limiting ------------------------------------------------------
    rate_limit_enabled: bool = True
    rate_limit_per_minute: int = 120

    # --- verification ---------------------------------------------------
    otp_store: str = "mock"                 # mock | (future: twilio/smsgateway)

    # --- db session -------------------------------------------------------
    db_echo: bool = False

    @property
    def is_testing(self) -> bool:
        return self.environment == Environment.TESTING


def get_settings() -> Settings:
    env_name = _env("APP_ENV", "development")
    try:
        environment = Environment(env_name)
    except ValueError:
        environment = Environment.DEVELOPMENT

    return Settings(
        app_name=_env("APP_NAME", "CareLink API"),
        environment=environment,
        debug=_env_bool("DEBUG", environment == Environment.DEVELOPMENT),
        database_url=_env("DATABASE_URL", "sqlite:///./dev_carelink.db"),
        jwt_secret=_env("JWT_SECRET", _env("SECRET_KEY", "change-me-in-production")),
        jwt_algorithm=_env("JWT_ALGORITHM", "HS256"),
        access_token_expire_minutes=_env_int("ACCESS_TOKEN_EXPIRE_MINUTES", 30),
        refresh_token_expire_days=_env_int("REFRESH_TOKEN_EXPIRE_DAYS", 7),
        otp_expire_minutes=_env_int("OTP_EXPIRE_MINUTES", 5),
        otp_max_attempts=_env_int("OTP_MAX_ATTEMPTS", 5),
        otp_resend_cooldown_seconds=_env_int("OTP_RESEND_COOLDOWN_SECONDS", 30),
        otp_send_rate_limit=_env_int("OTP_SEND_RATE_LIMIT", 5),
        otp_rate_window_minutes=_env_int("OTP_RATE_WINDOW_MINUTES", 15),
        hash_rounds=_env_int("HASH_ROUNDS", 12),
        ai_service_url=_env("AI_SERVICE_URL", "http://ai:8001"),
        ai_api_key=_env("AI_API_KEY", ""),
        ai_timeout_ms=_env_int("AI_TIMEOUT_MS", 15000),
        abdm_base_url=_env("ABDM_BASE_URL", ""),
        storage_provider=_env("STORAGE_PROVIDER", "local"),
        storage_bucket=_env("STORAGE_BUCKET", "carelink-docs"),
        storage_credentials=_env("STORAGE_CREDENTIALS", ""),
        local_storage_dir=_env("LOCAL_STORAGE_DIR", "./storage"),
        cors_origins=_split(_env("CORS_ORIGINS", "http://localhost:3000")),
        rate_limit_enabled=_env_bool("RATE_LIMIT_ENABLED", True),
        rate_limit_per_minute=_env_int("RATE_LIMIT_PER_MINUTE", 120),
        otp_store=_env("OTP_STORE", "mock"),
        db_echo=_env_bool("DB_ECHO", False),
    )