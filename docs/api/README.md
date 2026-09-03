# CareLink API

| Method | Path | Purpose | Status |
|--------|------|---------|--------|
| POST | `/auth/otp` | Send OTP to mobile | planned |
| POST | `/auth/verify` | Verify OTP, issue session | planned |
| POST | `/auth/aadhaar/verify` | Aadhaar verification (UI flow) | planned |
| POST | `/auth/register` | Create patient profile | planned |
| GET | `/patients/{id}/profile` | Read profile | planned |
| PUT | `/patients/{id}/profile` | Update profile | planned |
| GET | `/patients/{id}/records` | List medical records (consent-gated) | planned |
| POST | `/health/import` | Consent-based ABDM/ABHA import | planned |
| GET | `/ai/chat` | AI assistant (moved from frontend server route) | planned |

> Frontend-only route today: `GET /api/ai/chat` in `frontend/src/app/api/ai/chat/route.ts`.

## Auth model

- Mobile → OTP → verify (primary)
- Aadhaar → verification → OTP → verify (UI-only in prototype — no real government verification claim)
- Returning user: personal login id + password