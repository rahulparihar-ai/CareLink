"""CareLink AI - clinical service facade.

Provides a single entry point to construct the clinical services against a
shared Settings object.
"""

from __future__ import annotations

from typing import Optional

from ai.config.settings import Settings, get_settings
from .extraction import DataExtractor
from .history.adaptive import AdaptiveQuestionEngine
from .history.extractor import HistoryExtractor
from .red_flags import RedFlagService
from .summarization import SummaryService


class ClinicalServices:
    def __init__(self, settings: Optional[Settings] = None) -> None:
        self.settings = settings or get_settings()
        self.history_extractor = HistoryExtractor(self.settings)
        self.adaptive_questions = AdaptiveQuestionEngine(self.settings)
        self.summary = SummaryService(self.settings)
        self.red_flags = RedFlagService(self.settings)
        self.data_extractor = DataExtractor(self.settings)


def create_clinical_services(settings: Optional[Settings] = None) -> ClinicalServices:
    return ClinicalServices(settings)