"""CareLink AI - mock providers.

Deterministic, credential-free implementations used in MOCK_AI_MODE and as safe
fallbacks. They return clearly-labeled structured output and never fabricate
clinical facts with high confidence.
"""

from __future__ import annotations

import random
from typing import Optional

from .base import (
    EmbeddingProvider,
    LlmProvider,
    LlmResult,
    SpeechToTextProvider,
    TextToSpeechProvider,
    VisionProvider,
)

# A tiny deterministic vocabulary so mock replies are plausible but obviously
# generic — NEVER a diagnosis or a prescription.
_GENERIC_REPLY = (
    "This is a demo response from CareLink's mock AI. "
    "Because these tools are not connected to analysis in demo mode, "
    "they do not provide a diagnosis or medical advice. "
    "Your doctor will review everything with you."
)


class MockLlmProvider(LlmProvider):
    key = "mock"
    model = "mock"

    def is_configured(self) -> bool:
        return True

    def complete(self, messages: list[dict]) -> LlmResult:
        # If the caller requested a JSON structure, return a minimal valid JSON
        # envelope so downstream parsing can be exercised deterministically.
        last = messages[-1]["content"] if messages else ""
        if last.lstrip().startswith("{"):
            return LlmResult(
                text=('{"ok": true, "mock": true, "directions": ['), provider=self.key, model=self.model
            )
        return LlmResult(text=_GENERIC_REPLY, provider=self.key, model=self.model)


class MockSpeechToTextProvider(SpeechToTextProvider):
    key = "mock"

    def is_configured(self) -> bool:
        return True

    def transcribe(self, audio_bytes: bytes, language: str | None = None) -> dict:
        return {
            "transcript": "[mock transcription] please describe your symptoms",
            "language": language or "en",
            "confidence": 0.2,
            "mock": True,
        }


class MockTextToSpeechProvider(TextToSpeechProvider):
    key = "mock"

    def is_configured(self) -> bool:
        return True

    def synthesize(self, text: str, language: str, voice: str = "default") -> dict:
        # No real audio in mock mode: return an empty payload flagged as mock.
        return {
            "audio": b"",
            "format": "mock-pcm",
            "language": language,
            "direction": "rtl" if language == "ur" else "ltr",
            "mock": True,
        }


class MockVisionProvider(VisionProvider):
    key = "mock"

    def is_configured(self) -> bool:
        return True

    def ocr(self, image_bytes: bytes) -> dict:
        return {
            "text": "[mock ocr] no text could be read in demo mode",
            "confidence": 0.2,
            "mock": True,
        }

    def classify(self, image_bytes: bytes) -> dict:
        return {
            "document_kind": "other_medical_document",
            "confidence": 0.2,
            "mock": True,
        }


class MockEmbeddingProvider(EmbeddingProvider):
    key = "mock"

    def is_configured(self) -> bool:
        return True

    def embed(self, texts: list[str]) -> dict:
        # Deterministic pseudo-vector so mock mode is stable across runs.
        seed = 0x5EED
        rng = random.Random(seed)
        dim = 8
        vectors = []
        for _ in texts:
            vectors.append([round(rng.random(), 4) for _ in range(dim)])
        return {"vectors": vectors, "dim": dim, "mock": True}