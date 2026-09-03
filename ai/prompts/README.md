# Prompts

Central, versioned prompt store (`ai/prompts/__init__.py`).

- Every task template has a `version`; `registered_tasks()` lists them.
- Per-domain prompt helper modules live under `ai/prompts/<domain>/`
  (e.g. `documents/` exposes classify/ocr/extract system prompts).
- The backend-facing prompt templates used at runtime are the ones registered in
  the store; the FastAPI metadata surfaces the `prompt_version` per task.

This keeps prompts inspectable and auditable rather than scattered across calls.