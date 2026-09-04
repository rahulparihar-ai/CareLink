# Deployment Guide

CareLink is full-stack: a **Next.js frontend**, a **FastAPI backend**, a **FastAPI AI service**, and **Postgres** (SQLite in dev). Different layers need different hosts.

| Layer | Tech | Recommended host | Notes |
|-------|------|------------------|-------|
| Frontend | Next.js 16 (App Router) | **Vercel** | static/SSR Next.js |
| Backend | FastAPI | Render/Railway/Fly | persistent API |
| AI service | FastAPI | Render/Railway/Fly | separate service |
| Database | Postgres | Render/Railway/Fly managed | SQLite in dev only |

> ⚠️ **Security:** rotate the OpenRouter/OpenAI keys before deploying. They were exposed in chat history. Set them as **encrypted, server-only** env vars — never `NEXT_PUBLIC_*`.

---

## 1. Frontend → Vercel

The repo is a **monorepo**: the Next.js app lives in `frontend/` and the repo root has **no `package.json`**. If Vercel's Root Directory is not set to `frontend`, the build produces nothing and every URL returns `NOT_FOUND` (404). You MUST set it in the dashboard.

### Dashboard (recommended)
1. Push this repo to GitHub.
2. Vercel → **Add New… → Project** → Import the GitHub repo.
3. **Root Directory**: set to `frontend` (framework auto-detects as Next.js, build command `npm run build`).
4. **Environment Variables** (Project → Settings → Environment Variables), all **server-only**:

   | Key | Value |
   |-----|-------|
   | `AI_PROVIDER` | `openrouter` |
   | `AI_API_KEY` | *your NEW OpenRouter key* |
   | `AI_MODEL` | `openai/gpt-4o-mini` |
   | `AI_BASE_URL` | `https://openrouter.ai/api/v1` |
   | `AI_MOCK_MODE` | `false` |

5. Deploy.

> The frontend's AI routes (`/api/ai/*`) call OpenRouter directly from **server-side** route handlers and read the `AI_*` env. Do **not** create any `NEXT_PUBLIC_AI_*` variable.

### CLI (alternative)
```bash
cd frontend
npx vercel          # first run: interactive login with your account
npx vercel --prod
```

---

## 2. Database → Postgres (Render/Railway/Fly)

Provision a managed Postgres and copy its connection string.

---

## 3. Backend (FastAPI) → Render/Railway/Fly

Create a Web Service from the `backend/` directory. Set env:

| Key | Value |
|-----|-------|
| `APP_ENV` | `production` |
| `DEBUG` | `false` |
| `DATABASE_URL` | `postgresql://...` (the managed Postgres) |
| `JWT_SECRET` | a long random string |
| `JWT_ALGORITHM` | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` |
| `OTP_STORE` | `mock` (or a real SMS gateway) |
| `RATE_LIMIT_ENABLED` | `true` |
| `CORS_ORIGINS` | your Vercel URL, e.g. `https://carelink.vercel.app` |
| `AI_SERVICE_URL` | the AI service URL (e.g. `https://<ai>.onrender.com`) |
| `STORAGE_PROVIDER` | `local` |
| `ABDM_BASE_URL` | (any real integration) |

Run migrations: `alembic upgrade head`.

---

## 4. AI service (FastAPI) → Render/Railway/Fly

Create a Web Service from the repo root with dockerfile `ai/Dockerfile` (or from the `ai/` folder). Set env:

| Key | Value |
|-----|-------|
| `AI_PROVIDER` | `openrouter` |
| `AI_API_KEY` | your NEW OpenRouter key |
| `AI_MODEL` | `openai/gpt-4o-mini` |
| `AI_BASE_URL` | `https://openrouter.ai/api/v1` |
| `MOCK_AI_MODE` | `false` |

---

## Verifying

- Frontend: `https://<your-app>.vercel.app`
- Backend Swagger: `https://<backend>.onrender.com/docs`
- Confirm the frontend's server routes reach OpenRouter (AI health features answer with `provider`/`mock` flags in the response).

## Offline / self-hosted (single machine)

```bash
cp .env.example .env
docker compose up --build -d
```
- Frontend `:3000`, Backend `:8000/docs`, AI `:8001`, Postgres `:5432`.