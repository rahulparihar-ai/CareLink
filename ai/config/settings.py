"""CareLink AI - Configuration.

All settings are read from the environment (optionally via a ``.env`` file).
Secrets (API keys, tokens) are NEVER hardcoded here. Providers that need no
keys (mock mode) work with zero configuration.

Provider kinds are sanity-lowered and validated so an unknown value cannot
silently select a real provider.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class AiProviderKind(str, Enum):
    """Supported LLM / provider endpoint kinds."""

    OPENAI = "openai"
    OPENROUTER = "openrouter"
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"
    MOCK = "mock"


class SpeechProviderKind(str, Enum):
    """Supported speech (STT / TTS) provider kinds."""

    MOCK = "mock"
    OPENAI = "openai"
    GOOGLE = "google"
    PROVIDERMOUNT = "providermount"  # Indian-context STT/TTS adapter


class VisionProviderKind(str, Enum):
    """Supported vision / OCR provider kinds."""

    MOCK = "mock"
    PROVIDERMOUNT = "providermount"  # generic way to plug the configured provider


class EmbeddingProviderKind(str, Enum):
    """Supported embedding provider kinds."""

    MOCK = "mock"
    OPENAI = "openai"


class ClinicalMode(str, Enum):
    """Clinical workflow modes. AYUSH fields are only used when appropriate."""

    MODERN_MEDICINE = "modern_medicine"
    AYURVEDA = "ayurveda"
    OTHER_AYUSH = "other_ayush"


class LogLevel(str, Enum):
    CRITICAL = "CRITICAL"
    ERROR = "ERROR"
    WARNING = "WARNING"
    INFO = "INFO"
    DEBUG = "DEBUG"


# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------


def _env(key: str, default: str = "") -> str:
    return (os.environ.get(key) or default).strip()


def _env_bool(key: str, default: bool = False) -> bool:
    return _env(key, "true" if default else "false").lower() in {"1", "true", "yes", "y", "on"}


def _env_int(key: str, default: int) -> int:
    try:
        return int(_env(key, str(default)))
    except ValueError:
        return default


def _env_float(key: str, default: float) -> float:
    try:
        return float(_env(key, str(default)))
    except ValueError:
        return default


@dataclass
class LlmProviderConfig:
    """One configured LLM provider endpoint."""

    kind: AiProviderKind = AiProviderKind.MOCK
    api_key: Optional[str] = None
    model: str = "mock"
    base_url: Optional[str] = None
    timeout_ms: int = 15000


@dataclass
class Settings:
    """CareLink AI configuration, all sourced from environment variables."""

    # ---------------------------------------------------------------- mode
    mock: bool = True
    # Force mock mode even if provider keys exist (used by tests/demo).
    force_mock: bool = False
    log_level: LogLevel = LogLevel.INFO
    # When the configured provider is unavailable, allow controlled fallback.
    allow_fallback: bool = True
    max_retries: int = 2
    base_retry_delay_ms: int = 400

    # ------------------------------------------------------------------ llm
    provider_kind: AiProviderKind = AiProviderKind.MOCK
    api_key: Optional[str] = None
    model: str = ""
    base_url: Optional[str] = None
    timeout_ms: int = 15000

    fallback_provider_kind: AiProviderKind = AiProviderKind.MOCK
    fallback_api_key: Optional[str] = None
    fallback_model: str = ""
    fallback_base_url: Optional[str] = None

    # ---------------------------------------------------------------- speech
    stt_provider: SpeechProviderKind = SpeechProviderKind.MOCK
    stt_api_key: Optional[str] = None
    tts_provider: SpeechProviderKind = SpeechProviderKind.MOCK
    tts_api_key: Optional[str] = None
    # Default voice identifier / language hint for TTS.
    tts_voice: str = "default"
    tts_language: str = "hi-IN"

    # ----------------------------------------------------------------- vision
    vision_provider: VisionProviderKind = VisionProviderKind.MOCK
    vision_api_key: Optional[str] = None

    # ------------------------------------------------------------ embeddings
    embedding_provider: EmbeddingProviderKind = EmbeddingProviderKind.MOCK
    embedding_api_key: Optional[str] = None

    # ----------------------------------------------------------- cloud flags
    cloud_run: bool = False
    cors_origins: list[str] = field(default_factory=list)

    # ------------------------------------------------------------ clinical
    clinical_mode: ClinicalMode = ClinicalMode.MODERN_MEDICINE

    # --------------------------------------------------------- safety / api
    require_auth: bool = False
    # In production, set this to a shared secret that the backend sends as
    # ``Authorization: Bearer <value>``. The AI service never issues tokens.
    shared_secret: Optional[str] = None
    max_input_chars: int = 20000
    request_id_header: str = "X-Request-ID"

    # ----------------------------------------------------------------- helpers
    def is_mock(self) -> bool:
        """True when running in mock mode.

        Returns True if explicitly set, or automatically when no live provider
        with credentials is configured (so the service is safe out of the box).
        """
        if self.force_mock:
            return True
        if self.mock:
            return True
        return not self._has_live_llm()

    def _has_live_llm(self) -> bool:
        if self.provider_kind != AiProviderKind.MOCK and bool(self.api_key) and bool(self.model):
            return True
        fallback = self.fallback_provider_kind != AiProviderKind.MOCK
        if fallback and bool(self.fallback_api_key) and bool(self.fallback_model):
            return True
        return False

    def is_configured_for_live_llm(self) -> bool:
        """True when a real (non-mock) provider with credentials is set."""
        return self._has_live_llm()

    def primary_llm(self) -> LlmProviderConfig:
        return LlmProviderConfig(
            kind=self.provider_kind,
            api_key=self.api_key,
            model=self.model,
            base_url=self.base_url,
            timeout_ms=self.timeout_ms,
        )

    def fallback_llm(self) -> Optional[LlmProviderConfig]:
        if not self.allow_fallback:
            return None
        if self.fallback_provider_kind == AiProviderKind.MOCK:
            return None
        if not (self.fallback_api_key and self.fallback_model):
            return None
        return LlmProviderConfig(
            kind=self.fallback_provider_kind,
            api_key=self.fallback_api_key,
            model=self.fallback_model,
            base_url=self.fallback_base_url,
            timeout_ms=self.timeout_ms,
        )


def get_settings(env=None) -> Settings:
    """Build :class:`Settings` from the environment (or an injected mapping)."""
    if env is None:
        src = os.environ
    else:
        src = env

    def g(key: str, default: str = "") -> str:
        return (src.get(key) or default).strip()

    def gb(key: str, default: bool = False) -> bool:
        return (src.get(key) or ("true" if default else "false")).strip().lower() in {"1", "true", "yes", "y", "on"}

    mock = gb("MOCK_AI_MODE", False) or gb("AI_MOCK_MODE", False)
    force_mock = gb("FORCE_MOCK_AI_MODE", False)

    provider = _coerce_provider(g("AI_PROVIDER", "mock"))
    fallback_provider = _coerce_provider(g("AI_FALLBACK_PROVIDER", "mock"))

    cors = [o.strip() for o in g("CORS_ORIGINS", "").split(",") if o.strip()]

    return Settings(
        mock=mock,
        force_mock=force_mock,
        log_level=_coerce_log_level(g("LOG_LEVEL", "INFO")),
        allow_fallback=gb("ALLOW_FALLBACK", True),
        max_retries=_env_int_local(src, "AI_MAX_RETRIES", 2),
        base_retry_delay_ms=_env_int_local(src, "AI_RETRY_BASE_DELAY_MS", 400),
        provider_kind=provider,
        api_key=g("AI_API_KEY"),
        model=g("AI_MODEL"),
        base_url=g("AI_BASE_URL"),
        timeout_ms=_env_int_local(src, "AI_TIMEOUT_MS", 15000),
        fallback_provider_kind=fallback_provider,
        fallback_api_key=g("AI_FALLBACK_API_KEY"),
        fallback_model=g("AI_FALLBACK_MODEL"),
        fallback_base_url=g("AI_FALLBACK_BASE_URL"),
        stt_provider=_coerce_speech(g("STT_PROVIDER", "mock")),
        stt_api_key=g("STT_API_KEY"),
        tts_provider=_coerce_speech(g("TTS_PROVIDER", "mock")),
        tts_api_key=g("TTS_API_KEY"),
        tts_voice=g("TTS_VOICE", "default"),
        tts_language=g("TTS_LANGUAGE", "hi-IN"),
        vision_provider=_coerce_vision(g("VISION_PROVIDER", "mock")),
        vision_api_key=g("VISION_API_KEY"),
        embedding_provider=_coerce_embedding(g("EMBEDDING_PROVIDER", "mock")),
        embedding_api_key=g("EMBEDDING_API_KEY"),
        cloud_run=gb("CLOUD_RUN", False),
        cors_origins=cors,
        clinical_mode=_coerce_clinical(g("CLINICAL_MODE", "modern_medicine")),
        require_auth=gb("REQUIRE_AUTH", False),
        shared_secret=g("AI_SHARED_SECRET"),
        max_input_chars=_env_int_local(src, "AI_MAX_INPUT_CHARS", 20000),
        request_id_header=g("REQUEST_ID_HEADER", "X-Request-ID"),
    )


def _env_int_local(src, key: str, default: int) -> int:
    try:
        return int((src.get(key) or "").strip() or str(default))
    except ValueError:
        return default


def _coerce_provider(value: str) -> AiProviderKind:
    v = value.lower()
    for kind in AiProviderKind:
        if kind.value == v:
            return kind
    return AiProviderKind.MOCK


def _coerce_speech(value: str) -> SpeechProviderKind:
    v = value.lower()
    for kind in SpeechProviderKind:
        if kind.value == v:
            return kind
    return SpeechProviderKind.MOCK


def _coerce_vision(value: str) -> VisionProviderKind:
    v = value.lower()
    for kind in VisionProviderKind:
        if kind.value == v:
            return kind
    return VisionProviderKind.MOCK


def _coerce_embedding(value: str) -> EmbeddingProviderKind:
    v = value.lower()
    for kind in EmbeddingProviderKind:
        if kind.value == v:
            return kind
    return EmbeddingProviderKind.MOCK


def _coerce_clinical(value: str) -> ClinicalMode:
    v = value.lower()
    for mode in ClinicalMode:
        if mode.value == v:
            return mode
    return ClinicalMode.MODERN_MEDICINE


def _coerce_log_level(value: str) -> LogLevel:
    v = value.upper()
    for level in LogLevel:
        if level.value == v:
            return level
    return LogLevel.INFO