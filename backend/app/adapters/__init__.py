"""CareLink Backend — external adapters (mock + future integrations).

Every adapter has a live/integration variant and a mock variant. Mock is used
in dev/test and auto-defaults in production when a provider is not configured.
These never fabricate verification results for real patients.
"""

from .professional_verification import ProfessionalVerification
from .abdm import ABDMAdapter
from .health_record_import import HealthRecordImport
from .storage import StorageAdapter

__all__ = [
    "ProfessionalVerification",
    "ABDMAdapter",
    "HealthRecordImport",
    "StorageAdapter",
]