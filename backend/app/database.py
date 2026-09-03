"""CareLink Backend — database session & base model.

Supports both PostgreSQL (production) and SQLite (local tests). Use
environment-provided ``DATABASE_URL``.
"""

from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def build_engine(url: str | None = None, echo: bool | None = None):
    url = url or settings.database_url
    echo = settings.db_echo if echo is None else echo
    connect_args: dict = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False
    return create_engine(url, echo=echo, connect_args=connect_args)


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False,
                            expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create tables (used for local dev/test without Alembic)."""
    from . import models  # noqa: F401  (import models to register tables)
    Base.metadata.create_all(bind=engine)


def reset_db() -> None:
    """Drop all tables, then recreate. Test-only helper."""
    from . import models  # noqa: F401
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)