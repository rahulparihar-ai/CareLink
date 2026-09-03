# CareLink

CareLink is a multilingual, themeable patient + doctor platform with a voice/text AI assistant layer. It is a full-stack application organised into a modular structure.

```
CareLink/
│
├── frontend/    # Patient + Doctor UI (Next.js 16, React, TypeScript, Tailwind v4)
├── backend/     # APIs + Authentication + Business Logic (FastAPI — implemented)
├── ai/          # AI features: conversation, translation, OCR, red flags (implemented)
├── database/    # persistence (managed via backend)
└── docs/        # architecture / api / database / workflows
```

## Architecture

- **frontend/** — all user-facing UI and client state (Zustand). It calls `backend/` over HTTP.
- **backend/** — FastAPI service. It controls **auth, authorization, consent, database access and all business logic**.
- **ai/** — a separate FastAPI AI service that the backend calls. AI never owns the primary patient database; the backend controls access.
- **QR codes** carry only a secure session token, **never medical data**.

Run everything with Docker Compose (backend + ai + postgres + frontend):

```bash
cp .env.example .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API + Swagger: http://localhost:8000/docs
- AI service: http://localhost:8001

## Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

Verification:

```bash
npx tsc --noEmit    # typecheck
npm run lint        # eslint
npm test            # vitest (incl. i18n parity for 13 languages)
npm run build       # production build
```

## Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload     # docs at /docs
python -m pytest tests -q
```

DB migrations: `cd backend && alembic upgrade head`. See `backend/README.md`.

## AI service

```bash
cd ai
pip install -r requirements.txt
uvicorn ai.app.main:app --reload --port 8001
python -m pytest tests -q
```

Runs fully in mock mode without a provider key. See `ai/README.md`.

## Configuration

See `.env.example`. Secret env vars are **server-side only** — never `NEXT_PUBLIC_*` for AI/database secrets.

## Guardrails

- **REUSE > EXTEND > CREATE** — do not rewrite or delete working features.
- No fabricated patient or personal medical data; in-mock mode shows empty states and restores real data when the backend is available.
- Aadhaar linking is a UI flow and does not imply government verification or stored medical history; health-record import requires ABDM/ABHA + explicit patient consent.
- **Hospital affiliation is not professional verification.** Mock verification returns `unverified`.
- **The doctor is the final clinical decision-maker.** AI never autonomously diagnoses or prescribes.