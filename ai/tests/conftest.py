"""Pytest fixtures for CareLink AI tests.

Adds the repo root to sys.path so ``ai.*`` is importable from anywhere.
"""

from __future__ import annotations

import os
import sys

import pytest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


@pytest.fixture
def mock_settings():
    """Settings that force mock mode regardless of the environment."""
    from ai.config.settings import get_settings

    return get_settings({"MOCK_AI_MODE": "true", "FORCE_MOCK_AI_MODE": "true"})


@pytest.fixture
def live_like_settings():
    """Settings resembling a live provider (with fake credentials) so code
    paths for real providers can be exercised without network access."""
    from ai.config.settings import get_settings

    return get_settings({
        "MOCK_AI_MODE": "false",
        "AI_PROVIDER": "openai",
        "AI_API_KEY": "DUMMY_KEY_FOR_TESTS",
        "AI_MODEL": "gpt-4o-mini",
        "ALLOW_FALLBACK": "false",
    })


@pytest.fixture
def client():
    from fastapi.testclient import TestClient
    from ai.app.main import create_app

    return TestClient(create_app())