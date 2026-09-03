"""CareLink AI - configuration package.

Environment-driven settings. No secrets are embedded in code.
"""

from .settings import (
    AiProviderKind,
    ClinicalMode,
    EmbeddingProviderKind,
    LogLevel,
    LlmProviderConfig,
    Settings,
    SpeechProviderKind,
    VisionProviderKind,
    get_settings,
)

__all__ = [
    "AiProviderKind",
    "ClinicalMode",
    "EmbeddingProviderKind",
    "LogLevel",
    "LlmProviderConfig",
    "Settings",
    "SpeechProviderKind",
    "VisionProviderKind",
    "get_settings",
]