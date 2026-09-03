# CareLink Workflows

## 1. Patient Registration

```
Basic Details (name, mobile, DOB, gender, address — all required)
        ↓
Aadhaar Linking (optional; UI flow)  →  Link Aadhaar  |  Skip for Now
        ↓
Account (password)  →  Continue (blocked until all required fields valid)
        ↓
Profile saved (same details as registration — single source of truth)
```

Aadhaar linking does **not** mean medical history is available. Verification is a UI flow in the prototype (no official government verification claim).

## 2. Health-Data Import (consent-based)

```
Aadhaar Linked ✓
        ↓
Health Data Import
        ↓
Available Records
        ↓
Patient Consent
        ↓
Import
```

Requires an ABDM/ABHA health-record ecosystem + explicit patient consent. Without a real integration this is surfaced as clearly-labelled demo export only, and does not fabricate clinical history.

## 3. Doctor Onboarding (simplified) — 8 core steps

Profession → Mobile → Basic → Credentials → Verification → Account → Practice → Review/Portal