"""CareLink AI - OpenAI-compatible chat provider.

Used for OpenAI, OpenRouter and any OpenAI-compatible endpoint (Anthropic and
Gemini have their own adapters). Reads credentials from the injected config
object — never from hardcoded values.
"""

from __future__ import annotations

import json
import time
from typing import Any, Optional

import httpx

from ai.config.settings import LlmProviderConfig
from .base import (
    AuthError,
    InvalidResponseError,
    LlmProvider,
    LlmResult,
    NetworkError,
    ProviderError,
    RateLimitError,
    TimeoutError,
)


class OpenAIChatProvider(LlmProvider):
    key = "openai"

    def __init__(self, config: LlmProviderConfig, *, base_url: str | None = None,
                 max_retries: int = 2, base_retry_delay_ms: int = 400,
                 timeout_ms: int = 15000) -> None:
        self.cfg = config
        self._base_url = (base_url
                          or config.base_url
                          or "https://api.openai.com/v1").rstrip("/")
        self._max_retries = max_retries
        self._delay = base_retry_delay_ms
        self._timeout_ms = timeout_ms

    @property
    def model(self) -> str:
        return self.cfg.model or ""

    def is_configured(self) -> bool:
        return bool(self.cfg.api_key and self.model)

    def complete(self, messages: list[dict]) -> LlmResult:
        if not self.is_configured():
            raise AuthError("OpenAI provider is not configured (missing API key/model).")

        url = f"{self._base_url}/chat/completions"
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
        }
        headers = {
            "Authorization": f"Bearer {self.cfg.api_key}",
            "Content-Type": "application/json",
        }
        last_error: Optional[ProviderError] = None
        for attempt in range(self._max_retries + 1):
            try:
                resp = self._call(url, payload, headers)
                return self._parse(resp)
            except (RateLimitError, TimeoutError, NetworkError) as err:
                last_error = err
                if attempt < self._max_retries:
                    time.sleep((self._delay * (2 ** attempt)) / 1000.0)
                    continue
                break
        raise last_error or NetworkError("OpenAI provider request failed.")

    def _call(self, url: str, payload: dict, headers: dict) -> dict:
        try:
            resp = httpx.post(url, json=payload, headers=headers, timeout=self._timeout_ms / 1000.0)
        except httpx.TimeoutException as err:
            raise TimeoutError("OpenAI provider timed out.") from err
        except httpx.HTTPError as err:
            raise NetworkError("OpenAI provider network error.") from err

        if resp.status_code == 429:
            raise RateLimitError("OpenAI provider rate-limited (429).")
        if resp.status_code in (401, 403):
            raise AuthError("OpenAI provider rejected credentials.")
        if resp.status_code >= 400:
            raise ProviderError("OpenAI provider returned HTTP %s" % resp.status_code)
        try:
            return resp.json()
        except ValueError as err:
            raise InvalidResponseError("OpenAI provider returned non-JSON.") from err

    def _parse(self, body: dict) -> LlmResult:
        try:
            text = body["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as err:
            raise InvalidResponseError("OpenAI provider response missing choices.") from err
        return LlmResult(text=text, provider=self.key, model=self.model, raw=body)