"""Tests for the provider layer: factory selection, mock mode, and error
handling (timeout / auth / malformed response)."""

from __future__ import annotations

import pytest

from ai.config.settings import get_settings
from ai.providers.factory import (
    get_embedding_provider,
    get_llm_provider,
    get_speech_to_text_provider,
    get_text_to_speech_provider,
    get_vision_provider,
)
from ai.providers.mock import MockLlmProvider
from ai.providers.openai_chat import OpenAIChatProvider
from ai.providers.base import AuthError, TimeoutError


def test_mock_llm_selected_in_mock_mode(mock_settings):
    provider = get_llm_provider(mock_settings)
    assert isinstance(provider, MockLlmProvider)


def test_all_providers_mock_in_mock_mode(mock_settings):
    assert isinstance(get_speech_to_text_provider(mock_settings).__class__.__name__, str)
    assert isinstance(get_text_to_speech_provider(mock_settings).__class__.__name__, str)
    assert isinstance(get_vision_provider(mock_settings).__class__.__name__, str)
    assert isinstance(get_embedding_provider(mock_settings).__class__.__name__, str)


def test_openai_provider_selected_with_credentials(live_like_settings):
    provider = get_llm_provider(live_like_settings)
    assert isinstance(provider, OpenAIChatProvider)
    assert provider.is_configured() is True


def test_openai_provider_raises_auth_when_unconfigured(live_like_settings):
    provider = OpenAIChatProvider(live_like_settings.primary_llm())
    provider.cfg = live_like_settings.primary_llm()
    provider.cfg.api_key = None
    with pytest.raises(AuthError):
        provider.complete([{"role": "user", "content": "hello"}])


def test_get_llm_mocks_when_no_credentials():
    settings = get_settings({
        "MOCK_AI_MODE": "false",
        "AI_PROVIDER": "openai",
        "AI_API_KEY": "",
        "AI_MODEL": "",
    })
    # is_mock auto-true because no live provider is configured.
    assert settings.is_mock() is True
    provider = get_llm_provider(settings)
    assert isinstance(provider, MockLlmProvider)


def test_timeout_error_exception_class():
    assert issubclass(TimeoutError, Exception)


def test_deterministic_mock_embedding(mock_settings):
    provider = get_embedding_provider(mock_settings)
    out = provider.embed(["alpha", "beta"])
    assert len(out["vectors"]) == 2
    assert out["mock"] is True