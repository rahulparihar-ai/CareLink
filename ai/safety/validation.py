"""CareLink AI - validation helpers for AI model output.

Guards against the classic failure modes of an LLM:
  * non-JSON output when JSON was requested
  * out-of-expected-shape output
  * embedded prose / fabricated structure
  * missing 'directions' / 'confidence' keys in clinical outputs

Validation never attempts to diagnose; it only verifies shape.
"""

from __future__ import annotations

import json
from typing import Any, Optional


class ShapeValidationError(ValueError):
    """Raised when output does not conform to an expected shape."""


def parse_json_maybe_extract(text: str) -> Any:
    """Parse JSON, tolerating code fences or leading prose that wraps it."""
    if not text:
        raise ShapeValidationError("empty model output")
    s = text.strip()
    if s.startswith("```"):
        s = s.strip("`")
        s = s.strip()
        if s.startswith("json"):
            s = s[4:].strip()
    elif s.startswith("{") is False and s.startswith("[") is False:
        # Try to find the first JSON object/array inside prose.
        start = s.find("{")
        if start == -1:
            start = s.find("[")
        if start == -1:
            raise ShapeValidationError("no JSON object found in model output")
        s = s[start:]
    try:
        return json.loads(s)
    except json.JSONDecodeError as err:
        raise ShapeValidationError("model output is not valid JSON: %s" % err) from err


def require_dict(obj: Any, label: str = "result") -> dict:
    if not isinstance(obj, dict):
        raise ShapeValidationError(f"{label} must be a JSON object")
    return obj


def require_str(value: Any, label: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ShapeValidationError(f"{label} must be a non-empty string")
    return value


def require_list(value: Any, label: str) -> list:
    if not isinstance(value, list):
        raise ShapeValidationError(f"{label} must be a list")
    return value


def require_in(value: Any, allowed: set, label: str) -> str:
    if value not in allowed:
        raise ShapeValidationError(f"{label} must be one of {sorted(allowed)}")
    return value


def optional_float(value: Any, label: str) -> Optional[float]:
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError) as err:
        raise ShapeValidationError(f"{label} must be numeric") from err


def clamp_confidence(value: Optional[float]) -> float:
    if value is None:
        return 0.5
    return max(0.0, min(1.0, value))