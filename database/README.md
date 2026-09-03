# CareLink Database

Persistence for CareLink is defined by the backend ORM and managed with Alembic.

> **Status:** Implemented. Models live in `backend/app/models/models.py` (~30
> entities). Migrations live in `backend/alembic/`. Dev uses SQLite; production
> uses PostgreSQL.

## Apply migrations

```bash
cd backend
alembic upgrade head
```

Generate a new migration after model changes:

```bash
cd backend
alembic revision --autogenerate -m "describe change"
```

## Structure

```
database/          # this directory (conventions & backups)
backend/app/models/   # canonical ORM models
backend/alembic/      # versioned migrations
backend/alembic/versions/0001_initial.py   # initial full schema
```

## Principles

- Registration data saves verbatim to the same patient profile (single source of truth).
- **No fabricated patient or personal medical data is seeded.** Seed scripts populate only reference data (languages, states, professions, councils).
- **Seed data is separate from migrations** so no demo/fabricated data is ever committed as a migration.
- **QR codes and flash sessions carry only secure tokens** — never medical data.
- The AI service never owns the primary patient database.