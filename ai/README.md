# CareLink AI — Server-Side Service

The CareLink AI service performs the server-side, provider-backed intelligence
for CareLink: multilingual intake chat, structured **history** building,
**red-flag** suggestions, **document** processing (OCR / classification /
extraction / timeline), and doctor/patient **summaries**.

> **Status: IMPLEMENTED (mock-first).** The whole service runs fully offline in
> **mock mode** with zero credentials. Provider adapters (OpenAI, Gemini,
> Anthropic, OpenRouter) are implemented and selected via environment
> variables. Everything is designed to sit **behind the backend**, which is the
> only holder of patient data.

## Architecture

```
Frontend (React/Next) ──► Backend ──► AI Service (this) ──► AI Provider (LLM/STT/TTS/Vision)
```

- The AI service **does not own a database**. It is stateless and returns
  machine-readable JSON. The backend stores data.
- The AI service **cannot diagnose or prescribe on its own**. Outputs are
  structured, scored, provenance-tagged and physician-review-gated.
- Secrets live only in the **backend / service `.env`**; they are never exposed
  to the frontend.

```
ai/
├── config/            Settings (env-driven, no hardcoded keys)
├── schemas/           Core I/O contracts (envelope, provenance, facts, errors)
├── providers/         Provider abstractions + adapters (mock/openai/gemini/anthropic/openrouter, STT/TTS/Vision/Embeddings)
├── multilingual/      Language registry (23 langs), detection, translation (+RTL)
├── clinical/          History, adaptive questions, extraction, terminology
├── documents/         Document classification / OCR / extraction / timeline
├── safety/            Guardrails, validation, clinical-safety policy
├── provenance/        Source tracking & PII redaction
├── prompts/           Central, versioned prompt store
├── app/               FastAPI application (routes, schemas, services, middleware)
├── pipelines/         Thin orchestration facades per workflow
└── tests/             pytest suite (68 tests)
```

## Features

**IMPLEMENTED**

- **Mock mode out of the box** — `MOCK_AI_MODE=true` (default when no provider
  key/model is set). Deterministic, credential-free, offline.
- **Language registry** — English + the 22 scheduled Indian languages. Urdu
  (and Kashmiri) report `direction: "rtl"`.
- **Language detection** — offline heuristic detector (script + common-word),
  low-confidence is flagged for patient confirmation.
- **Translation** — offline deterministic translator for a curated vocabulary
  (unchanged elsewhere) + provider-backed path. Medically sensitive tokens
  (numbers, units, dosages, ABHA/Aadhaar, registration numbers, dates) are
  protected from corruption during translation.
- **Structured history** — SOAP-style, provenance-tagged structure from free
  text; never fabricates unreported vitals/facts.
- **Adaptive questioning** — rule-based next-question selection from a question
  bank; tracks missing information and signals completion.
- **Red-flag suggestions** — keyword-based escalation *suggestions for human
  review* (never a diagnosis; `clinical_safety.is_emergency_keyword` flags
  text only to prompt a doctor).
- **Document processing** — classify / mock-OCR / extract (vitals, medications,
  allergies) / build a chronological timeline.
- **Clinical summaries** — doctor-facing SOAP (with **no generated
  assessment**) and patient-facing plain-language text that **always carries a
  disclaimer** and never states a diagnosis.
- **Safety guardrails** — input-length limits, prompt-injection heuristic
  detection, PII scrubbing/redaction, and a deterministic **clinical-safety
  policy** that blocks absolute diagnosis/prescription/emergency claims.
- **Robust output parsing** — code fences, leading prose, non-JSON → typed
  `ShapeValidationError`.
- **Provider abstraction** — factory selects mock/openai/gemini/anthropic/
  openrouter plus speech/vision/embedding adapters. Timeout, rate-limit, auth
  and network errors are categorized and (for LLMs) retried with backoff, with
  optional fallback provider.
- **FastAPI service** — `/api/ai/*` routes, request-ID middleware, optional
  bearer-token auth, CORS, consistent response envelope, exception handler.

**MOCK / STUB (clearly labeled `mock: true` in output)**

- Real STT/TTS/OCR/embeddings calls are **stubs** until a provider is
  configured; they never silently pretend to do real work.
- Mock LLM returns a generic, disclaimer-guarded string (never a diagnosis).

**FUTURE INTEGRATION**

- Connecting the real provider adapters by setting env vars (below).
- Wiring the backend's ABHA/ABDM record import + consent flow.
- Storing audit/session records (the AI service stays stateless).

