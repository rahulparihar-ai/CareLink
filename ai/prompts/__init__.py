"""CareLink AI - prompt management.

Central store of prompt templates keyed by task. Keeping prompts here (rather
than scattered across call sites) makes them inspectable, versioned, and
auditable. Some templates are loaded from the ``prompts/`` directory; others
are defined inline but all are versioned.
"""

from __future__ import annotations

from typing import Optional

_PROMPT_STORE: dict[str, dict] = {
    "language_detect": {
        "version": "1.0",
        "system": "Identify the dominant language of the text. Return ISO code.",
        "user": "Text: {text}",
    },
    "translate": {
        "version": "1.0",
        "system": (
            "You are a careful medical translator. Keep medicine names, lab "
            "values, units, dosages, registration numbers, ABHA identifiers "
            "and dates exactly as-is. Return only the translation."
        ),
        "user": "Translate to {target}: {text}",
    },
    "interview_start": {
        "version": "1.0",
        "system": "You are a polite intake assistant. Greet and ask the first question.",
        "user": "Language: {language}",
    },
    "interview_message": {
        "version": "1.0",
        "system": "You are a polite intake assistant. Ask ONE follow-up question at a time.",
        "user": "Patient said: {message}\nComplaint: {complaint}",
    },
    "history_structure": {
        "version": "1.0",
        "system": "Structure this patient history as JSON. Do not invent facts.",
        "user": "History: {text}",
    },
    "history_missing": {
        "version": "1.0",
        "system": "List the missing follow-up questions for this complaint.",
        "user": "Complaint: {complaint}\nAnswered so far: {answers}",
    },
    "history_summarize": {
        "version": "1.0",
        "system": "Write a concise plain-language history summary.",
        "user": "History: {text}",
    },
    "red_flags_summarize": {
        "version": "1.0",
        "system": "Summarize symptom red flags carefully without diagnosing.",
        "user": "Text: {text}",
    },
    "doctor_summary": {
        "version": "1.0",
        "system": "Produce a concise SOAP summary for a doctor.",
        "user": "History: {text}",
    },
    "patient_summary": {
        "version": "1.0",
        "system": "Write a friendly, non-diagnosing summary in plain language. Add disclaimer.",
        "user": "History: {text}",
    },
    "document_classify": {
        "version": "1.0",
        "system": "Classify the document type. Return a JSON object with 'document_kind'.",
        "user": "Text: {text}",
    },
    "document_ocr": {
        "version": "1.0",
        "system": "Extract all text from the document image.",
        "user": "Image attached.",
    },
    "document_extract": {
        "version": "1.0",
        "system": "Extract vitals, medications, allergens as JSON. Do not invent.",
        "user": "Text: {text}",
    },
    "voice_transcribe": {
        "version": "1.0",
        "system": "Transcribe the audio.",
        "user": "Audio attached.",
    },
    "voice_synthesize": {
        "version": "1.0",
        "system": "Generate speech audio for the given text.",
        "user": "Text: {text}",
    },
    "onboarding_guide": {
        "version": "1.0",
        "system": "Explain how a patient can use the CareLink intake chat.",
        "user": "Language: {language}",
    },
}


def get_prompt(task: str) -> Optional[dict]:
    """Return the template dict for a task, or None if unknown."""
    return _PROMPT_STORE.get(task)


def get_prompt_version(task: str) -> Optional[str]:
    prompt = _PROMPT_STORE.get(task)
    if prompt:
        return prompt.get("version")
    return None


def format_prompt(task: str, **values: str) -> Optional[str]:
    """Render the user template for a task with the given substitutions."""
    prompt = _PROMPT_STORE.get(task)
    if not prompt:
        return None
    template = prompt.get("user") or ""
    try:
        return template.format(**values)
    except KeyError:
        return template


def registered_tasks() -> list[str]:
    return sorted(_PROMPT_STORE.keys())