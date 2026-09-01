# AS Jewellar Pawn Shop — Google Sheets Database Schema Specification

This document defines the production database schema for **AS Jewellar Pawn Shop**, organized across **18 distinct Google Sheets tabs**.

> [!IMPORTANT]
> **Unique Identifier Rule**: Never use spreadsheet row numbers as foreign keys or public transaction references. All primary keys follow an atomic year-prefixed sequence pattern: `PREFIX-YYYY-NNNNNN` (e.g. `CUS-2026-000001`, `PLG-2026-000001`, `PAY-2026-000001`).

---

## 1. Core Entity Tabs

### 1. `Users`
Stores authorized administrative accounts. Plain-text passwords are never stored.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `user_id` **(PK)** | String | No | Unique User ID (`USR-2026-000001`) |
| `username` | String | No | Unique login username (`admin`) |
| `password_hash` | String | No | SHA-256 password hash |
| `salt` | String | No | Cryptographic salt |
| `full_name` | String | No | Display name (`Shop Admin`) |
| `role` | String | No | Role code (`ADMIN`) |
| `branch` | String | No | Branch name (`Main Branch`) |
| `status` | String | No | `ACTIVE`, `LOCKED`, `DISABLED` |
| `created_at` | ISO DateTime | No | `2026-08-30T10:00:00.000Z` |
| `last_login_at` | ISO DateTime | Yes | `2026-08-30T10:30:00.000Z` |

---

### 2. `Customers`
Master customer profile records with bilingual names and contact details.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `customer_id` **(PK)** | String | No | Primary Key (`CUS-2026-000184`) |
| `name_en` | String | No | English Name (`R. Murugan`) |
| `name_ta` | String | Yes | Tamil Name (`ஆர். முருகன்`) |
| `father_husband_name` | String | Yes | Relative name (`M. Ramanathan`) |
| `gender` | String | No | `M`, `F`, `O` |
| `mobile` | String | No | 10-digit phone (`9876543210`) |
| `alt_mobile` | String | Yes | Secondary phone (`9842199887`) |
| `address` | String | No | Full address (`14/2 North Car St`) |
| `town_village` | String | No | Village/Town (`Madurai`) |
| `district` | String | No | District (`Madurai`) |
| `pincode` | String | Yes | PIN Code (`625001`) |
| `id_type` | String | No | `AADHAAR`, `VOTER_ID`, `RATION_CARD`, `PAN` |
| `id_number` | String | No | Masked ID or permitted number |
| `occupation` | String | Yes | Business/Work (`Trader`) |
| `status` | String | No | `ACTIVE`, `SUSPENDED` |
| `created_at` | ISO DateTime | No | Profile creation timestamp |
| `created_by` | String | No | User ID (`USR-2026-000001`) |

---

### 3. `CustomerDocuments`
Google Drive document metadata and verification statuses.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `document_id` **(PK)** | String | No | Unique Doc ID (`DOC-2026-000184-01`) |
| `customer_id` **(FK)** | String | No | Foreign Key to `Customers.customer_id` |
| `pledge_id` **(FK)** | String | Yes | Optional link to `Pledges.pledge_id` |
| `document_type` | String | No | `PHOTO`, `AADHAAR`, `SIGNATURE`, `ITEM_PHOTO` |
| `file_name` | String | No | Filename (`Aadhaar_Front.pdf`) |
| `drive_file_id` | String | No | Google Drive Unique File ID |
| `drive_url` | String | No | Google Drive access link |
| `verified_by` | String | Yes | User ID who verified KYC |
| `uploaded_at` | ISO DateTime | No | Timestamp |

---

### 4. `Pledges`
Master pawn tickets and loan agreements.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `pledge_id` **(PK)** | String | No | Unique Pledge Ticket (`PLG-2026-002341`) |
| `customer_id` **(FK)** | String | No | Foreign Key to `Customers.customer_id` |
| `pledge_date` | Date | No | Issue Date (`2026-08-30`) |
| `maturity_date` | Date | No | Loan Due Date (`2027-08-30`) |
| `loan_amount` | Decimal | No | Approved Principal Loan (`75000.00`) |
| `interest_rate_monthly` | Decimal | No | Monthly % (`1.00`) |
| `status` | String | No | `ACTIVE`, `DUE`, `OVERDUE`, `RENEWED`, `REDEEMED`, `AUCTION_REVIEW` |
| `vault_location` | String | Yes | `Vault A / Locker 03 / Tray 12` |
| `packet_id` | String | Yes | Physical packet tag (`PKT-2026-00874`) |
| `created_at` | ISO DateTime | No | Creation timestamp |
| `created_by` | String | No | User ID |

---

