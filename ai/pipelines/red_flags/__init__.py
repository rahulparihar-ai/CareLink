"""CareLink AI - red flags pipeline."""

from ai.clinical.adapters import create_clinical_services


def check_red_flags(text: str) -> dict:
    svcs = create_clinical_services()
    flags = svcs.red_flags.check(text)
    from ai.safety.clinical_safety import is_emergency_keyword
    return {
        "red_flags": flags,
        "emergency_keywords": is_emergency_keyword(text),
    }