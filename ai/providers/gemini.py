"""CareLink AI - Gemini chat provider (generativelanguage REST API)."""

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


class GeminiProvider(LlmProvider):
    key = "gemini"

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
            raise AuthError("Gemini provider is not configured (missing API key/model).")

        contents = _to_gemini_contents(messages)
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}"
            ":generateContent"
        )
        params = {"key": self.cfg.api_key}

        last_error: Optional[ProviderError] = None
        for attempt in range(self._max_retries + 1):
            try:
                resp = httpx.post(url, params=params, json={"contents": contents},
                                  timeout=self._timeout_ms / 1000.0)
            except httpx.TimeoutException as err:
                raise TimeoutError("Gemini provider timed out.") from err
            except httpx.HTTPError as err:
                raise NetworkError("Gemini provider network error.") from err

            if resp.status_code == 429:
                last_error = RateLimitError("Gemini provider rate-limited (429).")
                if attempt < self._max_retries:
                    time.sleep((self._delay * (2 ** attempt)) / 1000.0)
                    continue
                break
            if resp.status_code in (401, 403):
                raise AuthError("Gemini provider rejected credentials.")
            if resp.status_code >= 400:
                raise ProviderError("Gemini provider returned HTTP %s" % resp.status_code)
            try:
                body = resp.json()
            except ValueError as err:
                raise InvalidResponseError("Gemini provider returned non-JSON.") from err
            return self._parse(body)
        raise last_error or NetworkError("Gemini provider request failed.")

    def _parse(self, body: dict) -> LlmResult:
        try:
            parts = body["candidates"][0]["content"]["parts"]
            text = "".join(p.get("text", "") for p in parts)
        except (KeyError, IndexError, TypeError) as err:
            raise InvalidResponseError("Gemini provider response missing candidates.") from err
        return LlmResult(text=text, provider=self.key, model=self.model, raw=body)


def _to_gemini_contents(messages: list[dict]) -> list[dict]:
    """Map openai-style messages to Gemini contents. Gemini has no system role,
    so we prepend user messages with a system prefix pragmatically."""
    contents: list[dict] = []
    system_notes: list[str] = []
    for msg in messages:
        role = msg.get("role")
        content = msg.get("content", "")
        if role == "system":
            system_notes.append(content)
            continue
        if role in ("user", "assistant"):
            role_text = role
        else:
            role_text = "user"
        prefix = ""
        if system_notes:
            prefix = "System instructions: " + " ".join(system_notes) + "\n"
            system_notes = []
        contents.append({"role": role_text, "parts": [{"text": prefix + content}]})
    if system_notes:
        contents.append({"role": "user", "parts": [{"text": "System instructions: " + " ".join(system_notes)}]})
    if not contents:
        contents = [{"role": "user", "parts": [{"text": ""}]}]
    return contents