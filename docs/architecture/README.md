# CareLink Architecture

## Overview

CareLink is a multilingual (13 languages, `ur` RTL), themeable patient + doctor platform with an AI assistant layer. It is a full-stack application: a Next.js frontend talks to a FastAPI backend over HTTP; the backend owns auth, authorization, consent, database access and business logic; a separate FastAPI AI service is called by the backend.

## Top-level layout

```
CareLink/
├── frontend/    # Patient + Doctor UI (Next.js App Router, TypeScript)
├── backend/     # APIs + Auth + RBAC + Consent + Business Logic (FastAPI — implemented)
├── ai/          # AI features (conversation, translation, OCR, red flags — implemented)
├── database/    # persistence (managed by backend via Alembic)
└── docs/        # architecture / api / database / workflows
```

## Service model (anti-corruption boundary)

- **Frontend → Backend**: the frontend calls the backend for all auth, profile,
  records and business operations. There is **no direct frontend→database**
  access.
- **Backend → AI**: the backend calls the AI service. The AI service **never
  owns the primary patient database** and **never sees the auth store**.
- **QR codes** carry only a secure, short-lived, single-use **session token —
  never medical data**. Records are released only after consent/relationship
  checks.
- **Doctor is the final clinical decision-maker.** AI output is gated behind
  the doctor and tagged with provenance; it is never auto-persisted as
  clinical truth.

## Backend module layout

```
backend/app/
├── api/routes/    # HTTP endpoints (auth, patients, doctors, documents, qr, ai, admin, notifications)
├── models/        # SQLAlchemy ORM (~30 entities)
├── schemas/       # Pydantic request/response + {success,data,error,request_id} envelope
├── services/      # business logic (auth, patients, doctors, ai_client)
├── adapters/      # external integrations — mock by default, never fabricated results
├── deps.py        # FastAPI auth/RBAC/consent dependencies (server-side enforced)
├── middleware/    # request-id, rate-limit, error envelope
├── config.py      # env-driven settings
├── security.py    # bcrypt passwords, PBKDF2 OTP hash, JWT access/refresh
└── main.py        # app factory
```

## Auth & authorization model

1. **OTP flow** — send/verify/resend; OTPs are stored hashed, never plaintext.
   `OTP_STORE=mock` returns a deterministic OTP (`123456`) in dev/test; a real
   gateway is a future integration.
2. **JWT** — short-lived access token + rotating refresh token; the refresh
   token fingerprint is stored server-side and can be revoked on logout.
3. **Registration** — patients and doctors register via mobile (+ OTP); Aadhaar
   linking is a UI flow and does **not** imply government verification.
4. **RBAC** — roles `PATIENT`, `DOCTOR`, `HOSPITAL_ADMIN`, `SYSTEM_ADMIN`.
   Authorization is enforced server-side; the client role claim is never trusted.
5. **Consent** — a doctor may access a patient's records only with an active
   **patient–doctor relationship + granted consent**; consent can be revoked.

## Frontend module layout

```
frontend/src/
├── app/          # Next.js App Router entry (layout, page switch, globals)
├── components/   # shared UI (brand/, shared/, ui/, primitives)
├── features/     # auth/, patient/, doctor/, hospital/, intake/, ai/, splash
├── hooks/        # shared React hooks (e.g. useAiAssistant)
├── layouts/      # page shells + navigation
├── i18n/         # 13-language translations + parity test
├── lib/          # framework-agnostic core (ai/, brand/)
├── routes/       # role-gated routing
├── store/        # Zustand store (UI state)
├── themes/       # theme provider
└── types/        # shared TypeScript contracts
```

## Key flows

1. **Registration → Profile** — details captured during registration are written
   verbatim to the patient profile. Aadhaar linking is a UI flow; linking does
   not imply stored medical history or government verification.
2. **Consent → Encounter → Prescription/Investigation/Follow-up** — a doctor
   must hold an active relationship + consent before creating encounters or
   reading a patient's records.
3. **QR check-in** — the patient shows a QR; the scanning doctor exchanges the
   single-use token for the patient id (no medical data in the QR).
4. **AI intake interview** — the backend calls the AI service; output is tagged
   `mock` when the AI service is unreachable, and never persisted as clinical truth.

## Guardrails

- **REUSE > EXTEND > CREATE** — do not rewrite or delete working features.
- Secret env vars are server-side only — never `NEXT_PUBLIC_*` for AI/DB keys.
- No fabricated patient or personal medical data in production surfaces; show
  empty states when the backend is unavailable.
- **Hospital affiliation is NOT professional verification.** Mock verification
  returns `unverified`.
- **AI never autonomously diagnoses or prescribes.**