"""CareLink AI - provider abstractions.

Every external AI capability is behind an interface so CareLink never couples
to a single vendor. Adapters live alongside and are selected by configuration.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional


class ProviderError(Exception):
    """Base provider error with a stable machine-readable category."""

    category = "provider"

    def __init__(self, message: str, category: str | None = None) -> None:
        super().__init__(message)
        if category:
            self.category = category


class TimeoutError(ProviderError):
    category = "timeout"


class RateLimitError(ProviderError):
    category = "rate_limit"


class QuotaError(ProviderError):
    category = "quota"


class AuthError(ProviderError):
    category = "auth"


class NetworkError(ProviderError):
    category = "network"


class InvalidResponseError(ProviderError):
    category = "invalid_response"


# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------


@dataclass
class Message:
    role: str
    content: str

    def as_dict(self) -> dict:
        return {"role": self.role, "content": self.content}


class LlmProvider(ABC):
    """A chat-completions style LLM interface."""

    @property
    @abstractmethod
    def key(self) -> str:
        """Stable provider key (e.g. 'mock', 'openai', 'gemini')."""

    @property
    @abstractmethod
    def model(self) -> str:
        """Model identifier."""

    @abstractmethod
    def is_configured(self) -> bool:
        """Whether required credentials are present for live inference."""

    @abstractmethod
    def complete(self, messages: list[dict]) -> "LlmResult":
        """Run inference over a list of ``{"role","content"}`` messages."""


@dataclass
class LlmResult:
    text: str
    provider: str
    model: str
    raw: Optional[Any] = None

    def to_dict(self) -> dict:
        return {"text": self.text, "provider": self.provider, "model": self.model}


# ---------------------------------------------------------------------------
# Speech
# ---------------------------------------------------------------------------


class SpeechToTextProvider(ABC):
    @property
    @abstractmethod
    def key(self) -> str: ...

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def transcribe(self, audio_bytes: bytes, language: str | None = None) -> dict:
        """Return {'transcript', 'language', 'confidence', 'mock'}."""


class TextToSpeechProvider(ABC):
    @property
    @abstractmethod
    def key(self) -> str: ...

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def synthesize(self, text: str, language: str, voice: str = "default") -> dict:
        """Return {'audio': bytes, 'format', 'language', 'direction', 'mock'}."""


# ---------------------------------------------------------------------------
# Vision / embedding
# ---------------------------------------------------------------------------


class VisionProvider(ABC):
    @property
    @abstractmethod
    def key(self) -> str: ...

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def ocr(self, image_bytes: bytes) -> dict:
        """Return {'text', 'confidence', 'mock'}."""

    @abstractmethod
    def classify(self, image_bytes: bytes) -> dict:
        """Return {'document_kind', 'confidence', 'mock'}."""


class EmbeddingProvider(ABC):
    @property
    @abstractmethod
    def key(self) -> str: ...

    @abstractmethod
    def is_configured(self) -> bool: ...

    @abstractmethod
    def embed(self, texts: list[str]) -> dict:
        """Return {'vectors': [...], 'mock'}."""