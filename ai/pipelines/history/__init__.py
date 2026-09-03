"""CareLink AI - history pipeline."""

from ai.clinical.adapters import create_clinical_services


def structure_history(transcript: str, answers: list[str] | None = None,
                      language: str = "en"):
    svcs = create_clinical_services()
    return svcs.history_extractor.structure(
        transcript, answers=answers or [], language=language)


def next_question(complaint: str, answered: list[str] | None = None,
                  language: str = "en"):
    svcs = create_clinical_services()
    result = svcs.adaptive_questions.next_question(
        complaint, answered or [], language=language)
    return result