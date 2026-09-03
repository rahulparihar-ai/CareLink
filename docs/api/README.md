# CareLink API

All endpoints mount under `/api/v1`. Auth endpoints: `/api/v1/auth/*`. Interactive docs at `/docs` when the backend runs.

Responses use a consistent envelope: `{"success": bool, "data": ...|null, "message": str, "request_id": str|null}`. Errors: `{"success": false, "error": {"code", "message"}, "request_id": ...}`.

## Auth

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/auth/send-otp` | Send OTP (mock returns `123456`) | none |
| POST | `/auth/verify-otp` | Verify OTP | none |
| POST | `/auth/register` | Register patient or doctor | none |
| POST | `/auth/login` | Password login → tokens | none |
| POST | `/auth/login/otp` | OTP login → tokens | none |
| POST | `/auth/refresh` | Rotate refresh token | refresh token |
| POST | `/auth/logout` | Revoke session | refresh token |
| POST | `/auth/reset-password` | Reset via OTP | none |
| GET | `/auth/me` | Current user profile | bearer |

## Patients

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/patients/{id}` | Profile (own, or doctor w/ consent) | PATIENT/DOCTOR |
| PATCH | `/patients/{id}` | Update own profile | PATIENT |
| GET | `/patients/{id}/consents` | List consents | PATIENT/DOCTOR |
| POST | `/patients/{id}/consent` | Grant consent to a doctor | PATIENT |
| POST | `/patients/{id}/consent/{cid}/revoke` | Revoke consent | PATIENT |
| POST | `/patients/{id}/qr` | Create QR session token | PATIENT/DOCTOR |
| GET | `/patients/{id}/qr/current` | Current active QR | PATIENT/DOCTOR |

## Doctors

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/doctors/me` | Own profile | DOCTOR |
| GET | `/doctors/{did}/patients` | Authorized patient list | DOCTOR |
| POST | `/doctors/{did}/encounters` | Create encounter (consent required) | DOCTOR |
| GET | `/doctors/{did}/encounters/{eid}` | Encounter detail + child records | DOCTOR |
| PATCH | `/doctors/{did}/encounters/{eid}` | Update encounter | DOCTOR |
| POST | `/doctors/{did}/encounters/{eid}/prescriptions` | Add prescription | DOCTOR |
| POST | `/doctors/{did}/encounters/{eid}/investigations` | Add investigation | DOCTOR |
| POST | `/doctors/{did}/patients/{pid}/followups` | Add follow-up (consent required) | DOCTOR |
| GET | `/doctors/{did}/patients/{pid}/records` | Patient's records (consent required) | DOCTOR |
| POST | `/doctors/{did}/patients/{pid}/request-document` | RFI request (consent required) | DOCTOR |

## Documents

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/documents/patients/{pid}/upload` | Upload (private storage) | PATIENT/DOCTOR |
| GET | `/documents/patients/{pid}` | List patient's documents | PATIENT/DOCTOR |
| GET | `/documents/{id}/signed-url` | Signed reference (not a public URL) | PATIENT/DOCTOR |
| GET | `/documents/{id}/content` | Stream bytes (authorized only) | PATIENT/DOCTOR |

## QR

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/qr/scan` | Exchange single-use token for patient id | DOCTOR |

## AI (backend boundary)

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/ai/history/message` | Multilingual intake interview (provenance-tagged) | PATIENT/DOCTOR |
| GET | `/ai/health` | AI service health/mock status | — |

## Notifications

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| GET | `/notifications` | My notifications | any |
| POST | `/notifications/{id}/read` | Mark read | any |

## Organizations & Admin

| Method | Path | Purpose | Auth |
|--------|------|---------|------|
| POST | `/organizations` | Create organization | DOCTOR/HOSPITAL_ADMIN |
| GET | `/organizations` | List organizations | any |
| POST | `/organizations/{id}/affiliate` | Request affiliation | DOCTOR |
| POST | `/admin/verify-doctor` | Submit professional verification (mock→unverified) | SYSTEM_ADMIN |
| GET | `/admin/audit` | Audit log | SYSTEM_ADMIN |
| GET | `/admin/workplace-affiliations` | Affiliations | SYSTEM_ADMIN |

## Security notes

- Authorization is enforced **server-side** (FastAPI dependencies), never from client role claims.
- A doctor may access a patient only with an active **relationship + granted consent**.
- **QR and documents never leak medical data**; document bytes are private and streamed only to authorized parties.
- AI output is tagged `mock` when the AI service is unreachable and is **never** auto-persisted as clinical truth.
- Mock professional verification returns `unverified`, never `verified`.