**NOT IMPLEMENTED**

- Autonomous triage, diagnosis, prescription, or unsolicited emergency action.
- A database inside `ai/` (by design — the backend owns storage).
- Native-model (e.g. BERT/Whisper/vision) local model downloads.

## Environment variables

Copy `ai/.env.example` → `ai/.env` and fill in your own values. **Never commit
a real `.env`.** The default mock mode needs none of them.

| Variable | Purpose | Default |
|---|---|---|
| `MOCK_AI_MODE` | Run fully offline (deterministic) | `true` |
| `FORCE_MOCK_AI_MODE` | Force mock even with keys present | `false` |
| `AI_PROVIDER` | `openai` / `openrouter` / `gemini` / `anthropic` / `mock` | `mock` |
| `AI_API_KEY` / `AI_MODEL` / `AI_BASE_URL` | Primary LLM credentials | (empty) |
| `AI_TIMEOUT_MS` | Provider timeout | `15000` |
| `ALLOW_FALLBACK`, `AI_FALLBACK_PROVIDER` / `_API_KEY` / `_MODEL` | Failover | `true` |
| `STT_PROVIDER`, `TTS_PROVIDER`, `VISION_PROVIDER`, `EMBEDDING_PROVIDER` + `_API_KEY` | Capability adapters | `mock` |
| `CLINICAL_MODE` | `modern_medicine` / `ayurveda` / `other_ayush` | `modern_medicine` |
| `REQUIRE_AUTH`, `AI_SHARED_SECRET` | Optional bearer-gate shared secret | `false` |
| `AI_MAX_INPUT_CHARS` | Request-size guard | `20000` |
| `CORS_ORIGINS` | Comma-separated origins (dev only) | (empty) |

## Running

```bash
cd carelink-2/ai            # directory containing this package
python -m venv .venv && source .venv/bin/activate   # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
uvicorn ai.app.main:app --reload        # or: uvicorn app.main:app from ai/ if added to path
```

Health check:

```bash
curl http://127.0.0.1:8000/api/ai/health
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/ai/health` | Service status incl. mock/provider/model |
| POST | `/api/ai/lang/detect` | Detect language of a string |
| POST | `/api/ai/lang/translate` | Translate to a language (RTL-aware) |
| POST | `/api/ai/interview/message` | Next adaptive question + red-flag check |
| POST | `/api/ai/history/structure` | Structured history from transcript |
| POST | `/api/ai/history/summarize` | Doctor/patient summary |
| POST | `/api/ai/red-flags` | Red-flag suggestions |
| POST | `/api/ai/documents/classify` | Classify a document |
| POST | `/api/ai/documents/process` | Classify + extract + OCR preview |
| POST | `/api/ai/documents/timeline` | Build a document timeline |
| POST | `/api/ai/onboarding` | Patient onboarding guide text |
| POST | `/api/ai/validate` | Guardrail/validation check |

All responses use a consistent envelope:

```json
{
  "success": true,
  "data": { "...": "..." },
  "metadata": { "mock": true, "provider": "mock", "language_code": "hi",
                 "direction": "ltr", "request_id": "...", "task": "...", ... },
  "warnings": []
}
```

## Tests

```bash
cd carelink-2/ai
pip install -r requirements.txt pytest
python -m pytest tests -q         # 68 tests
```

Coverage includes: language detection/translation, Urdu RTL, Hindi/English,
history extraction, adaptive questioning, missing information, red flags,
document classify/OCR/extract/timeline, doctor/patient summaries, safety
guardrails, malformed-output parsing, provider selection/errors, mock mode, and
contract tests asserting the service **never diagnoses, prescribes, or
fabricates** clinical facts.

## Integration requirements

- The **backend** calls these endpoints and is the sole holder of patient data.
- The backend must send its own request-ID (optional) and, if
  `REQUIRE_AUTH=true`, `Authorization: Bearer <AI_SHARED_SECRET>`.
- Aadhaar does **not** imply stored history; importing records requires the
  ABHA/ABDM ecosystem + explicit patient consent.

## Safety & limitations

- Structured, clinician-gated outputs; no autonomous diagnosis/prescription.
- Red-flag and emergency-keyword detection are **rule-based suggestions** for
  human review only.
- Offline/mock translation is a limited vocabulary and returns untranslated
  text (never a guessed translation).
- All patient-facing text carries a disclaimer.