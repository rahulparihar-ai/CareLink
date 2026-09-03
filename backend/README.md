# CareLink Backend

APIs + Authentication + Business Logic for CareLink.

> **Status:** Scaffold — backend is not yet wired to the frontend (frontend currently runs in mock mode). This directory defines the target architecture. Implement endpoints here, then point `frontend` at them and flip `isDemoMode()` off.

## Structure

```
backend/
├── app/
│   ├── api/          # Route handlers / endpoints
│   ├── models/       # Database ORM models (SQLAlchemy)
│   ├── schemas/      # Pydantic request/response schemas
│   ├── services/     # Business logic (auth, patients, doctors, records)
│   ├── auth/         # OTP, JWT, Aadhaar/ABDM integration stubs
│   ├── middleware/   # CORS, logging, security, rate-limiting
│   └── main.py       # FastAPI app entry point
├── tests/            # pytest suite
├── requirements.txt
└── README.md
```

## Planned endpoints (stubs to build)

- `POST /auth/otp` — send OTP to mobile
- `POST /auth/verify` — verify OTP, issue token
- `POST /auth/aadhaar/verify` — Aadhaar verification (UI-only prototype; no real gov. verification claim)
- `POST /auth/register` — create patient profile
- `GET/PUT /patients/{id}/profile` — single source of truth for profile
- `GET/PATCH /patients/{id}/records` — medical records (consent-gated)
- `POST /health/import` — consent-based ABDM/ABHA health-record import (architecture only)

## Verification / security notes

- Secret env vars live here (server-side) — never `NEXT_PUBLIC_*`.
- See `../.env.example` for the shared environment template.