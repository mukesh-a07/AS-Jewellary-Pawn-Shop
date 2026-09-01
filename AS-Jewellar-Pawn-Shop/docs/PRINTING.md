# AS Jewellar Pawn Shop — Printing & Receipt Layout Standards (PRINTING.md)

This document specifies the statutory Form F Pawn Ticket layout, payment receipts, renewal/redemption slips, A4 portrait and 80mm thermal receipt formats, and QR code standards for **AS Jewellar Pawn Shop**.

---

## 1. Statutory Form F (Rule 8) Bilingual Pawn Ticket

Under the **Tamil Nadu Pawnbrokers Act**, pawn tickets must adhere to the statutory **Form F (Rule 8)** standard in bilingual **English + தமிழ்**:

### Mandatory Statutory Header & Metadata
- **Shop Trade Name**: `AS JEWELLAR PAWN SHOP / ஏ.எஸ் ஜூவல்லர்ஸ்`
- **Shop Address & Phone**: `No. 14, Main Bazaar, Madurai - 625001 • Phone: 0452-2345678`
- **Pawnbroker License No**: `PB/MDU/2026/042`
- **Pawn Ticket Number**: `PLG-YYYY-XXXXXX`
- **Pledge Date & Maturity Date**: 12-Month statutory redemption due date.
- **Physical Safe Coordinates**: `Vault Location • Locker • Tray • Packet Tag ID`.
- **Borrower Demographics**: Name (English + தமிழ்), Mobile, Full Residential Address, Government ID reference.

### Itemized Jewellery Appraisal Table
- Item Category & Type (e.g. `GOLD - 22K Chain`).
- Detailed Hallmarking & Identification Notes (e.g. `22K Rope Chain with 916 seal`).
- Gross Weight, Stone Deduction Weight, and Pure Net Weight (in grams to 3 decimal places).
- Market Benchmark Rate Applied per gram.
- Total Market Estimated Valuation.

### Statutory Financial Terms Box
- Approved Principal Loan Disbursed (வழங்கப்பட்ட கடன் அசல்).
- Agreed Monthly Interest Rate (e.g. `1.0% / month` = 12% per annum).
- Calculated Monthly Interest Charge.

### Tamil Statutory Terms & Conditions (விதிமுறைகள்)
1. அடகு வைக்கப்பட்ட நகைகளை 12 மாத காலத்திற்குள் அசல் மற்றும் வட்டி செலுத்தி மீட்டுக்கொள்ள வேண்டும். (Loans must be redeemed within 12 months).
2. மாதாந்திர வட்டி தவறாமல் செலுத்தப்பட வேண்டும். (Monthly interest must be serviced regularly).
3. கெடு முடிந்த பின்னரும் வட்டி செலுத்தாத நகைகள் சட்டப்படி பொது ஏலத்திற்கு விடப்படும். (Unredeemed articles after maturity will be subject to statutory auction).

### Signature Sign-Off Block
- Left: Borrower / Customer Signature (வாடிக்கையாளர் கையொப்பம்).
- Right: For AS Jewellar Pawn Shop (Authorised Signatory / நிர்வாகி).

---

## 2. Supported Output Layouts

### A. Full Page A4 Print Format
- Standard A4 sheet ($210\text{mm} \times 297\text{mm}$) portrait orientation.
- High-contrast tabular borders, complete item descriptions, and statutory terms.
- Ideal for official customer counter copies and audit folders.

### B. 80mm Thermal Receipt Format (POS Receipt)
- Continuous 80mm thermal roll layout (`.thermal-slip`).
- Compact typography with monospaced financial tables.
- Embeds scalable vector SVG QR code for rapid counter re-scanning.

---

## 3. Vector QR Code Specification

Every printed slip includes an SVG vector QR code containing a safe, tamper-proof transaction reference string:
```text
ASJ|PLG-2026-000003|CUS-2026-000184|150000|16.500|2026-09-01
```
Scanning this QR code with a standard counter barcode scanner instantly opens the Customer 360 profile and Pledge Record.

---

## 4. Reprinting & Duplicate Watermarking

- When an authorized admin reprints an existing pawn ticket:
  - An immutable audit log entry (`REPRINT_PAWN_TICKET`) is generated.
  - A prominent diagonal watermark badge `*** DUPLICATE COPY / மறுபதிப்பு ***` is rendered across the top header to prevent fraud.
