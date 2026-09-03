"""CareLink Backend — ORM models.

The concrete model definitions live in :mod:`app.models` (single module).
This package exposes them for convenience and Alembic autogenerate.
"""

from .models import *  # noqa: F401, F403
from .models import Base  # noqa: F401