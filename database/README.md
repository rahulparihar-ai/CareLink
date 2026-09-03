# CareLink Database

Database schema, migrations, seed data and backups.

> **Status:** Scaffold. Currently the app runs on browser-local mock state (Zustand). This directory defines the target persistence layer the backend will use.

## Structure

```
database/
├── migrations/   # versioned schema migrations (e.g. Alembic)
├── schemas/      # canonical SQL / DDL definitions
├── seed/         # seed scripts (environments, professions — NOT patient demos)
├── backups/      # dump/restore artifacts
└── README.md
```

## Principles

- Registration data must save verbatim to the same patient profile (single source of truth).
- No fabricated patient or personal medical data is seeded into the database. Seed scripts may populate only reference data (languages, states, professions, councils).