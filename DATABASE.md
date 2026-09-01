# AS Jewellar Pawn Shop — Database Schema Specification (DATABASE.md)

This document specifies the exact database schema, column headers, constraints, and data validation rules for the 10 Google Sheets tabs backing **AS Jewellar Pawn Shop**.

---

## 1. Sheet Tabs & Column Specifications

### Tab 1: `Customers`
Stores primary customer demographics and KYC verification details.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `customer_id` | String (PK) | `CUS-2026-000184` | Atomic unique ID (`CUS-YYYY-XXXXXX`) |
| **B** | `name_en` | String | `R. Murugan` | Full name in English |
| **C** | `name_ta` | String | `ஆர். முருகன்` | Full name in Tamil |
| **D** | `father_husband_name` | String | `M. Ramanathan` | Father's / Husband's name |
| **E** | `gender` | Enum | `MALE` | `MALE`, `FEMALE`, `OTHER` |
| **F** | `mobile` | String (Index)| `9876543210` | 10-Digit Primary Mobile (Unique) |
| **G** | `alt_mobile` | String | `9842199887` | Secondary Contact Number |
| **H** | `address` | String | `14/2, North Car Street` | Door No & Street Address |
| **I** | `town_village` | String | `Madurai Town` | Town / Village |
| **J** | `district` | String | `Madurai` | District |
| **K** | `pincode` | String | `625001` | 6-Digit Indian Postal Code |
| **L** | `id_type` | Enum | `AADHAAR` | `AADHAAR`, `VOTER_ID`, `PAN`, `RATION` |
| **M** | `id_number` | String | `XXXX-XXXX-4589` | Masked Government ID |
| **N** | `occupation` | String | `Trader / Business` | Primary Occupation |
| **O** | `status` | Enum | `ACTIVE` | `ACTIVE`, `INACTIVE`, `BLOCKED` |
| **P** | `created_at` | ISO Timestamp | `2024-01-12T10:00:00Z` | Registration Timestamp |
| **Q** | `created_by` | String | `ADMIN` | Staff username |

---

### Tab 2: `Pledges`
Stores top-level loan contracts (Pawn Tickets).

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `ticket_no` | String (PK) | `PLG-2026-000003` | Atomic Ticket ID (`PLG-YYYY-XXXXXX`) |
| **B** | `customer_id` | String (FK) | `CUS-2026-000184` | Reference to Customers tab |
| **C** | `pledge_date` | Date (YYYY-MM-DD)| `2026-09-01` | Transaction initiation date |
| **D** | `maturity_date` | Date (YYYY-MM-DD)| `2027-09-01` | Statutory redemption due date (12M) |
| **E** | `tenure_months` | Number | `12` | Loan duration in months |
| **F** | `total_gross_weight`| Decimal (g) | `16.700` | Gross weight in grams (3 decimals) |
| **G** | `total_stone_weight`| Decimal (g) | `0.200` | Stone weight in grams |
| **H** | `total_net_weight` | Decimal (g) | `16.500` | Net pure precious metal weight |
| **I** | `rate_gold_24k` | Decimal (₹/g)| `15958.00` | Market 24K benchmark rate applied |
| **J** | `rate_gold_22k` | Decimal (₹/g)| `14628.00` | Market 22K benchmark rate applied |
| **K** | `rate_silver` | Decimal (₹/g)| `243.90` | Market Silver benchmark rate applied |
| **L** | `total_estimated_value`| Decimal (₹)| `231685` | 100% Market valuation |
| **M** | `total_eligible_loan`| Decimal (₹)| `173764` | Maximum statutory loan (75% LTV) |
| **N** | `loan_amount` | Decimal (₹) | `150000` | Actual approved principal loan |
| **O** | `monthly_interest_rate`| Decimal (%) | `1.0` | Monthly interest rate (1.0% = 12% p.a.) |
| **P** | `monthly_interest_amount`| Decimal (₹)| `1500` | Calculated monthly interest charge |
| **Q** | `status` | Enum | `ACTIVE` | `ACTIVE`, `DUE`, `OVERDUE`, `RENEWED`, `REDEEMED`, `CLOSED` |
| **R** | `vault_location` | String | `Vault A` | Physical vault room / safe |
| **S** | `packet_id` | String | `PKT-0089` | Barcoded physical packet tag ID |
| **T** | `locker_tray` | String | `Locker 03 • Tray 12` | Locker and Tray coordinates |
| **U** | `created_at` | ISO Timestamp | `2026-09-01T18:06:15Z`| Record timestamp |
| **V** | `created_by` | String | `ADMIN` | Staff username |

---

