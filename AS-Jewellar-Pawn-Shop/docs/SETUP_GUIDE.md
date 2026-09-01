# AS Jewellar Pawn Shop — Deployment & Setup Guide

This guide provides step-by-step instructions for deploying and configuring **AS Jewellar Pawn Shop** using Google Sheets, Google Drive, Google Apps Script, and static hosting (Vercel / Netlify / GitHub Pages).

---

## 1. Google Sheets Setup

1. Open [Google Sheets](https://sheets.new) and create a new spreadsheet named:  
   `AS-Jewellar-Database-Production`
2. Create the **18 required tabs** (see [`docs/DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md)):
   - `Users`
   - `Customers`
   - `CustomerDocuments`
   - `Pledges`
   - `PledgeItems`
   - `Payments`
   - `Renewals`
   - `Redemptions`
   - `InterestTransactions`
   - `Reminders`
   - `GoldRates`
   - `SilverRates`
   - `AuditLogs`
   - `Settings`
   - `SyncQueue`
   - `CashLedger`
   - `Expenses`
   - `Notifications`
3. In row 1 of each tab, paste the exact column headers specified in [`docs/DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md).
4. Copy the **Spreadsheet ID** from the browser URL:  
   `https://docs.google.com/spreadsheets/d/`**`[SPREADSHEET_ID]`**`/edit`

---

## 2. Google Drive Setup

1. Open [Google Drive](https://drive.google.com).
2. Create a top-level root folder named `AS-Jewellar`.
3. Inside `AS-Jewellar`, create a subfolder named `Customers`.
4. Copy the **Folder ID** of `AS-Jewellar` from the browser URL:  
   `https://drive.google.com/drive/folders/`**`[DRIVE_ROOT_FOLDER_ID]`**

> [!NOTE]
> Ensure the Google Drive folder permissions remain **Private (Restricted)**. Only the Google account running the Apps Script needs access.

---

## 3. Google Apps Script Backend Deployment

1. Open [Google Apps Script](https://script.google.com/home).
2. Click **New Project** and name it `AS-Jewellar-API`.
3. Create the corresponding `.gs` script files from the `backend/` directory:
   - `Code.js` &rarr; `Code.gs`
   - `AuthService.js` &rarr; `AuthService.gs`
   - `DatabaseService.js` &rarr; `DatabaseService.gs`
   - `ValidationService.js` &rarr; `ValidationService.gs`
   - `DocumentService.js` &rarr; `DocumentService.gs`
   - `AuditService.js` &rarr; `AuditService.gs`
   - `RateService.js` &rarr; `RateService.gs`
   - `ResponseFormatter.js` &rarr; `ResponseFormatter.gs`
4. Copy `backend/appsscript.json` into the Apps Script Project Settings manifest.
5. In Apps Script, navigate to **Project Settings (Gear Icon) &rarr; Script Properties** and add:

| Property | Value | Description |
| :--- | :--- | :--- |
| `SPREADSHEET_ID` | `[Your Spreadsheet ID]` | Google Sheets Database ID |
| `DRIVE_ROOT_FOLDER_ID` | `[Your Drive Folder ID]` | Google Drive Root Folder ID |
| `ADMIN_USERNAME` | `admin` | Admin login username |
| `ADMIN_SALT` | `AS_SALT_RANDOM_STRING_2026` | Random cryptographic salt |
| `ADMIN_PASSWORD_HASH` | `[SHA-256 Hash]` | (Optional) Hashed admin password |

6. Click **Deploy &rarr; New Deployment**:
   - **Select type**: Web App
   - **Description**: Production Web App v1
   - **Execute as**: Me (your Google account)
   - **Who has access**: Anyone
7. Click **Deploy**, authorize permissions, and copy the **Web App URL** (`https://script.google.com/macros/s/.../exec`).

---

## 4. Static Hosting Deployment (Vercel)

1. Push your repository to GitHub / GitLab.
2. In [Vercel](https://vercel.com):
   - Click **Add New Project** &rarr; Select your repository.
   - Framework Preset: **Other / Static HTML**.
   - Output Directory: `.` (Root directory).
   - Click **Deploy**.
3. Once deployed, open your site URL (e.g. `https://as-jewellar.vercel.app`).
4. Log in as admin (`admin` / `AS@2026`).
5. Open **Settings &bull; அமைப்புகள்** (`settings.html`) and paste your Apps Script Web App URL into the **Apps Script Deployment URL** field.
6. Click **Save Endpoint URL**.

---

## 5. Verification Checklist

- [x] **PWA Installability**: Open in Chrome on Android / Desktop and click "Install App" to add to home screen.
- [x] **Offline Test**: Switch network to Offline in DevTools and navigate between pages — the application shell loads instantly.
- [x] **Bilingual Switch**: Click `[ English ]` / `[ தமிழ் ]` and verify all labels change instantly and persist on reload.
- [x] **Counter POS UX**: Test adding items with Gross/Stone weights and verify automatic net weight and loan calculation.
