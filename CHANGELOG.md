# AS Jewellar Pawn Shop — Architectural Changelog (CHANGELOG.md)

All notable changes, architectural milestones, and module releases for **AS Jewellar Pawn Shop** are documented in this file.

---

## [v1.0.0-PROD] — 2026-09-01 (Production Release)

### Core Milestones & Modules Delivered

#### Phase 1: Foundation & Application Shell
- Built responsive Single-Page Application (PWA) architecture with dark slate and warm gold luxury aesthetic.
- Created CSS design system tokens (`base.css`, `layout.css`, `components.css`, `responsive.css`).
- Integrated bilingual English and தமிழ் (Tamil) typography (`Mukta Malar`, `Noto Sans Tamil`).

#### Phase 2: Authentication & Multi-Tab Backend Routing
- Implemented Google Apps Script central API router with `doGet` and `doPost` dispatchers.
- Built session security with SHA-256 password hashing, salt injection, and 8-hour session expiration.
- Added client-side navigation guards and redirection logic (`js/auth.js`).

#### Phase 3: Customer Management & 360° Cockpit
- Built customer registration and update workflows with duplicate detection (10-digit mobile and exact name).
- Created Customer 360° profile cockpit aggregating lifetime loans, active pledges, payments, and KYC documents.
- Implemented strict PII masking on Aadhaar (`XXXX-XXXX-4589`) and Voter ID numbers.

#### Phase 4: Secure Document Management & HTML5 Camera
- Built Google Drive hierarchical storage (`Customers/CUS-.../Profile`, `KYC`, `Pledges`).
- Integrated HTML5 live camera photo capture with counter timestamp security watermarking.
- Restricted Drive file ACLs to private access only (zero public link exposure).

#### Phase 5: Live Gold & Silver Rate Engine
- Built metal rate tracking engine pulling live IBJA/MCX rates via `api.metals.dev` proxy.
- Implemented cached offline rate fallback clearly labeled `[ ⚠️ CACHED (Offline) ]`.
- Built manual admin rate override modal with audit logging.

#### Phase 6: New Pledge POS & Multi-Item Appraisal
- Built high-speed counter booking interface for single and multi-jewellery articles.
- Implemented real-time net weight calculation ($\text{Net} = \text{Gross} - \text{Stone}$), 100% market valuation, and 75% statutory LTV loan ceiling.
- Added physical vault placement assignment (`Vault A • Locker 03 • Tray 12 • PKT-0089`).

#### Phase 7: Bilingual Billing & Statutory Pawn Tickets (Form F)
- Implemented Tamil Nadu Pawnbrokers Act standard Form F (Rule 8) bilingual Pawn Ticket generator.
- Added dual output layout support: Full-page A4 print and 80mm compact thermal receipt with transaction QR code.

#### Phase 8: Payment & Accurate Interest Accrual Management
- Built transparent interest calculation engine based on elapsed days, previous payments, and configured rates.
- Supported flexible payment allocations: `INTEREST_ONLY`, `PARTIAL`, `FULL_SETTLEMENT`.
- Implemented idempotency token deduplication on all payment routes.

#### Phase 9: Renewal & 10-Step Verified Redemption
- Built 12-month loan renewal workflow chaining new pawn tickets while retaining full immutable history.
- Built 10-step verified redemption workflow: borrower KYC verification, payoff settlement, physical safe packet release, and locking financial records.

#### Phase 10: Operational Dashboard & Reminder System
- Built consolidated single-call summary endpoint (`getDashboardSummary`) tracking today's loans, collections, active loans, and overdue counts.
- Built dynamic reminder engine tracking 5 categories (*Due Today, Upcoming 7D, Overdue >12M, Interest Renewal, Missing KYC*) with 1-click WhatsApp messaging.

#### Phase 11: Vault & Packet Location Management
- Built 4-level physical coordinates tracking: `Vault Safe • Locker • Tray • Packet Tag ID`.
- Implemented interactive visual locker occupancy grid (Lockers 01–10) and compact QR code printable tags.
- Added immutable physical movement audit logging.

#### Phase 12: Reports & Basic Cash Day-Book Management
- Built 5 operational reports: *Daily Day-Book, Outstanding Portfolio, Customer Statement, Gold/Silver Purity Inventory, Monthly Summary*.
- Built single-drawer counter cash reconciliation formula ($\text{Opening} + \text{Inflow} - \text{Outflow} - \text{Expenses} = \text{Closing}$) and shop expense tracker.
- Added 1-click UTF-8 CSV exports and printable A4 report formats.

#### Phase 13: Hardened Offline-First & Background Sync Engine
- Built Service Worker application shell pre-caching (`sw.js`).
- Implemented IndexedDB transaction queue (`as_jewellar_db`) with 5 lifecycle statuses (`PENDING`, `SYNCING`, `SYNCED`, `FAILED`, `CONFLICT`).
- Added permanent 4-state connectivity badges (🟢 Online, 🟠 Offline, 🔄 Syncing, ⚠️ Sync Error) and conflict quarantine.

#### Phase 14: Dedicated Performance Optimization
- Replaced whole-table startup downloads with paginated on-demand search (15 items/page).
- Integrated Google Apps Script `CacheService` (5-minute TTL) and single-pass in-memory Google Sheets reads (`sheet.getDataRange().getValues()`).
- Added client-side HTML5 canvas image compression (95.1% payload reduction from 5MB to <250KB) and CSS shimmer loading skeletons.

#### Phase 15: Production Security & Reliability Audit
- Implemented 5-attempt brute-force rate limiter with 5-minute lockout cooldown across frontend and backend.
- Added HTML entity encoding (`Validation.escapeHTML`) for XSS protection.
- Neutralized Google Sheets formula injection by prepending `'` to leading `=`, `+`, `-`, `@` characters.
- Built automated Google Drive spreadsheet backup snapshot engine (`DatabaseService.createDailyBackup()`).

#### Phase 16: Complete UI/UX Real-World Review
- Conducted browser automation evaluation across all 20 counter operator workflows.
- Verified responsive layouts across Desktop (`1440x900`), Tablet (`768x1024`), and Mobile (`375x812`).
- Validated clean bilingual English and Tamil typography with zero text clipping.

#### Phase 17: Production Handover & Documentation Suite
- Authored complete 7-document operational suite: `SETUP.md`, `DATABASE.md`, `API.md`, `SECURITY.md`, `BACKUP-RESTORE.md`, `USER-GUIDE.md`, `CHANGELOG.md`.
- Verified 100% pass rate across all automated unit test suites and 45 HTTP application routes.
