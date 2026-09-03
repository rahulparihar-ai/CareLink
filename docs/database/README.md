# CareLink Database Docs

See `database/README.md` for the layout.

## Entities

- **patients** — id, name, dob, gender, mobile, email, password (hashed), language, address, emergency contact
- **doctor_profiles** — profession-scoped registration/credential data
- **appointments** *(legacy — being removed from the patient portal)*
- **medical_records** — consent-gated documents/history
- **consents** — ABDM/ABHA consent records for health-data import

## Rule

Registration data must persist verbatim into the same profile (single source of truth). No seeded fake patient data.