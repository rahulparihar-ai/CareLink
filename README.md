# CareLink

CareLink is a multilingual, themeable patient + doctor platform with a voice/text AI assistant layer. This repository is organised into a modular structure.

```
CareLink/
│
├── frontend/    # Patient + Doctor UI (Next.js 16, React, TypeScript, Tailwind v4)
├── backend/     # APIs + Authentication + Business Logic (FastAPI — scaffold)
├── ai/          # AI features: conversation, translation, OCR, red flags (scaffold)
├── database/    # Database + Schema + Migrations (scaffold)
└── docs/        # architecture / api / database / workflows
```

## Why this structure

- **frontend/** — all user-facing UI and client state (Zustand). Runs standalone in mock mode today.
- **backend/** — APIs, auth, business logic. Currently a scaffold; see `backend/README.md`.
- **ai/** — server-side AI pipelines. The frontend already wires cold AI via `frontend/src/app/api/ai/chat/route.ts`.
- **database/** — persistence. Not yet wired; frontend runs on browser-local mock state.

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

## Backend (scaffold)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Configuration

See `.env.example`. Secret env vars are **server-side only** — never `NEXT_PUBLIC_*` for AI/database keys.

## Guardrails

- **REUSE > EXTEND > CREATE** — do not rewrite or delete working features.
- No fabricated patient or personal medical data in production surfaces; show empty states when the backend is unavailable.
- Aadhaar linking is a UI flow and does not imply stored medical history; health-record import requires ABDM/ABHA + explicit patient consent.