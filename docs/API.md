# AS Jewellar Pawn Shop — REST API Reference (API.md)

This document provides complete technical specifications for the Google Apps Script Web App API.

---

## 1. Authentication & Base Endpoint

- **Endpoint**: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
- **Authentication**: Opaque session token (`AS_JWT_[UUID]_[TIMESTAMP]`) passed via `token` query param or JSON payload.

---

## 2. API Endpoints Catalog

### A. Public & Operational Endpoints

| Method | Action (`?action=...`) | Parameters / Body | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `health` | None | Service liveness & timestamp. |
| `GET` | `getRates` | None | Live 24K, 22K (916), and Silver rates. |
| `GET` | `getDashboardSummary` | None | Cached consolidated 5-minute KPI snapshot. |
| `POST` | `login` | `{ "username", "password" }` | Admin login & token issuance. |

### B. Customer Management Endpoints

| Method | Action | Parameters / Body | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `getCustomers` | `token` | Returns customer directory array. |
| `GET` | `getCustomer` | `customerId`, `token` | Returns customer 360 bundle. |
| `GET` | `checkDuplicate` | `mobile`, `name`, `token` | Checks duplicate phone or name. |
| `POST` | `createCustomer` | Customer object JSON | Registers new borrower. |

### C. Pledge & Counter Transaction Endpoints

| Method | Action | Parameters / Body | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `createPledge` | Pledge + Items JSON, `Idempotency-Key` | Issues Pawn Ticket & assigns vault packet. |
| `POST` | `recordPayment`| Payment JSON, `Idempotency-Key` | Records interest or principal collection. |
| `POST` | `renewPledge` | Renewal JSON | Extends tenure by 12M & issues new ticket. |
| `POST` | `redeemPledge` | Redemption JSON | Closes loan upon full payoff & releases jewellery. |
| `POST` | `recordExpense`| Expense JSON | Records daily counter expense. |

### D. Offline Sync & Maintenance Endpoints

| Method | Action | Parameters / Body | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `syncTransaction`| Queue payload + Idempotency token | Ingests offline-queued transactions. |
| `POST` | `createBackup` | `token` | Triggers timestamped Drive clone. |
| `GET` | `listBackups` | `token` | Lists available snapshot backups in Drive. |

---

## 3. Idempotency Protocol

Every counter transaction sends the following header or payload field:
```text
Idempotency-Key: IDEMP-[ACTION]-[TIMESTAMP]-[RANDOM]
```
If network retries send an identical idempotency key within 24 hours, the server returns the existing transaction response without creating duplicate financial records.
