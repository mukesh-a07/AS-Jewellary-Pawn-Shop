# AS Jewellar Pawn Shop — Production Deployment Guide (DEPLOYMENT.md)

This guide provides step-by-step instructions for deploying **AS Jewellar Pawn Shop** to live counter production.

---

## 1. Google Cloud / Workspace Setup

1. **Create Google Spreadsheet Database**:
   - Create a Google Spreadsheet named `AS Jewellar Pawn Shop - Database`.
   - Create the 10 required tabs (`Customers`, `Pledges`, `PledgeItems`, `Payments`, `Redemptions`, `Renewals`, `Expenses`, `CashLedger`, `CustomerDocuments`, `AuditLogs`).
   - Paste column headers as specified in [`docs/DATABASE.md`](DATABASE.md).
2. **Deploy Google Apps Script API**:
   - Open **Extensions** &rarr; **Apps Script**.
   - Copy backend code from `backend/` into Apps Script files.
   - Configure **Script Properties**:
     - `SPREADSHEET_ID`: Your Google Spreadsheet ID.
     - `ADMIN_USERNAME`: `admin`
     - `ADMIN_SALT`: `AS_JEWELLAR_SALT_2026_MDU`
     - `ADMIN_PASSWORD_HASH`: SHA-256 hash of your admin password + salt.
     - `METALS_API_KEY`: `VKKOZ28293EWAJQNUPZH422QNUPZH`
   - Click **Deploy** &rarr; **New deployment** &rarr; **Web app** &rarr; Access: **Anyone** &rarr; Copy Web App URL.

---

## 2. Frontend Hosting Options

### Option A: Static Cloud Hosting (GitHub Pages / Netlify / Cloudflare Pages)
- Push repository to GitHub or upload build folder.
- Enable HTTPS (required for PWA Service Workers and Camera APIs).

### Option B: Local Counter PC Hosting (Windows IIS / Nginx / Python)
- Host folder locally on the shop counter PC.
- Configure local network IP (e.g. `http://192.168.1.100:8080`).

---

## 3. PWA Counter Installation

1. Open application in Google Chrome or Microsoft Edge.
2. Navigate to `settings.html` &rarr; Enter your deployed Google Apps Script URL &rarr; Click **Test API Connection** &rarr; Click **Save Settings**.
3. Click the **Install App icon** in the browser address bar.
4. The application installs as a standalone desktop/tablet kiosk app.
