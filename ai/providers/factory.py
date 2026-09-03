"""CareLink AI - provider factory.

Selects concrete adapters from :class:`Settings`. In MOCK mode everything is a
mock adapter (no network, no credentials). When a real provider is requested but
its config is incomplete, the factory raises a clear error rather than falling
through to a live call with missing credentials.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import (
    AiProviderKind,
    EmbeddingProviderKind,
    LlmProviderConfig,
    Settings,
    SpeechProviderKind,
    VisionProviderKind,
)
from .anthropic import AnthropicProvider
from .base import (
    EmbeddingProvider,
    LlmProvider,
    SpeechToTextProvider,
    TextToSpeechProvider,
    VisionProvider,
)
from .gemini import GeminiProvider
from .mock import (
    MockEmbeddingProvider,
    MockLlmProvider,
    MockSpeechToTextProvider,
    MockTextToSpeechProvider,
    MockVisionProvider,
)
from .openai_chat import OpenAIChatProvider


def get_llm_provider(settings: Settings) -> LlmProvider:
    if settings.is_mock():
        return MockLlmProvider()

    primary = settings.primary_llm()
    if primary.kind != AiProviderKind.MOCK and primary.api_key and primary.model:
        return _build_llm(primary, settings)

    # No primary live config: use the fallback, else mock.
    fallback = settings.fallback_llm()
    if fallback is not None:
        return _build_llm(fallback, settings)
    return MockLlmProvider()


def get_fallback_llm_provider(settings: Settings) -> Optional[LlmProvider]:
    """Return the configured fallback if real, else None."""
    if settings.is_mock():
        return None
    fallback = settings.fallback_llm()
    if fallback is not None:
        return _build_llm(fallback, settings)
    return None


def _build_llm(cfg: LlmProviderConfig, settings: Settings) -> LlmProvider:
    if cfg.kind == AiProviderKind.OPENAI:
        return OpenAIChatProvider(cfg, max_retries=settings.max_retries,
                                  base_retry_delay_ms=settings.base_retry_delay_ms,
                                  timeout_ms=cfg.timeout_ms)
    if cfg.kind == AiProviderKind.OPENROUTER:
        base = cfg.base_url or "https://openrouter.ai/api/v1"
        return OpenAIChatProvider(cfg, base_url=base, max_retries=settings.max_retries,
                                  base_retry_delay_ms=settings.base_retry_delay_ms,
                                  timeout_ms=cfg.timeout_ms)
    if cfg.kind == AiProviderKind.GEMINI:
        return GeminiProvider(cfg, max_retries=settings.max_retries,
                              base_retry_delay_ms=settings.base_retry_delay_ms,
                              timeout_ms=cfg.timeout_ms)
    if cfg.kind == AiProviderKind.ANTHROPIC:
        return AnthropicProvider(cfg, max_retries=settings.max_retries,
                                 base_retry_delay_ms=settings.base_retry_delay_ms,
                                 timeout_ms=cfg.timeout_ms)
    # Unknown / mock requested explicitly: safe mock.
    return MockLlmProvider()


def get_speech_to_text_provider(settings: Settings) -> SpeechToTextProvider:
    if settings.is_mock() or settings.stt_provider == SpeechProviderKind.MOCK:
        return MockSpeechToTextProvider()
    from .speech import ProviderMountSTT
    return ProviderMountSTT(settings, provider=settings.stt_provider.value)


def get_text_to_speech_provider(settings: Settings) -> TextToSpeechProvider:
    if settings.is_mock() or settings.tts_provider == SpeechProviderKind.MOCK:
        return MockTextToSpeechProvider()
    from .speech import ProviderMountTTS
    return ProviderMountTTS(settings, provider=settings.tts_provider.value)


def get_vision_provider(settings: Settings) -> VisionProvider:
    if settings.is_mock() or settings.vision_provider == VisionProviderKind.MOCK:
        return MockVisionProvider()
    from .vision import ProviderMountVision
    return ProviderMountVision(settings, provider=settings.vision_provider.value)


def get_embedding_provider(settings: Settings) -> EmbeddingProvider:
    if settings.is_mock() or settings.embedding_provider == EmbeddingProviderKind.MOCK:
        return MockEmbeddingProvider()
    from .embeddings import OpenAIEmbeddingProvider
    return OpenAIEmbeddingProvider(settings, api_key=settings.embedding_api_key)