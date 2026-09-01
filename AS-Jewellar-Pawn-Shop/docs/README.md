# AS Jewellar Pawn Shop — Permanent Documentation & Maintenance System (/docs)

Welcome to the central technical documentation and engineering governance repository for **AS Jewellar Pawn Shop**.

---

## 1. Documentation Index

| # | Document | Scope & Purpose |
| :---: | :--- | :--- |
| **01** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Full-stack topology, component architecture, data flows, and state management. |
| **02** | [`DATABASE.md`](DATABASE.md) | Google Sheets 10-tab schema reference, data types, constraints, and non-destructive migrations. |
| **03** | [`API.md`](API.md) | Google Apps Script REST API reference, request/response contracts, headers, and error dictionary. |
| **04** | [`SECURITY.md`](SECURITY.md) | Cryptographic models, SHA-256 salted hashing, brute-force rate limiting, and PII masking. |
| **05** | [`OFFLINE-SYNC.md`](OFFLINE-SYNC.md) | Service Worker PWA precaching, IndexedDB queue, 5 lifecycle states, and idempotency protocol. |
| **06** | [`DOCUMENT-STORAGE.md`](DOCUMENT-STORAGE.md) | Private Google Drive hierarchy, HTML5 camera watermarking, and client-side canvas compression. |
| **07** | [`PRINTING.md`](PRINTING.md) | Statutory Form F (Rule 8) Pawn Tickets, receipts, A4 and 80mm thermal layouts, and SVG QR codes. |
| **08** | [`RATE-SYSTEM.md`](RATE-SYSTEM.md) | Real-time metal pricing engine (`api.metals.dev`), 22K (916) conversion, and manual override ledger. |
| **09** | [`BUSINESS-RULES.md`](BUSINESS-RULES.md) | Tamil Nadu Pawnbrokers Act statutory rules (75% LTV, 12% p.a., 12M tenure, single-drawer cash formula). |
| **10** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | Single-branch production deployment guide for Google Workspace, Apps Script, and PWA hosting. |
| **11** | [`BACKUP-RESTORE.md`](BACKUP-RESTORE.md) | Automated daily backups, manual snapshot triggers, and step-by-step point-in-time restore procedures. |
| **12** | [`USER-GUIDE.md`](USER-GUIDE.md) | Bilingual (English + தமிழ்) counter operator manual from Login to Day-Book closing. |
| **13** | [`CHANGELOG.md`](CHANGELOG.md) | Architectural changelog format with migration requirements, changed files, and test statuses. |
| **14** | [`TEST-CASES.md`](TEST-CASES.md) | Complete catalog of 283+ automated and manual test cases across 13 module layers. |

---

## 2. Engineering Governance & Maintenance Protocol

> [!IMPORTANT]
> **Mandatory Rule for All Future Code Changes**:
> Any modification to the codebase **MUST** follow this 5-step maintenance lifecycle:
> 1. **Inspect Before Changing**: Review the affected module's implementation, related APIs, database schema, and existing documentation.
> 2. **Implement Without Breaking**: Maintain backward compatibility, preserve atomic ID structures, and never casually delete or rename production database columns.
> 3. **Update Documentation**: Update the corresponding `/docs` files immediately if API parameters, business rules, UI layouts, or database fields changed.
> 4. **Update Changelog**: Add a new entry to [`CHANGELOG.md`](CHANGELOG.md) detailing version, date, changed files, database changes, migration requirements, and test status.
> 5. **Run Verification**: Execute the full test suite (`scratch/test_*.js`) and verify all 45 HTTP application routes return `200 OK`.
