# AS Jewellar Pawn Shop — Production Deployment & Setup Guide (SETUP.md)

This guide provides step-by-step instructions to set up, configure, and launch **AS Jewellar Pawn Shop** for production counter operations.

---

## 1. Prerequisites

- **Google Workspace or Standard Google Account** (Admin owner).
- **Modern Web Browser** (Google Chrome, Microsoft Edge, or Safari) with PWA support.
- **Hardware (Optional for Counter)**:
  - Thermal Receipt Printer (80mm ESC/POS or standard Windows printer driver).
  - USB / Wireless Barcode or QR Code Scanner (Standard HID keyboard mode).
  - Digital Precision Gold Scale (Serial/USB or manual counter input).
  - Web Camera / Document Camera for KYC and jewellery photographs.

---

## 2. Google Sheets Database Initialization

1. Create a new Google Spreadsheet in Google Drive:
   - Name: `AS Jewellar Pawn Shop - Database`
   - Copy the Spreadsheet ID from the URL:
     ```text
     https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID_HERE]/edit
     ```
2. Create the following **10 Sheets (Tabs)** with exact casing:
   - `Customers`
   - `Pledges`
   - `PledgeItems`
   - `Payments`
   - `Redemptions`
   - `Renewals`
   - `Expenses`
   - `CashLedger`
   - `CustomerDocuments`
   - `AuditLogs`
3. Enter the column header row for each tab as detailed in [`DATABASE.md`](DATABASE.md).

---

## 3. Google Apps Script Backend Deployment

1. Open Google Sheets &rarr; Click **Extensions** &rarr; **Apps Script**.
2. Rename the project to `AS Jewellar Pawn Shop API`.
3. Create the script files and paste code from the project's `backend/` directory:
   - `Code.gs` &larr; `backend/Code.js`
   - `DatabaseService.gs` &larr; `backend/DatabaseService.js`
   - `AuthService.gs` &larr; `backend/AuthService.js`
   - `RateService.gs` &larr; `backend/RateService.js`
   - `DocumentService.gs` &larr; `backend/DocumentService.js`
   - `AuditService.gs` &larr; `backend/AuditService.js`
   - `ResponseFormatter.gs` &larr; `backend/ResponseFormatter.js`
4. Configure **Script Properties**:
   - Click **Project Settings (Gear Icon)** &rarr; **Script Properties** &rarr; **Add script property**:
     | Property Key | Property Value |
     | :--- | :--- |
     | `SPREADSHEET_ID` | `[Your Google Spreadsheet ID]` |
     | `ADMIN_USERNAME` | `admin` |
     | `ADMIN_SALT` | `AS_JEWELLAR_SALT_2026_MDU` |
     | `ADMIN_PASSWORD_HASH`| SHA-256 hash of `[Your Admin Password]` + Salt |
     | `METALS_API_KEY` | `VKKOZ28293EWAJQNUPZH422QNUPZH` |
5. Deploy as Web App:
   - Click **Deploy** &rarr; **New deployment**.
   - Select type: **Web app**.
   - Description: `Production Release v1.0.0`.
   - Execute as: **Me (your Google account)**.
   - Who has access: **Anyone** (Requests are authenticated via SHA-256 JWT tokens).
   - Click **Deploy** &rarr; Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 4. Google Drive Folder Hierarchy

The application automatically creates and manages private document storage in your Google Drive under:
```text
AS Jewellar Pawn Shop/
├── Customers/
│   └── CUS-YYYY-XXXXXX/
│       ├── Profile/         (Customer photo, signature, thumb impression)
│       ├── KYC/             (Aadhaar, Voter ID, Ration card, PAN)
│       └── Pledges/
│           └── PLG-YYYY-XXXXXX/ (Pledge item photos, signed pawn tickets)
└── Backups/                 (Daily automated timestamped spreadsheet clones)
```

---

## 5. Frontend Counter Terminal Configuration

1. **Host Frontend**:
   - Deploy the repository to **GitHub Pages**, **Netlify**, **Cloudflare Pages**, or host locally on the shop counter PC via IIS, Nginx, or Python server.
2. **Configure API Endpoint**:
   - Open `http://localhost:8080/settings.html` (or your hosted domain).
   - In **Google Apps Script API Endpoint**, paste your deployed Web App URL.
   - Click **Test API Connection** to verify green `200 OK` status.
   - Click **Save Settings**.
3. **Install as Desktop / Tablet PWA**:
   - In Chrome / Edge, click the **Install App icon** in the address bar &rarr; Click **Install**.
   - The application now launches in standalone kiosk mode with instant offline support.

---

## 6. Shop Profile & Printer Setup

1. Open `settings.html`:
   - Set Pawnbroker Trade Name: `AS Jewellar Pawn Shop`
   - Set Tamil Trade Name: `ஏ.எஸ் ஜூவல்லர்ஸ்`
   - Set License No: `PB/MDU/2026/042`
   - Set Counter Address & Phone: `124, South Masi Street, Madurai - 625001 | Phone: 0452-2345678`
2. **Printer Configuration**:
   - **Form F Pawn Tickets**: Default printer to **A4 (Portrait)** or **80mm Thermal Receipt**.
   - Set browser print margins to `None` or `Minimum` with **Background graphics enabled**.
