# AS Jewellar Pawn Shop — Backup & Disaster Recovery Runbook (BACKUP-RESTORE.md)

This runbook documents the automated backup schedules, manual snapshot creation, and step-by-step point-in-time database restoration procedures for **AS Jewellar Pawn Shop**.

---

## 1. Backup Strategy Overview

| Backup Layer | Mechanism | Target Storage Location | Frequency / Retention |
| :--- | :--- | :--- | :--- |
| **Primary Spreadsheet Snapshot** | Google Drive file clone (`ssFile.makeCopy`) | `AS Jewellar Pawn Shop/Backups/` | Automated daily + Manual trigger / 90 Days retention |
| **Document Assets** | Google Drive version history & trash protection | `AS Jewellar Pawn Shop/Customers/` | Continuous real-time |
| **Local Offline Cache** | IndexedDB (`as_jewellar_db`) + localStorage | Counter Terminal Browser | Continuous local sync buffer |

---

## 2. Automated & Manual Backup Creation

### A. Manual Backup via Settings UI
1. Open `settings.html` (or click **Settings** in the sidebar).
2. Click **Create Backup Snapshot Now**.
3. The system generates a timestamped Google Drive clone:
   ```text
   BACKUP_AS_JEWELLAR_YYYY-MM-DDTHH-MM-SSZ
   ```
4. A green toast notification confirms the backup ID and location.

### B. Automated Daily Backup via Apps Script Trigger
To configure automated daily midnight backups:
1. Open Google Sheets &rarr; **Extensions** &rarr; **Apps Script**.
2. Click **Triggers (Clock Icon)** &rarr; **Add Trigger**.
3. Configure the trigger:
   - Choose which function to run: `handleDailyBackupTrigger` (or call `DatabaseService.createDailyBackup("CRON")`).
   - Select event source: **Time-driven**.
   - Select type of time based trigger: **Day timer** (e.g. 11 PM to Midnight).
   - Click **Save**.

---

## 3. Step-by-Step Disaster Recovery & Restore Procedure

In the event of accidental sheet corruption, row deletion, or disaster recovery:

### Step 1: Identify the Latest Valid Backup Snapshot
1. Open Google Drive &rarr; Navigate to `AS Jewellar Pawn Shop/Backups/`.
2. Locate the most recent valid backup file before the incident (e.g. `BACKUP_AS_JEWELLAR_2026-09-01T18-00-00Z`).

### Step 2: Open and Verify Backup Data
1. Double-click the backup file to open in Google Sheets.
2. Verify that all 10 tabs (`Customers`, `Pledges`, `PledgeItems`, `Payments`, `Redemptions`, `Renewals`, `Expenses`, `CashLedger`, `CustomerDocuments`, `AuditLogs`) are intact with accurate row counts.

### Step 3: Promote Backup to Production Database
1. Copy the Spreadsheet ID of the backup file from the browser URL:
   ```text
   https://docs.google.com/spreadsheets/d/[BACKUP_SPREADSHEET_ID]/edit
   ```
2. Open your Google Apps Script project (**Extensions** &rarr; **Apps Script**).
3. Click **Project Settings (Gear Icon)** &rarr; **Script Properties**.
4. Update the `SPREADSHEET_ID` property to the new `[BACKUP_SPREADSHEET_ID]`.
5. Click **Save script properties**.

### Step 4: Re-Deploy Web App
1. Click **Deploy** &rarr; **Manage deployments**.
2. Click the **Edit (Pencil Icon)** on your active deployment &rarr; Select **New version**.
3. Click **Deploy**.

### Step 5: Verify Counter Operation
1. Open `dashboard.html` on the counter PC.
2. Press `Ctrl + Shift + R` to reload and clear client cache.
3. Verify that the dashboard displays accurate live portfolio totals and customer search returns expected records.
4. Perform a test customer search to confirm database connectivity.
