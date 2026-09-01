# AS Jewellar Pawn Shop — Backup & Disaster Recovery Runbook (BACKUP-RESTORE.md)

This runbook documents automated backup schedules, manual snapshot creation, and step-by-step point-in-time restoration procedures for **AS Jewellar Pawn Shop**.

---

## 1. Backup Strategy Overview

| Layer | Mechanism | Destination | Frequency |
| :--- | :--- | :--- | :--- |
| **Spreadsheet Database** | Google Drive clone snapshot (`ssFile.makeCopy`) | `AS Jewellar Pawn Shop/Backups/` | Automated daily + Manual triggers |
| **KYC & Document Scans** | Google Drive version history & trash protection | `AS Jewellar Pawn Shop/Customers/` | Real-time continuous |
| **Local Offline Buffer** | IndexedDB (`as_jewellar_db`) + localStorage | Counter PC browser storage | Continuous client cache |

---

## 2. Triggering Backups

- **Via UI**: Open `settings.html` &rarr; Click **Create Backup Snapshot Now**.
- **Via Automated Apps Script Trigger**: Set a daily time-driven trigger on function `handleDailyBackupTrigger` (e.g. midnight).

---

## 3. Step-by-Step Disaster Recovery & Restore

1. **Locate Snapshot**: Open Google Drive &rarr; `AS Jewellar Pawn Shop/Backups/` &rarr; Select latest valid file (e.g. `BACKUP_AS_JEWELLAR_2026-09-01T18-00-00Z`).
2. **Copy Spreadsheet ID**: Copy the ID from the URL (`https://docs.google.com/spreadsheets/d/[NEW_ID]/edit`).
3. **Update Apps Script**: In **Project Settings** &rarr; **Script Properties**, update `SPREADSHEET_ID` to `[NEW_ID]`.
4. **Re-Deploy Web App**: Click **Deploy** &rarr; **Manage deployments** &rarr; **New version** &rarr; **Deploy**.
5. **Verify Counter Operation**: Reload counter browser (`Ctrl + Shift + R`), verify customer directory and live portfolio totals.
