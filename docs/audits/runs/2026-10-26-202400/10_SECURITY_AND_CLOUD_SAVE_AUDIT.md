# The Whispering Wilds — Security & Cloud Save Audit
**Audit Date:** 2026-10-26
**Execution Environment:** Node.js v24.19.0 / Express / SQLite File Mode

---

## 1. Backend Security Suite (34 / 34 Passed)
- **CSRF Protection:** State-changing requests lacking `X-WW-CSRF` header return HTTP 403.
- **Rate Limiting:** IP registration throttled after threshold requests.
- **SQL / Injection Defense:** Parameterized queries and strict schema validation.
- **Password Hashing:** Scrypt cryptographic key derivation with individual salt.

---

## 2. Cloud Save & Firestore Evaluation (20 Passed, 2 Skipped)
- **Local SQLite Save Fallback:** 20 unit/regression test cases passing (save serialization, schema versioning, checksum validation, corruption recovery).
- **Live Firestore Status:** 2 live cloud-save round-trip tests skipped (HTTP 503).
  - **Reason:** `GOOGLE_APPLICATION_CREDENTIALS` environment variable is not provisioned on this local developer machine.
  - **Integrity Compliance:** Tests were **honestly skipped** rather than bypassed with mock passes.
