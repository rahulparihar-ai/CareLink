"""CareLink AI - vision / OCR provider adapter."""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings
from .base import AuthError, VisionProvider


class ProviderMountVision(VisionProvider):
    def __init__(self, settings: Settings, provider: str = "providermount") -> None:
        self.cfg = settings
        self._provider = provider

    @property
    def key(self) -> str:
        return f"{self._provider}:vision"

    def is_configured(self) -> bool:
        return bool(self.cfg.vision_api_key)

    def ocr(self, image_bytes: bytes) -> dict:
        if not self.is_configured():
            raise AuthError("Vision provider not configured (missing VISION_API_KEY).")
        return {
            "text": "[stub ocr] no provider OCR configured",
            "confidence": 0.3,
            "provider": self._provider,
            "mock": True,
        }

    def classify(self, image_bytes: bytes) -> dict:
        if not self.is_configured():
            raise AuthError("Vision provider not configured (missing VISION_API_KEY).")
        return {
            "document_kind": "other_medical_document",
            "confidence": 0.3,
            "provider": self._provider,
            "mock": True,
        }