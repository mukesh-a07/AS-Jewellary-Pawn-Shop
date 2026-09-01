# AS Jewellar Pawn Shop — REST API Documentation (API.md)

This document describes the Google Apps Script REST-like API endpoints, request/response JSON contracts, authentication headers, error codes, and idempotency protocol.

---

## 1. Authentication & Base URL

- **Base URL**: `https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec`
- **Authentication**: Requests (except `health`, `login`, `getRates`, `getDashboardSummary`) require a valid session token passed via `token` query parameter or JSON body property.

---

## 2. API Response Standard Format

All API endpoints return JSON in the following standard envelope:

```json
{
  "success": true,
  "code": "OK",
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2026-09-01T18:06:15.000Z"
}
```

On error:
```json
{
  "success": false,
  "code": "INVALID_AMOUNT",
  "message": "Loan amount must be greater than 0",
  "timestamp": "2026-09-01T18:06:15.000Z"
}
```

---

## 3. Endpoints Reference

### Public Endpoints

#### `GET ?action=health`
Returns API service status and server time.
- **Response**:
  ```json
  {
    "status": "ONLINE",
    "shopName": "AS Jewellar Pawn Shop",
    "serverTime": "2026-09-01T18:06:15.000Z",
    "version": "1.0.0"
  }
  ```

#### `GET ?action=getRates`
Returns current 24K, 22K (916), and Silver market rates.
- **Response**:
  ```json
  {
    "gold24k": 15958.00,
    "gold22k": 14628.00,
    "silver": 243.90,
    "updatedAt": "2026-09-01T10:00:00.000Z",
    "source": "api.metals.dev (IBJA benchmark)"
  }
  ```

#### `GET ?action=getDashboardSummary`
Returns consolidated daily and portfolio KPIs (Cached in Google Apps Script memory for 5 minutes).
- **Response**:
  ```json
  {
    "today": {
      "loansDisbursed": 150000,
      "totalCollections": 4500,
      "interestCollected": 4500,
      "newPledgesCount": 1,
      "redemptionsCount": 0
    },
    "portfolio": {
      "activePledgesCount": 3,
      "totalOutstandingPrincipal": 225000,
      "dueTodayCount": 1,
      "due7DaysCount": 1,
      "overdueCount": 1
    },
    "ratesSnapshot": { "gold24k": 15958, "gold22k": 14628, "silver": 243.90 },
    "totalCustomersCount": 5
  }
  ```

#### `POST ?action=login`
Authenticates admin operator and returns session token.
- **Payload**:
  ```json
  { "username": "admin", "password": "yourpassword" }
  ```
- **Response**:
  ```json
  {
    "token": "AS_JWT_9b1deb4d_1788285975",
    "user": {
      "userId": "USR-2026-000001",
      "username": "admin",
      "fullName": "Shop Admin (முதன்மையாளர்)",
      "role": "ADMIN",
      "branch": "Main Branch"
    }
  }
  ```

---

### Protected Endpoints (Requires `token`)

#### `GET ?action=getCustomers&token=...`
Returns array of customer demographic objects.

#### `GET ?action=getCustomer&customerId=CUS-2026-000184&token=...`
Returns single customer profile details.

#### `GET ?action=checkDuplicate&mobile=9876543210&name=Murugan&token=...`
Checks for existing customer by 10-digit mobile or normalized name.

#### `POST ?action=createCustomer`
Registers a new customer.
- **Payload**:
  ```json
  {
    "nameEn": "R. Murugan",
    "nameTa": "ஆர். முருகன்",
    "fatherHusbandName": "M. Ramanathan",
    "gender": "MALE",
    "mobile": "9876543210",
    "address": "14/2, North Car Street",
    "townVillage": "Madurai Town",
    "district": "Madurai",
    "pincode": "625001",
    "idType": "AADHAAR",
    "idNumber": "8945-2314-4589"
  }
  ```

#### `POST ?action=createPledge`
Issues a new Pawn Ticket and registers pledged jewellery items.
- **Headers**:
  `Idempotency-Key: IDEMP-NEW_PLEDGE-1788285975-XYZ`
  `X-Device-ID: DEV-1788285368391-AG1RE`
- **Payload**:
  ```json
  {
    "customerId": "CUS-2026-000184",
    "loanAmount": 150000,
    "totalGrossWeight": 16.700,
    "totalStoneWeight": 0.200,
    "totalNetWeight": 16.500,
    "monthlyInterestRate": 1.0,
    "vaultLocation": "Vault A",
    "packetId": "PKT-0089",
    "lockerTray": "Locker 03 • Tray 12",
    "items": [
      {
        "category": "GOLD",
        "itemType": "Chain",
        "purity": "22K",
        "description": "22K Gold Rope Chain",
        "grossWeight": 12.500,
        "stoneWeight": 0.000,
        "netWeight": 12.500,
        "rateUsed": 14041.52,
        "estimatedValue": 175519,
        "eligibleLoan": 131639
      }
    ]
  }
  ```

#### `POST ?action=recordPayment`
Records full or partial payment / interest collection.
- **Payload**:
  ```json
  {
    "ticketNo": "PLG-2026-002341",
    "amount": 1500,
    "paymentType": "INTEREST_ONLY",
    "paymentMode": "CASH",
    "referenceNo": "CASH-CNTR-01",
    "principalSettled": 0,
    "interestSettled": 1500,
    "remainingPrincipal": 75000
  }
  ```

#### `POST ?action=renewPledge`
Extends loan tenure by 12 months, generates new ticket, links old ticket.

#### `POST ?action=redeemPledge`
Closes loan upon full payoff, releases jewellery packet, and locks financial record.

#### `POST ?action=recordExpense`
Records counter operational expense (`category`, `amount`, `paymentMethod`, `description`).

#### `POST ?action=createBackup`
Triggers immediate timestamped Google Drive backup snapshot.

#### `GET ?action=listBackups&token=...`
Lists all available backup snapshots in Drive.

#### `POST ?action=syncTransaction`
Offline Background Sync ingestion route. Accepts queued offline payloads with idempotency token validation.

---

## 4. Standard Error Codes Dictionary

| Code | HTTP Status | Meaning | Action / Resolution |
| :--- | :---: | :--- | :--- |
| `AUTH_REQUIRED` | 401 | Missing or expired session token | Redirect to `login.html` |
| `AUTH_FAILED` | 401 | Invalid username or password | Check admin credentials |
| `TOO_MANY_REQUESTS`| 429 | 5 consecutive failed logins | Wait for 5-minute cooldown timer |
| `CONFLICT` | 409 | Server state changed during offline queue | Quarantined in `conflictsStore` for admin review |
| `INVALID_MOBILE` | 400 | Mobile does not match `^[6-9]\d{9}$` | Enter valid 10-digit Indian phone |
| `INVALID_AMOUNT` | 400 | Loan or payment $\le 0$ | Enter positive financial amount |
| `INVALID_WEIGHT` | 400 | Gross weight $\le 0$ or stone $\ge$ gross | Check physical jewellery balance |
| `BACKUP_FAILED` | 500 | Google Drive storage / permission error | Verify Drive permissions in Apps Script |
