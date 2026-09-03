# CareLink AI

AI features for CareLink — conversations, translation, OCR, and clinical red-flag detection.

> **Status:** Scaffold. The frontend already ships AI features under `frontend/src/lib/ai` (voice/text assistant, provider abstraction, mock mode). This directory is the target home for the server-side / pipeline components referenced by that layer.

## Structure

```
ai/
├── models/          # fine-tuned weights / model references
├── prompts/         # system prompts & few-shot examples
├── pipelines/       # composite inference pipelines
│   ├── history/     # conversational clinical history
│   ├── translation/ # multilingual + RTL
│   ├── document_ocr/# document digitization
│   └── red_flags/   # clinical red-flag detection
├── services/        # orchestration services
├── schemas/         # I/O contracts
└── config/          # model/provider config
```

## Frontend integration notes

- The frontend AI gateway lives in `frontend/src/lib/ai/gateway.ts`; provider adapters in `frontend/src/lib/ai/providers/`.
- Secrets for AI providers are **server-side only** (see `../.env.example`), never `NEXT_PUBLIC_*`.
- Aadhaar does **not** imply the patient has a stored medical history — importing health records requires an ABDM/ABHA ecosystem + explicit patient consent (see `../docs/architecture`).