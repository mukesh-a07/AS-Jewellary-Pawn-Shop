# AS Jewellar Pawn Shop — Production Security Architecture (SECURITY.md)

This document outlines the security architecture, encryption standards, authentication models, PII protection, and access control policies implemented in **AS Jewellar Pawn Shop**.

---

## 1. Authentication & Session Management

- **Single-Branch Admin Model**: Counter operations are restricted to authenticated shop personnel.
- **Password Hashing**: Admin passwords are never stored in plaintext. They are hashed using **SHA-256 with a unique server-side cryptographic salt** (`Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + password)`).
- **Session Tokens**: Upon successful login, an opaque cryptographically random session token (`AS_JWT_[UUID]_[TIMESTAMP]`) is issued and stored in Google Apps Script `CacheService` with an **8-hour sliding expiration window**.
- **Brute-Force Rate Limiting**:
  - Both client-side (`js/auth.js`) and server-side (`backend/AuthService.js`) track consecutive failed attempts.
  - If **5 consecutive failed login attempts** occur, the account is locked for **300 seconds (5 minutes)** with a visible live countdown timer.
  - Successful authentication immediately clears the failure counter.

---

## 2. Customer Privacy & Sensitive Data Minimization

- **Government ID Masking**:
  - Government ID numbers (Aadhaar, Voter ID, PAN, Ration Card) are **strictly masked on all standard dashboard cards, tables, reports, and search results**:
    - Aadhaar: `XXXX-XXXX-4589`
    - PAN: `XXXXX1234F`
    - Voter / Other: `***-***-9874`
  - Unmasked numbers are never written to audit log narratives, URLs, or query parameters.
- **Zero Sensitive Data in URLs**: No passwords, tokens, or unmasked KYC numbers are transmitted via URL query parameters in GET requests.

---

## 3. Document Storage & Google Drive Access Control

- **Strictly Private Folders**: All customer photos, KYC scans, jewellery photos, and signed pawn tickets are stored in a private Google Drive folder hierarchy (`AS Jewellar Pawn Shop/Customers/...`).
- **No Public Links**: Document files explicitly have access restricted:
  ```javascript
  file.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  ```
- **Authorized Backend Streaming**: Document previews and downloads are only served through authorized backend session flows.

---

## 4. Input Sanitization & Injection Defense

- **Cross-Site Scripting (XSS) Prevention**:
  - All dynamic customer strings (names, addresses, item descriptions, audit notes) are HTML-entity encoded using `Validation.escapeHTML()` (`&`, `<`, `>`, `"`, `'`) before being rendered into the DOM.
- **Google Sheets / CSV Formula Injection Defense**:
  - To prevent formula injection attacks (CSV/Sheet injection), any string beginning with `=`, `+`, `-`, `@`, `\t`, `\r` is automatically neutralized by prepending a single quote (`'`) via `DatabaseService.sanitizeValue()` before writing to Google Sheets.

---

## 5. Financial Transaction Integrity & Idempotency

- **Idempotency Deduplication**:
  - Every counter transaction carries a unique `Idempotency-Key` (e.g. `IDEMP-NEW_PLEDGE-1788285975-XYZ`) generated at the moment of user interaction.
  - Duplicate network submissions (double-clicking or re-transmissions) are recognized by the server and rejected without duplicating records.
- **Immutable Financial Ledgers**:
  - Financial records (`Payments`, `CashLedger`, `Redemptions`, `Renewals`, `AuditLogs`) are **append-only**.
  - No counter operator can silently edit or delete past transaction rows. Corrections must be booked as explicit reversing transactions with recorded audit reasons.

---

## 6. Comprehensive Audit Trail

Every security-sensitive action is permanently logged into the `AuditLogs` Google Sheets tab with:
- **Actor ID** (Username / System)
- **Action Code** (e.g. `CREATE_PLEDGE`, `RECORD_PAYMENT`, `REVERSE_PAYMENT`, `UPDATE_VAULT_LOCATION`, `CREATE_SPREADSHEET_BACKUP`, `REPRINT_DOCUMENT`)
- **Target Entity & Primary Key**
- **Previous & New State JSON Payloads**
- **Device Terminal Identifier**
- **ISO 8601 Timestamp**
