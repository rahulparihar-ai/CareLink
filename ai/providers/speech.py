"""CareLink AI - speech providers.

Real STT/TTS adapters are thin mounts for a configured provider endpoint. In
demo/CI without credentials these are clearly-labeled stubs (mock). The factory
only routes here when a non-mock provider was explicitly selected AND settings
are not in mock mode.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings, SpeechProviderKind
from .base import (
    AuthError,
    SpeechToTextProvider,
    TextToSpeechProvider,
)


class ProviderMountSTT(SpeechToTextProvider):
    """STT adapter-backed provider (e.g. google / providermount)."""

    def __init__(self, settings: Settings, provider: str = "providermount") -> None:
        self.cfg = settings
        self._provider = provider

    @property
    def key(self) -> str:
        return f"{self._provider}:stt"

    def is_configured(self) -> bool:
        return bool(self.cfg.stt_api_key)

    def transcribe(self, audio_bytes: bytes, language: str | None = None) -> dict:
        if not self.is_configured():
            raise AuthError("STT provider not configured (missing STT_API_KEY).")
        # Real transcription would be implemented against the configured SDK/API.
        # To avoid inventing a network call here, this remains a clearly-labeled stub.
        return {
            "transcript": "[stub transcription] no provider transcription configured",
            "language": language or "en",
            "confidence": 0.3,
            "provider": self._provider,
            "mock": True,
        }


class ProviderMountTTS(TextToSpeechProvider):
    def __init__(self, settings: Settings, provider: str = "providermount") -> None:
        self.cfg = settings
        self._provider = provider

    @property
    def key(self) -> str:
        return f"{self._provider}:tts"

    def is_configured(self) -> bool:
        return bool(self.cfg.tts_api_key)

    def synthesize(self, text: str, language: str, voice: str = "default") -> dict:
        if not self.is_configured():
            raise AuthError("TTS provider not configured (missing TTS_API_KEY).")
        return {
            "audio": b"",
            "format": "stub",
            "language": language,
            "direction": "rtl" if language == "ur" else "ltr",
            "provider": self._provider,
            "mock": True,
        }