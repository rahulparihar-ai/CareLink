# CareLink Architecture

## Overview

CareLink is a multilingual (13 languages, `ur` RTL), themeable patient + doctor platform with an AI assistant layer. This document describes the target architecture after the modular restructure.

## Top-level layout

```
CareLink/
├── frontend/    # Patient + Doctor UI (Next.js App Router, TypeScript)
├── backend/     # APIs + Authentication + Business Logic (FastAPI — scaffold)
├── ai/          # AI features (conversation, translation, OCR, red flags — scaffold)
├── database/    # Database schema + migrations + seed (scaffold)
└── docs/        # architecture / api / database / workflows
```

## Frontend module layout

Next.js App Router requires the `app/` directory for routing. Feature code is organised into modular directories:

```
frontend/src/
├── app/          # Next.js App Router entry (layout, page switch, globals)
├── components/   # shared UI (brand/, shared/, ui/, primitives)
├── features/     # feature view modules (auth/, patient/, doctor/, hospital/, kiosk/, ai/, splash)
├── hooks/        # shared React hooks (e.g. useAiAssistant)
├── layouts/      # page shells + navigation (PatientPageShell, DoctorPageShell, BottomNav, etc.)
├── i18n/         # 13-language translations + useTranslation + parity test
├── lib/          # framework-agnostic core (ai/, brand/)
├── routes/       # role-gated routing (routing.ts, routing.test.ts)
├── services/     # mock service adapters (auth, AI gateway, OCR, etc.)
├── store/        # Zustand store (single source of truth for UI state)
├── themes/       # theme provider (ThemeProvider)
├── utils/        # shared utilities (cn, toneBg)
├── types/        # shared TypeScript contracts
└── data/         # reference option lists (professions, orgs) + demo.ts
```

### View state

- The Zustand store (`src/store/index.ts`) owns navigation (`View`), role, session, patient profile, doctor profile, theme, and language.
- `src/routes/routing.ts` maps `View` → render in `src/app/page.tsx`.
- `src/i18n` serves 13 languages with a parity test enforcing identical key counts.

## Module responsibilities

- **frontend/** — all user-facing UI and client state.
- **backend/** — authentication (OTP/phone, Aadhaar UI flow), business logic, record APIs.
- **ai/** — server-side AI pipelines; the frontend already wires cold starts via `src/app/api/ai/chat/route.ts`.
- **database/** — persistence; the target of registration/profile data (single source of truth).

## Key flows

1. **Registration → Profile** — details captured during registration are written verbatim to the patient profile (`setPatientProfile`). Aadhaar linking is a UI flow; linking does not imply stored medical history.
2. **Health-data import** — requires an ABDM/ABHA ecosystem + explicit patient consent (see `workflows`).
3. **AI assistant** — server-side gateway with provider abstraction and strict action allowlist.

## Guardrails

- **REUSE > EXTEND > CREATE** — do not rewrite or delete working features.
- Secret env vars are server-side only — never `NEXT_PUBLIC_*` for AI/DB keys.
- No fabricated patient or personal medical data in production surfaces; show empty states when the backend is unavailable.