### 5. `PledgeItems`
Individual jewellery items pledged under a pawn ticket (multi-item per ticket support).

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `item_id` **(PK)** | String | No | Unique Item ID (`ITM-2026-000001`) |
| `pledge_id` **(FK)** | String | No | Foreign Key to `Pledges.pledge_id` |
| `item_category` | String | No | `CHAIN`, `RING`, `BANGLES`, `THALI`, `SILVER` |
| `item_description` | String | Yes | Specific details (`22K 916 Rope Chain`) |
| `purity` | String | No | `24K`, `22K`, `18K`, `SILVER` |
| `gross_weight` | Decimal (g) | No | Scale Gross Weight (`12.850`) |
| `stone_weight` | Decimal (g) | No | Stone/Dross Weight (`0.350`) |
| `net_weight` | Decimal (g) | No | Net Gold/Silver Weight (`12.500`) |
| `gold_rate_applied` | Decimal (₹/g) | No | Rate per gram at pledge time (`6750.00`) |
| `estimated_value` | Decimal (₹) | No | Calculated market value (`84375.00`) |

---

## 2. Financial & Lifecycle Tabs

### 6. `Payments`
Collection ledger for monthly interest and principal part-settlements.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `payment_id` **(PK)** | String | No | Unique Payment Receipt (`PAY-2026-000451`) |
| `pledge_id` **(FK)** | String | No | Foreign Key to `Pledges.pledge_id` |
| `customer_id` **(FK)** | String | No | Foreign Key to `Customers.customer_id` |
| `amount_paid` | Decimal | No | Total collected (`750.00`) |
| `principal_settled` | Decimal | No | Principal deduction (`0.00`) |
| `interest_settled` | Decimal | No | Interest settled (`750.00`) |
| `payment_type` | String | No | `INTEREST_ONLY`, `PARTIAL_PRINCIPAL`, `SETTLEMENT` |
| `payment_mode` | String | No | `CASH`, `UPI`, `BANK_TRANSFER`, `CARD` |
| `reference_number` | String | Yes | UPI/Bank Txn ID (`UPI/423987654321`) |
| `payment_date` | ISO DateTime | No | Timestamp |
| `received_by` | String | No | User ID |

---

### 7. `Renewals`
Records loan extensions and accrued interest settlements.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `renewal_id` **(PK)** | String | No | Unique Renewal ID (`RNW-2026-000001`) |
| `old_pledge_id` **(FK)** | String | No | Previous Pawn Ticket |
| `new_pledge_id` **(FK)** | String | No | Newly Issued Ticket |
| `interest_settled` | Decimal | No | Accrued Interest Paid (`18000.00`) |
| `new_maturity_date` | Date | No | New Due Date (`2027-08-30`) |
| `renewed_at` | ISO DateTime | No | Timestamp |
| `operator_id` | String | No | User ID |

---

### 8. `Redemptions`
Final settlement and physical item release documentation.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `redemption_id` **(PK)** | String | No | Unique Closure ID (`REC-2026-000001`) |
| `pledge_id` **(FK)** | String | No | Foreign Key to `Pledges.pledge_id` |
| `customer_id` **(FK)** | String | No | Foreign Key to `Customers.customer_id` |
| `principal_paid` | Decimal | No | Final Principal Paid (`75000.00`) |
| `interest_paid` | Decimal | No | Final Accrued Interest (`750.00`) |
| `total_collected` | Decimal | No | Total Settled (`75750.00`) |
| `ticket_surrendered` | Boolean | No | `TRUE` / `FALSE` |
| `item_released_to` | String | No | Recipient Name (`R. Murugan`) |
| `redeemed_at` | ISO DateTime | No | Timestamp |
| `authorized_by` | String | No | User ID |

---

### 9. `InterestTransactions`
Calculated accrued interest schedules and interest audit breakdown.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `interest_id` **(PK)** | String | No | Unique ID (`INT-2026-000001`) |
| `pledge_id` **(FK)** | String | No | Foreign Key to `Pledges.pledge_id` |
| `period_start` | Date | No | Start Date (`2026-08-30`) |
| `period_end` | Date | No | End Date (`2026-09-30`) |
| `principal_basis` | Decimal | No | Amount on which interest is computed (`75000.00`) |
| `rate_applied` | Decimal | No | `1.00` |
| `calculated_interest` | Decimal | No | `750.00` |
| `status` | String | No | `ACCRUED`, `PAID`, `WAIVED` |

---

## 3. Operational & Market Rate Tabs

### 10. `Reminders`
Automated maturity notices, overdue alerts, and WhatsApp communication logs.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `reminder_id` **(PK)** | String | No | Unique ID (`REM-2026-000001`) |
| `pledge_id` **(FK)** | String | No | Foreign Key to `Pledges.pledge_id` |
| `customer_id` **(FK)** | String | No | Foreign Key to `Customers.customer_id` |
| `notice_type` | String | No | `DUE_SOON`, `MATURITY_TODAY`, `OVERDUE_90D`, `AUCTION_WARNING` |
| `language` | String | No | `TA`, `EN` |
| `channel` | String | No | `WHATSAPP`, `SMS`, `PHONE_CALL` |
| `message_content` | String | No | Text sent in Tamil / English |
| `status` | String | No | `PENDING`, `DISPATCHED`, `DELIVERED` |
| `dispatched_at` | ISO DateTime | Yes | Timestamp |

