# AS Jewellar Pawn Shop — Offline-First Architecture & Sync Engine (OFFLINE-SYNC.md)

This document details the Progressive Web App (PWA) offline architecture, Service Worker caching strategies, IndexedDB local schema, and background sync protocol for **AS Jewellar Pawn Shop**.

---

## 1. Offline Architecture Overview

```mermaid
graph TD
    Client["Counter Operation (Create Pledge / Payment)"]
    NetCheck{"Network Available?"}
    
    NetCheck -->|Yes (Online)| API["Google Apps Script Web App"]
    NetCheck -->|No (Offline)| IDB["IndexedDB syncQueue (Status: PENDING)"]
    
    IDB --> Badge["Update UI Status: 🟠 Offline (N Queued)"]
    
    Restored["Internet Restored Event"] --> SyncEngine["Background Sync Engine"]
    SyncEngine --> Upload["Upload Queued Items with Idempotency Key"]
    Upload --> ServerVal{"Server Response"}
    
    ServerVal -->|200 OK| MarkSynced["Mark SYNCED & Clear from Queue"]
    ServerVal -->|409 Conflict| Quarantine["Move to conflictsStore for Admin Review"]
    ServerVal -->|Network Error| Retry["Increment retryCount & Retry Later"]
```

---

## 2. Service Worker Caching (`sw.js`)

- **Cache Identifier**: `as-jewellar-v3`
- **Pre-Cached Assets**: All 45 application shell files (`.html`, `.css`, `.js`, `.svg`, `.json`).
- **Caching Strategy**: **Stale-While-Revalidate** for fast counter launches and automatic background cache updates.

---

## 3. IndexedDB Database Schema (`as_jewellar_db` v2)

The client maintains an IndexedDB database with 6 object stores:

| Object Store | Primary Key | Key Indexes | Description |
| :--- | :--- | :--- | :--- |
| `syncQueue` | `localTxId` | `syncStatus`, `createdTime`, `idempotencyKey` | Offline-queued transactions awaiting upload. |
| `customersStore` | `customerId` | `mobile`, `nameEn`, `status` | Cached recent customer records for offline lookup. |
| `pledgesStore` | `ticketNo` | `customerId`, `status`, `pledgeDate` | Cached recent pledge contracts. |
| `paymentsStore` | `paymentId` | `ticketNo`, `date` | Cached payment receipt history. |
| `ratesStore` | `date` | `isOverride` | Cached metal rate snapshots. |
| `conflictsStore` | `localTxId` | `serverTxId`, `quarantinedAt` | Quarantined conflicting transactions. |

---

## 4. Transaction Queue Item Structure

```json
{
  "localTxId": "TX-1788285975-XYZ",
  "idempotencyKey": "IDEMP-NEW_PLEDGE-1788285975-XYZ",
  "type": "NEW_PLEDGE",
  "createdTime": 1788285975000,
  "payload": { ... },
  "deviceId": "DEV-1788285368391-AG1RE",
  "syncStatus": "PENDING",
  "retryCount": 0,
  "errorMessage": null,
  "serverTxId": null
}
```

---

## 5. Five Synchronization Lifecycle States

1. `PENDING`: Transaction recorded offline, saved in IndexedDB, waiting for internet restoration.
2. `SYNCING`: Active network transmission in progress.
3. `SYNCED`: Server successfully processed payload and returned atomic ticket/receipt ID.
4. `FAILED`: Fatal payload error (e.g. invalid customer ID).
5. `CONFLICT`: Server state changed during offline period (e.g. pledge was redeemed on another terminal). Quarantined for admin review without silent overwriting.

---

## 6. Permanent Connectivity Badges

The top navigation header displays a live 4-state connectivity badge:
- `🟢 Online` (இணையத்தில் உள்ளது)
- `🟠 Offline (N Queued)` (ஆஃப்லைன் - N நிலுவையில்)
- `🔄 Syncing...` (ஒத்திசைக்கிறது...)
- `⚠️ Sync Error` (ஒத்திசைவு பிழை)