### Tab 3: `PledgeItems`
Stores individual jewellery items associated with a Pawn Ticket.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `item_id` | String (PK) | `ITM-2026-000003-01`| Unique item identifier |
| **B** | `ticket_no` | String (FK) | `PLG-2026-000003` | Reference to Pledges tab |
| **C** | `category` | Enum | `GOLD` | `GOLD`, `SILVER`, `OTHER` |
| **D** | `item_type` | String | `Chain` | `Chain`, `Ring`, `Bangle`, `Necklace`, `Coin` |
| **E** | `description` | String | `22K Gold Rope Chain` | Hallmarking & stone identification notes |
| **F** | `gross_weight` | Decimal (g) | `12.500` | Item gross weight |
| **G** | `stone_weight` | Decimal (g) | `0.000` | Item stone deduction weight |
| **H** | `net_weight` | Decimal (g) | `12.500` | Item net weight |
| **I** | `purity` | String | `22K` | `24K`, `22K`, `18K`, `SILVER_925` |
| **J** | `rate_used` | Decimal (₹/g)| `14041.52` | Exact per-gram rate applied |
| **K** | `estimated_value` | Decimal (₹) | `175519` | Item market valuation |
| **L** | `eligible_loan` | Decimal (₹) | `131639` | Item 75% LTV eligible value |
| **M** | `approved_loan` | Decimal (₹) | `115000` | Item allocated approved loan |
| **N** | `created_at` | ISO Timestamp | `2026-09-01T18:06:15Z`| Timestamp |

---

### Tab 4: `Payments`
Stores all counter collections and interest settlement receipts.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `payment_id` | String (PK) | `PAY-2026-000412` | Unique Receipt ID (`PAY-YYYY-XXXXXX`) |
| **B** | `ticket_no` | String (FK) | `PLG-2026-002341` | Reference to Pledges tab |
| **C** | `amount` | Decimal (₹) | `1500` | Total payment received |
| **D** | `payment_type` | Enum | `INTEREST_ONLY` | `FULL_SETTLEMENT`, `PARTIAL`, `INTEREST_ONLY`, `PRINCIPAL_ONLY` |
| **E** | `payment_mode` | Enum | `CASH` | `CASH`, `UPI`, `BANK_TRANSFER` |
| **F** | `reference_no` | String | `UPI/423987654321` | Transaction UTR / Receipt reference |
| **G** | `principal_settled`| Decimal (₹) | `0` | Portion credited toward principal |
| **H** | `interest_settled` | Decimal (₹) | `1500` | Portion credited toward accrued interest |
| **I** | `remaining_principal`| Decimal (₹)| `75000` | Balance principal after payment |
| **J** | `status` | Enum | `CONFIRMED` | `CONFIRMED`, `REVERSED` |
| **K** | `created_at` | ISO Timestamp | `2026-08-10T11:45:00Z`| Payment timestamp |
| **L** | `created_by` | String | `ADMIN` | Staff username |

---

### Tab 5: `Redemptions`
Logs final pledge closure and jewellery release confirmations.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `redemption_id` | String (PK) | `RED-2026-000012` | Unique Redemption ID |
| **B** | `ticket_no` | String (FK) | `PLG-2026-002341` | Redeemed Pawn Ticket |
| **C** | `customer_id` | String (FK) | `CUS-2026-000184` | Borrower ID |
| **D** | `principal_settled`| Decimal (₹) | `75000` | Principal amount settled |
| **E** | `interest_settled` | Decimal (₹) | `750` | Outstanding interest settled |
| **F** | `total_settlement` | Decimal (₹) | `75750` | Total amount collected |
| **G** | `payment_mode` | Enum | `CASH` | Payment mode |
| **H** | `packet_id` | String | `PKT-0087` | Released packet identifier |
| **I** | `redemption_date` | Date (YYYY-MM-DD)| `2026-09-01` | Release date |
| **J** | `redeemed_by` | String | `ADMIN` | Authorizing admin |

---

### Tab 6: `Renewals`
Logs 12-month loan tenure extensions with immutable link to previous pawn ticket.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `renewal_id` | String (PK) | `REN-2026-000008` | Unique Renewal ID |
| **B** | `old_ticket_no` | String (FK) | `PLG-2025-001234` | Previous ticket (marked RENEWED) |
| **C** | `new_ticket_no` | String (FK) | `PLG-2026-002401` | Fresh 12-month pawn ticket |
| **D** | `customer_id` | String (FK) | `CUS-2026-000184` | Borrower ID |
| **E** | `interest_settled` | Decimal (₹) | `9000` | Accrued interest settled at renewal |
| **F** | `principal_carried`| Decimal (₹) | `75000` | Principal carried to new ticket |
| **G** | `renewal_date` | Date (YYYY-MM-DD)| `2026-09-01` | Renewal date |
| **H** | `new_maturity_date`| Date (YYYY-MM-DD)| `2027-09-01` | New statutory maturity date |
| **I** | `processed_by` | String | `ADMIN` | Staff username |

---

