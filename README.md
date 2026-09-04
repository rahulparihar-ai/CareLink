# CareLink

A multilingual, themeable patient + doctor healthcare platform with a voice/text AI assistant layer. Built with **Next.js 16, React 19, TypeScript, Tailwind v4, Zustand**.

## Quick start

```bash
cd frontend
npm install
npm run dev        # http://localhost:3000
```

## Verification

```bash
npx tsc --noEmit    # typecheck
npm run lint        # eslint
npm test            # vitest (i18n parity for 13 languages)
npm run build       # production build
```

## Deploy (Vercel)

1. Push to GitHub.
2. Import in Vercel, set **Root Directory = `frontend`**.
3. Add server-only env vars (never `NEXT_PUBLIC_*`):
   - `AI_PROVIDER=openrouter`
   - `AI_API_KEY=<your key>`
   - `AI_MODEL=openai/gpt-4o-mini`
   - `AI_BASE_URL=https://openrouter.ai/api/v1`
   - `AI_MOCK_MODE=false`
4. Deploy.

## Guardrails

- **REUSE > EXTEND > CREATE** — do not rewrite or delete working features.
- No fabricated patient or personal medical data; in-mock mode shows empty states and restores real data when the backend is available.
- **QR codes** carry only a secure session token, **never medical data**.
- **The doctor is the final clinical decision-maker.** AI never autonomously diagnoses or prescribes.
