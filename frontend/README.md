# CareLink — Frontend

Multilingual (13 languages, includes RTL Urdu), themeable patient + doctor health platform with an AI assistant layer. Built on Next.js App Router + TypeScript + Zustand.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm run dev       # development server
npm run build     # production build
npm run lint      # eslint
npm test          # vitest (routing, i18n parity, AI config/actions/gateway)
npx tsc --noEmit  # type check
```

## Structure

```
src/
├── app/          # Next.js App Router entry (layout, page switch, globals, api routes)
├── components/   # shared UI (brand/, shared/, ui/)
├── features/     # feature view modules (auth/, patient/, doctor/, hospital/, kiosk/, ai/, splash)
├── hooks/        # shared React hooks (useAiAssistant)
├── layouts/      # page shells + navigation (PatientPageShell, DoctorPageShell, BottomNav, ...)
├── i18n/         # 13-language translations + useTranslation + parity test
├── lib/          # framework-agnostic core (ai/, brand/)
├── routes/       # role-gated routing (routing.ts)
├── services/     # mock service adapters (auth, AI gateway, OCR, ...)
├── store/        # Zustand store (single source of truth)
├── themes/       # theme provider (ThemeProvider)
├── utils/        # shared utilities (cn, toneBg)
├── types/        # shared TypeScript contracts
└── data/         # reference option lists (professions, orgs) + demo.ts
```

## Conventions

- **REUSE > EXTEND > CREATE** — do not rewrite or delete working features.
- No fabricated patient or personal medical data on production surfaces; show empty states when the backend is unavailable.
- Secret env vars are server-side only — never `NEXT_PUBLIC_*` for AI/DB keys.