---

### 11. `GoldRates`
Gold rate benchmark history (per gram).

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `rate_date` | Date | No | `2026-08-30` |
| `rate_time` | String | No | `10:30 AM` |
| `rate_24k` | Decimal | No | `7250.00` |
| `rate_22k` | Decimal | No | `6750.00` |
| `rate_18k` | Decimal | No | `5520.00` |
| `source` | String | No | `MANUAL_OVERRIDE`, `LIVE_API` |
| `entered_by` | String | No | User ID (`ADMIN`) |

---

### 12. `SilverRates`
Silver rate benchmark history (per gram).

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `rate_date` | Date | No | `2026-08-30` |
| `rate_time` | String | No | `10:30 AM` |
| `rate_per_gram` | Decimal | No | `94.50` |
| `source` | String | No | `MANUAL_OVERRIDE`, `LIVE_API` |
| `entered_by` | String | No | User ID (`ADMIN`) |

---

### 13. `AuditLogs`
Immutable system audit trail.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `audit_id` **(PK)** | String | No | Unique ID (`AUD-2026-000001`) |
| `actor_id` | String | No | User ID (`USR-2026-000001`) |
| `action` | String | No | `NEW_PLEDGE`, `PAYMENT`, `RATE_UPDATE`, etc. |
| `entity_type` | String | No | `Pledges`, `Customers`, `Payments` |
| `entity_id` | String | No | Primary key of affected record |
| `previous_state` | String (JSON) | Yes | JSON state before change |
| `new_state` | String (JSON) | Yes | JSON state after change |
| `ip_or_device` | String | Yes | Client device / IP metadata |
| `timestamp` | ISO DateTime | No | Server timestamp |

---

### 14. `Settings`
Key-value store for application configuration and financial policies.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `setting_key` **(PK)** | String | No | `DEFAULT_MONTHLY_INTEREST_RATE` |
| `setting_value` | String | No | `1.0` |
| `description` | String | Yes | Policy note |
| `updated_at` | ISO DateTime | No | Timestamp |
| `updated_by` | String | No | User ID |

---

### 15. `SyncQueue`
Tracks synchronized and pending offline transaction batches.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `sync_id` **(PK)** | String | No | Unique ID (`SYN-2026-000001`) |
| `local_transaction_id` | String | No | Client ID (`TXN-LOCAL-1725000000`) |
| `action_type` | String | No | `NEW_PLEDGE`, `PAYMENT` |
| `payload_json` | String (JSON) | No | Data payload |
| `sync_status` | String | No | `PENDING`, `SYNCING`, `SYNCED`, `FAILED` |
| `client_timestamp` | ISO DateTime | No | Client creation timestamp |
| `synced_at` | ISO DateTime | Yes | Server sync timestamp |

---

### 16. `CashLedger`
Daily opening, transaction movement, and closing cash reconciliations.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `ledger_id` **(PK)** | String | No | Unique ID (`CSH-2026-000001`) |
| `date` | Date | No | `2026-08-30` |
| `opening_cash` | Decimal | No | `50000.00` |
| `total_collections` | Decimal | No | `18750.00` |
| `total_loans_given` | Decimal | No | `35000.00` |
| `total_expenses` | Decimal | No | `1200.00` |
| `expected_closing_cash` | Decimal | No | `32550.00` |
| `actual_closing_cash` | Decimal | Yes | Physical counted cash |
| `cash_variance` | Decimal | Yes | Difference |
| `closed_by` | String | Yes | Admin ID |

---

### 17. `Expenses`
Daily shop operational overheads.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `expense_id` **(PK)** | String | No | Unique ID (`EXP-2026-000001`) |
| `date` | Date | No | `2026-08-30` |
| `category` | String | No | `RENT`, `ELECTRICITY`, `SALARY`, `STATIONERY`, `TEA_REFRESHMENTS` |
| `amount` | Decimal | No | `1200.00` |
| `payment_mode` | String | No | `CASH`, `UPI` |
| `remarks` | String | Yes | Description |
| `entered_by` | String | No | User ID |

---

### 18. `Notifications`
Operational reminder alerts displayed on dashboard and top navigation.

| Column Header | Data Type | Nullable | Description & Example |
| :--- | :--- | :--- | :--- |
| `notification_id` **(PK)** | String | No | Unique ID (`NOT-2026-000001`) |
| `title` | String | No | `8 Pledges Due Today` |
| `message` | String | No | Alert details |
| `severity` | String | No | `INFO`, `WARNING`, `DANGER` |
| `target_url` | String | Yes | `reminders.html?filter=due_today` |
| `is_read` | Boolean | No | `FALSE` |
| `created_at` | ISO DateTime | No | Timestamp |