### Tab 7: `Expenses`
Logs daily shop counter operational expenses.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `expense_id` | String (PK) | `EXP-2026-000003` | Unique Expense ID |
| **B** | `date` | Date (YYYY-MM-DD)| `2026-09-01` | Expense date |
| **C** | `category` | Enum | `TEA_SNACKS` | `TEA_SNACKS`, `RENT`, `ELECTRICITY`, `STATIONERY`, `MAINTENANCE`, `SALARY`, `OTHER` |
| **D** | `amount` | Decimal (₹) | `120` | Amount spent |
| **E** | `description` | String | `Counter refreshments` | Expense notes |
| **F** | `payment_method` | Enum | `CASH` | Payment method |
| **G** | `created_at` | ISO Timestamp | `2026-09-01T17:50:00Z`| Timestamp |
| **H** | `created_by` | String | `ADMIN` | Staff username |

---

### Tab 8: `CashLedger`
Single-drawer physical counter cash movements.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `cash_tx_id` | String (PK) | `CSH-2026-000045` | Unique Cash movement ID |
| **B** | `date` | Date (YYYY-MM-DD)| `2026-09-01` | Movement date |
| **C** | `entry_type` | Enum | `DEBIT_LOAN_DISBURSED`| `DEBIT_LOAN_DISBURSED`, `CREDIT_PAYMENT_COLLECTED`, `DEBIT_EXPENSE`, `DRAWER_RECONCILIATION` |
| **D** | `reference_id` | String | `PLG-2026-000003` | Related Ticket / Payment ID |
| **E** | `amount` | Decimal (₹) | `150000` | Cash amount |
| **F** | `description` | String | `Loan cash disbursement` | Movement narrative |
| **G** | `created_by` | String | `ADMIN` | Staff username |

---

### Tab 9: `CustomerDocuments`
Stores metadata and Google Drive file links for KYC and pledge photos.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `doc_id` | String (PK) | `DOC-2026-000184-01`| Unique Document ID |
| **B** | `customer_id` | String (FK) | `CUS-2026-000184` | Customer ID |
| **C** | `pledge_id` | String (FK) | `PLG-2026-002341` | Pledge ID (Optional) |
| **D** | `doc_type` | Enum | `ID_PROOF` | `CUSTOMER_PHOTO`, `ID_PROOF`, `ADDRESS_PROOF`, `SIGNATURE`, `THUMB`, `PLEDGE_ITEM_PHOTO`, `PAWN_TICKET_PDF` |
| **E** | `doc_title` | String | `Aadhaar Front/Back` | User-friendly title |
| **F** | `stored_filename` | String | `DOC_CUS_000184_KYC.pdf`| Sanitized Drive filename |
| **G** | `drive_file_id` | String | `1DRIVE_DOC_FILE_...` | Google Drive File ID |
| **H** | `file_size_bytes` | Number | `1420500` | File size in bytes |
| **I** | `mime_type` | String | `application/pdf` | MIME type |
| **J** | `status` | Enum | `ACTIVE` | `ACTIVE`, `ARCHIVED`, `DELETED` |
| **K** | `created_at` | ISO Timestamp | `2026-08-30T10:15:00Z`| Upload timestamp |
| **L** | `uploaded_by` | String | `ADMIN` | Staff username |

---

### Tab 10: `AuditLogs`
Immutable system audit trail of all security and financial events.

| Col # | Header Name | Data Type | Sample Value | Description |
| :---: | :--- | :--- | :--- | :--- |
| **A** | `audit_id` | String (PK) | `AUD-2026-000098` | Unique Audit entry ID |
| **B** | `actor_id` | String | `ADMIN` | Staff username or SYSTEM |
| **C** | `action` | String | `CREATE_PLEDGE` | Event type |
| **D** | `entity_type` | String | `Pledges` | Affected entity / sheet |
| **E** | `entity_id` | String | `PLG-2026-000003` | Target entity primary key |
| **F** | `previous_state` | JSON String | `{}` | State before change |
| **G** | `new_state` | JSON String | `{"loanAmount":150000}`| State after change |
| **H** | `device_meta` | JSON String | `{"deviceId":"DEV-01"}`| Terminal metadata |
| **I** | `timestamp` | ISO Timestamp | `2026-09-01T18:06:15Z`| Event timestamp |

---

## 2. Integrity & Sanitization Rules

1. **No Row-Number Key Dependencies**: Every entity uses a permanent, alphanumeric ID (`CUS-...`, `PLG-...`, `PAY-...`).
2. **Formula Injection Neutralization**: Any string value starting with `=`, `+`, `-`, `@`, `\t`, `\r` is automatically prepended with a single quote (`'`) before insertion into Google Sheets.
3. **Immutable Financial History**: Rows in `Payments`, `AuditLogs`, and `CashLedger` are strictly append-only. Corrections are processed via reversing ledger entries.
