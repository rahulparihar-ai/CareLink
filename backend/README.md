# CareLink Backend

APIs + Authentication + Authorization + Business Logic for CareLink.

> **Status:** Implemented. FastAPI backend with auth, OTP/JWT, RBAC, consent,
> QR sessions, documents, encounters, prescriptions, investigations, followups,
> notifications, audit and AI-boundary. AI runs in the separate `ai/` service.

## Run

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate   # (or source .venv/bin/activate)
pip install -r requirements.txt
# sqlite dev DB (default) — tables auto-created on startup
uvicorn app.main:app --reload
```

Open http://127.0.0.1:8000/docs for interactive Swagger UI.

Set `DATABASE_URL` for PostgreSQL (production) — see `.env.example`.

## Database migrations (Alembic)

```bash
cd backend
# generate a new migration after model changes
alembic revision --autogenerate -m "describe change"
# apply migrations
alembic upgrade head
```

- Migrations live in `backend/alembic/versions/`.
- `app.database.init_db()` auto-creates tables in dev/test only; production
  should use Alembic migrations.
- **Seed data is separate from migrations.** The seed directory is
  intentionally not included in migrations to avoid committing fabricated
  production data.

## Tests

```bash
cd backend
python -m pytest tests -q
```

Covers auth/OTP/JWT, RBAC, ownership, consent, QR single-use/expiry,
documents, doctor workflow, and the AI boundary.

## Structure

```
backend/
├── app/
│   ├── api/routes/     # HTTP endpoints (auth, patients, doctors, documents, qr, ai, admin, notifications)
│   ├── models/         # SQLAlchemy ORM models (~30 entities)
│   ├── schemas/        # Pydantic request/response + envelope
│   ├── services/       # Business logic (auth, patients, doctors, ai client)
│   ├── adapters/       # Ext integrations (professional verification, ABDM, storage) — mock by default
│   ├── deps.py         # Auth/RBAC/consent dependencies (server-side enforced)
│   ├── middleware/     # Request-ID, rate-limit, error envelope
│   ├── config.py       # env-driven settings
│   ├── security.py     # bcrypt, OTP hash, JWT
│   └── main.py         # FastAPI app factory
├── alembic/            # DB migrations
├── tests/              # pytest suite
└── requirements.txt
```

## Security rules (non-negotiable)

- Authorization is enforced server-side; the client role claim is never trusted.
- A patient may only read/write their own record.
- A doctor may access a patient only with an active **relationship + granted
  consent**.
- **QR codes contain only a secure, short-lived, single-use session token —
  never medical data.**
- Documents are stored in PRIVATE server-side storage and served only through
  authenticated endpoints to authorized parties.
- **Hospital affiliation is NOT professional verification.** Mock verification
  returns `unverified`, never `verified`.
- The **doctor is the final clinical decision-maker**; AI output is gated and
  never autonomously persists clinical truth.
- **OTP store is `mock` in dev/test** (`123456`). A real OTP gateway is a
  future integration — never committed in the frontend.