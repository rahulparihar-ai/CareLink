"""CareLink AI - clinical terminology (terminology base).

Contains on-record, plain-language term labels grouped by domain. This is a
terminology catalog, not medical logic. It lets the model (and mock outputs)
use consistent, un-invented, low-risk vocabulary for common chronicities and
durations. All phrases here are generic and NOT diagnoses.
"""

from __future__ import annotations

# Duration / chronicity qualifiers (used for history question formulation).
DURATION_OPTIONS = ["day", "days", "week", "weeks", "month", "months", "year", "years"]

# Common complaint phrases used in the mock/example history builder.
# These are symptom *descriptions*, kept deliberately generic.
COMMON_COMPLAINTS = {
    "fever": ["fever", "temperature", "taf"],
    "cough": ["cough", "khansi"],
    "cold": ["cold", "runny nose"],
    "stomach pain": ["stomach pain", "abdominal pain", "pet dard"],
    "headache": ["headache", "sir dard"],
    "breathing difficulty": ["breathing difficulty", "breathlessness", "saans"],
}

# Question banks used to formulate follow-ups. Each question is phrased as an
# open, non-leading question. Answers flagged missing become history gaps.
QUESTION_BANK: dict[str, list[str]] = {
    "fever": [
        "How high has your temperature been?",
        "For how long have you had the fever?",
        "Does the fever come and go, or is it constant?",
        "Do you have chills or body aches along with the fever?",
    ],
    "cough": [
        "For how long have you had the cough?",
        "Is the cough dry or with phlegm?",
        "Do you have fever or breathlessness with the cough?",
    ],
    "cold": [
        "For how long have you had cold symptoms?",
        "Do you have a runny or blocked nose?",
        "Do you have fever along with the cold?",
    ],
    "stomach pain": [
        "Where exactly is the pain in your abdomen?",
        "For how long have you had the pain?",
        "Does eating make it better or worse?",
        "Do you have nausea or vomiting with it?",
    ],
    "headache": [
        "For how long have you had the headache?",
        "Where is the pain located?",
        "Is the pain throbbing or constant?",
        "Does light or noise bother you?",
    ],
    "breathing difficulty": [
        "When did the breathing difficulty start?",
        "Is it there all the time or only on activity?",
        "Do you have cough or fever with it?",
    ],
}

# On-record generic self-care advice phrases (educational, NOT prescriptions).
GENERAL_ADVICE = {
    "fever": "Rest, drink plenty of fluids, and let your doctor know your temperature trend.",
    "cough": "Keep well hydrated and let your doctor know how long the cough has lasted.",
    "cold": "Rest, stay hydrated, and let your doctor know if the symptoms worsen.",
    "stomach pain": "Keep note of what you eat and when the pain changes, and talk to your doctor.",
    "headache": "Note when the headache starts and what makes it better, and talk to your doctor.",
    "breathing difficulty": "Breathing difficulty should be discussed promptly with a doctor.",
}

DOMAINS = ["presenting_complaint", "history_of_present_illness", "past_medical_history",
           "medications", "allergies", "family_history", "social_history",
           "review_of_systems"]


def question_bank_for(complaint: str) -> list[str]:
    return QUESTION_BANK.get(complaint, [])


def advice_for(complaint: str) -> str:
    return GENERAL_ADVICE.get(complaint, "")