# AS Jewellar Pawn Shop — Security Architecture & Guidelines (SECURITY.md)

This document details the security controls, cryptographic implementations, authentication safeguards, and data protection standards implemented in **AS Jewellar Pawn Shop**.

---

## 1. Authentication & Session Model

- **Password Cryptography**: Passwords are never stored in plaintext. Passwords are salted with a server-side cryptographic secret and hashed using **SHA-256**:
  $$\text{Hash} = \text{SHA256}(\text{Salt} + \text{Password})$$
- **Session Tokens**: Single-session opaque tokens (`AS_JWT_[UUID]_[TIMESTAMP]`) with an **8-hour expiration sliding window** managed via Google Apps Script `CacheService`.
- **Brute-Force Attack Resistance**:
  - Account lockout triggers after **5 consecutive failed login attempts**.
  - A mandatory **300-second (5-minute) cooldown window** with live countdown timer is enforced across both client and server layers.
  - Successful login immediately resets the failure counter.

---

## 2. Sensitive Data & PII Minimization

- **Government ID Masking**:
  - Aadhaar numbers are masked as `XXXX-XXXX-4589`.
  - Voter ID and PAN numbers are masked as `***-***-9874`.
  - Unmasked IDs are never logged in audit trails, error dumps, or URL query parameters.
- **Zero Sensitive Data in URLs**: No passwords, tokens, or personal identifiers are passed in browser URLs.

---

## 3. Storage & Document Security

- **Private Google Drive Folders**: Document folders (`AS Jewellar Pawn Shop/Customers/...`) explicitly have public link sharing disabled (`DriveApp.Access.PRIVATE`).
- **File Upload Whitelisting**: Strictly restricts uploads to verified MIME types (`image/jpeg`, `image/png`, `application/pdf`) and enforces client-side canvas compression ($< 250\text{ KB}$) prior to cloud upload.

---

## 4. Injection Defenses

- **XSS Protection**: Dynamic borrower inputs are HTML entity-encoded via `Validation.escapeHTML()` before being inserted into DOM templates.
- **Formula Injection Defense**: All user inputs starting with `=`, `+`, `-`, `@`, `\t`, `\r` are neutralized with `'` before writing to Google Sheets.
