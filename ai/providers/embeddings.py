"""CareLink AI - embedding provider adapter."""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings
from .base import AuthError, EmbeddingProvider


class OpenAIEmbeddingProvider(EmbeddingProvider):
    key = "openai:embeddings"

    def __init__(self, settings: Settings, api_key: str | None = None, model: str = "text-embedding-3-small") -> None:
        self.cfg = settings
        self._api_key = api_key
        self._model = model

    @property
    def model(self) -> str:
        return self._model

    def is_configured(self) -> bool:
        return bool(self._api_key or self.cfg.embedding_api_key)

    def embed(self, texts: list[str]) -> dict:
        key = self._api_key or self.cfg.embedding_api_key
        if not key:
            raise AuthError("Embedding provider not configured (missing EMBEDDING_API_KEY).")
        # Real embedding would POST to /embeddings. Kept as a labeled stub so
        # the adapter boundary is explicit and safely testable.
        return {
            "vectors": [[0.0] * 1536 for _ in texts],
            "dim": 1536,
            "provider": self.key,
            "model": self._model,
            "mock": True,
        }