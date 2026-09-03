"""CareLink AI - Anthropic chat provider (Messages API)."""

from __future__ import annotations

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


class AnthropicProvider(LlmProvider):
    key = "anthropic"

    def __init__(self, config: LlmProviderConfig, *, max_retries: int = 2,
                 base_retry_delay_ms: int = 400, timeout_ms: int = 15000) -> None:
        self.cfg = config
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
            raise AuthError("Anthropic provider is not configured (missing API key/model).")

        system = "\n".join(m["content"] for m in messages if m.get("role") == "system")
        body_messages = [{"role": m["role"], "content": m["content"]}
                         for m in messages if m.get("role") in ("user", "assistant")]

        url = "https://api.anthropic.com/v1/messages"
        headers = {
            "x-api-key": self.cfg.api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        }
        payload = {"model": self.model, "max_tokens": 1024, "messages": body_messages}
        if system:
            payload["system"] = system

        last_error: Optional[ProviderError] = None
        for attempt in range(self._max_retries + 1):
            try:
                resp = httpx.post(url, json=payload, headers=headers, timeout=self._timeout_ms / 1000.0)
            except httpx.TimeoutException as err:
                raise TimeoutError("Anthropic provider timed out.") from err
            except httpx.HTTPError as err:
                raise NetworkError("Anthropic provider network error.") from err

            if resp.status_code == 429:
                last_error = RateLimitError("Anthropic provider rate-limited (429).")
                if attempt < self._max_retries:
                    time.sleep((self._delay * (2 ** attempt)) / 1000.0)
                    continue
                break
            if resp.status_code in (401, 403):
                raise AuthError("Anthropic provider rejected credentials.")
            if resp.status_code >= 400:
                raise ProviderError("Anthropic provider returned HTTP %s" % resp.status_code)
            try:
                body = resp.json()
            except ValueError as err:
                raise InvalidResponseError("Anthropic provider returned non-JSON.") from err
            return self._parse(body)
        raise last_error or NetworkError("Anthropic provider request failed.")

    def _parse(self, body: dict) -> LlmResult:
        try:
            text = "".join(block.get("text", "") for block in body["content"] if block.get("type") == "text")
        except (KeyError, TypeError) as err:
            raise InvalidResponseError("Anthropic provider response missing content.") from err
        return LlmResult(text=text, provider=self.key, model=self.model, raw=body)