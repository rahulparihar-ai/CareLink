"""CareLink AI - safety package."""

from .clinical_safety import (
    ClinicalSafetyError,
    check_clinical_safety,
    ensure_disclaimer,
    is_emergency_keyword,
    require_patient_safe,
)
from .guardrails import (
    DISCLAIMER_SNIPPET,
    GuardrailResult,
    attach_disclaimer,
    check_input_length,
    detect_injection,
    guard_output,
    has_pii,
    scrub_pii,
)
from .validation import (
    ShapeValidationError,
    clamp_confidence,
    optional_float,
    parse_json_maybe_extract,
    require_dict,
    require_in,
    require_list,
    require_str,
)

__all__ = [
    "ClinicalSafetyError",
    "check_clinical_safety",
    "ensure_disclaimer",
    "is_emergency_keyword",
    "require_patient_safe",
    "DISCLAIMER_SNIPPET",
    "GuardrailResult",
    "attach_disclaimer",
    "check_input_length",
    "detect_injection",
    "guard_output",
    "has_pii",
    "scrub_pii",
    "ShapeValidationError",
    "clamp_confidence",
    "optional_float",
    "parse_json_maybe_extract",
    "require_dict",
    "require_in",
    "require_list",
    "require_str",
]