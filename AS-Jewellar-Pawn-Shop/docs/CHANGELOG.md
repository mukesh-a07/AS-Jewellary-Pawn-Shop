# AS Jewellar Pawn Shop — Architectural Changelog (CHANGELOG.md)

All notable changes, architectural milestones, and module releases for **AS Jewellar Pawn Shop** are documented in this file.

---

## [v1.0.0-PROD] — 2026-09-01

- **Feature**: Production Handover, Governance, and Permanent Documentation System.
- **Changed Files**:
  - `docs/README.md`, `docs/ARCHITECTURE.md`, `docs/DATABASE.md`, `docs/API.md`, `docs/SECURITY.md`, `docs/OFFLINE-SYNC.md`, `docs/DOCUMENT-STORAGE.md`, `docs/PRINTING.md`, `docs/RATE-SYSTEM.md`, `docs/BUSINESS-RULES.md`, `docs/DEPLOYMENT.md`, `docs/BACKUP-RESTORE.md`, `docs/USER-GUIDE.md`, `docs/CHANGELOG.md`, `docs/TEST-CASES.md`.
  - `SETUP.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `BACKUP-RESTORE.md`, `USER-GUIDE.md`, `CHANGELOG.md`.
  - `js/validation.js`, `js/auth.js`, `backend/AuthService.js`, `backend/DatabaseService.js`, `backend/Code.js`, `sw.js`.
- **Database Changes**: No column renames; verified 10 sheet tabs schema parity with formula injection sanitization.
- **API Changes**: Added `createBackup`, `listBackups`, and brute-force rate limiter caching.
- **Migration Required**: None (Zero-downtime backward compatible).
- **Testing Status**: 283 / 283 Automated Unit & Integration Tests Passed (100%), 45 / 45 Routes HTTP 200 OK.
