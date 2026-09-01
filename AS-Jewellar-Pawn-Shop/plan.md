AS Jewellar Pawn Shop — Complete Product Blueprint
1. Main objective

The system should handle the complete lifecycle:

Customer → KYC → New Pledge → Gold/Silver valuation → Loan calculation → Pawn Ticket → Payment → Interest collection → Renewal → Reminder → Redemption → Document storage → Reports → Auction management

And the operator should be able to perform most operations in under 30–60 seconds for a normal returning customer.

The central design principle should be:

Search customer → select/create pledge → calculate → save → print/send receipt.

Avoid complicated multi-page workflows.

2. Main modules

I would divide the application into these modules.

A. Dashboard

The home dashboard should immediately show:

Today's Overview

Today's new pledges
Today's redeemed pledges
Today's interest collections
Today's renewals
Today's cash received
Today's loan amount given
Outstanding principal
Outstanding interest
Due today
Due within 7 days
Overdue pledges
Auctions upcoming
Total active pledges
Live business cards

Example:

₹ 3,42,500
Today's Loan

₹ 18,750
Today's Interest

32
New Pledges

7
Redemptions

₹ 28,42,000
Outstanding Loans

Then:

Alerts

⚠ 8 pledges due today
⚠ 14 pledges overdue
⚠ 3 auction review required
⚠ 5 documents missing

This makes the dashboard operational instead of decorative.

3. Customer Management

This is one of the most important modules.

Customer profile

Store:

Customer ID
Customer name
Tamil name
Father's / husband's name
Date of birth
Gender
Mobile number
Alternate mobile
Address
Village / Town
District
PIN code
ID type
ID number
Occupation
Customer photo
Signature
Thumb impression
KYC documents
Notes
Created date
Last transaction
Total active pledges
Total loan history
Total repayments
Risk / internal notes
Customer search

Search using:

Customer ID
Mobile number
Name
Tamil name
Pawn ticket number
Aadhaar last 4 digits / permitted identifier
Document number
Pledge number

Don't require staff to know the exact customer name.

For example:

Search Customer
[ 9876543210________________ ]

Results

CUST-000184
R. Murugan
9876543210
12 Active Pledges
₹1,85,000 Outstanding
4. Customer 360° profile

When opening a customer, show everything on one screen.

Header
R. MURUGAN
Customer ID: CUST-000184
📞 98765 XXXXX

Then tabs:

Overview
Pledges
Payments
Documents
Reminders
History
Notes
Financial summary
Total Pledged       ₹4,82,000
Total Redeemed      ₹2,97,000
Current Outstanding ₹1,85,000
Interest Pending    ₹18,500
Active Pledges      12

This is extremely useful for repeat customers.

5. New Pawn / Pledge module

This is the core POS screen.

Step 1 — Customer
Existing Customer
[ Search customer ]

OR

+ New Customer
Step 2 — Item details

For jewellery:

Category
Item type
Item description
Gross weight
Stone weight
Net weight
Purity
Karat
Gold rate
Making/valuation adjustment
Estimated market value
Loan percentage
Eligible loan
Approved loan

Example:

Item:
Gold Chain

Gross Weight:
12.850 g

Stone Weight:
0.350 g

Net Gold Weight:
12.500 g

Purity:
22K

Rate:
₹____ / gram

Estimated Value:
₹____

Loan %:
____ %

Loan Amount:
₹____
Item categories

Tamil Nadu-focused jewellery categories:

Chain
Ring
Earrings
Bangle
Necklace
Thali / Mangalyam
Coin
Bracelet
Nose stud
Anklet
Silver articles
Silver utensils
Other jewellery
Mixed items
6. Multiple items in one pledge

Very important.

A customer should be able to pledge multiple jewellery items under one ticket.

Example:

Pledge #P-2026-002341

1. Gold Chain       18.25g
2. Gold Ring          4.12g
3. Gold Bangle      22.70g
4. Gold Earrings      6.42g

Total Net Weight: 51.49g

Loan Approved:
₹2,15,000

This is much better than forcing one pledge per item.

7. Interest Engine

Do not manually calculate interest.

Create a configurable interest engine.

Settings:

Interest Type:
Monthly / Daily / Custom

Interest Rate:
____ %

Grace Period:
____ days

Renewal Fee:
₹____

Other permitted charges:
₹____

It should calculate:

Principal
+
Accrued Interest
+
Permitted Charges
-
Payments
=
Outstanding

Because the applicable rate can depend on current Tamil Nadu rules/notifications, the rate should be an admin-configurable policy value, not buried inside JavaScript. The Act says the permissible rate is fixed by the State Government by notification and sets an upper statutory framework.

8. Interest calculation examples

The staff should see the calculation clearly.

Principal                  ₹50,000
Interest Rate              1% / month
Pledge Date                10-Jul-2026
Payment Date               10-Aug-2026

Interest                   ₹500

Amount Payable             ₹50,500

For partial payment:

Principal          ₹50,000
Interest           ₹500
Paid               ₹20,000
----------------------------
Balance            ₹30,500

Every calculation should leave an audit trail.

9. Pawn Ticket / Bill

The system should generate a professional printable pawn ticket.

It should contain:

AS Jewellar Pawn Shop

Shop details:

Shop name
Address
Phone
WhatsApp
Licence details where applicable
GST details if applicable
Logo

Then:

PAWN TICKET
Ticket No: P-2026-002341
Date: 29-Aug-2026

Customer:
R. Murugan

Address:
...

Mobile:
...

Items:
Gold Chain – 12.500g – 22K
Gold Ring – 4.120g – 22K

Loan Amount:
₹75,000

Interest:
____

Redemption Date:
____

Include:

Customer signature
Staff signature
Terms
QR code
Ticket number
Transaction ID

The Tamil Nadu Act specifically requires a pawn-ticket in the prescribed form/language requirements, so the final production template should be reviewed against the applicable prescribed format.

10. Bilingual system

Use:

English | தமிழ்

Example:

Customer Name
வாடிக்கையாளர் பெயர்

Loan Amount
கடன் தொகை

Interest
வட்டி

Redeem
மீட்பு

Pawn Ticket
அடகு சீட்டு

Payment
பணம் செலுத்துதல்

The language switch should be available globally:

[ EN ] [ தமிழ் ]

Important:

Don't translate only the UI.

The following should also support Tamil:

Receipt
Pawn ticket
Customer information
Notices
Reminders
WhatsApp messages
Print documents
Terms
Dashboard labels

The Act itself refers to prescribed pawn-ticket information being provided in English and the applicable language of the locality.

11. Gold & Silver Live Rate

This can become a major feature.

Dashboard:

TODAY'S RATE

Gold 24K
₹12,XXX / g

Gold 22K
₹XX,XXX / g

Silver
₹XXX / g

Add:

Updated:
10:32 AM

Source:
Configured Rate Provider
Important architecture

Don't put the rate API directly into the browser.

Use:

Gold API
   ↓
Google Apps Script
   ↓
Cache latest valid rate
   ↓
Frontend

Advantages:

API key protection
reduced API calls
faster loading
central validation
historical rates
fallback if provider is unavailable
Rate history

Store:

Date
Time
24K Rate
22K Rate
Silver Rate
Source
Entered By
Manual override

Essential for a real shop.

☑ Live rate
☐ Manual shop rate

Only authorized users can manually override rates.

12. Offline-first capability

This is a very good requirement.

But localStorage alone isn't enough for a reliable offline POS.

Use:

IndexedDB

for temporary structured offline data.

localStorage

for small settings:

Language
Last selected shop
UI preferences
cached settings
authentication state references
Service Worker

Cache:

HTML
CSS
JS
icons
logos
common translations

So the POS can still open without internet.

13. Offline transaction queue

This is one of the most important advanced features.

Suppose internet disappears while taking a pledge.

The staff should not lose everything.

Display:

🟠 Offline Mode

Transactions will sync automatically when
internet connection is restored.

Store locally:

TXN-LOCAL-001
Customer
Pledge
Items
Loan
Interest
Timestamp
Operator

When internet returns:

Internet Connected

Syncing...

✓ 3 transactions uploaded
✓ 2 payments uploaded
✓ 4 customer updates uploaded
Conflict protection

Every transaction should have:

local_transaction_id
server_transaction_id
created_at
device_id
sync_status

This prevents duplicate transactions.

14. Cloud document storage

For customer documents:

Google Drive can be the initial cloud document store.

Structure:

AS-Jewellar/
   Customers/
      CUST-000184/
          Profile/
          KYC/
          Pledges/
              P-2026-002341/
                  Pawn-Ticket.pdf
                  Customer-ID.pdf
                  Item-Photos/
                  Signature.png
                  Receipt.pdf

The Sheets database stores metadata:

document_id
customer_id
pledge_id
document_type
file_name
drive_file_id
drive_url
uploaded_by
uploaded_at
Don't store binary files inside Google Sheets.

Sheets should store metadata and references.

15. Document management

Customer documents could include:

ID proof
Address proof
Customer photo
Signature
Thumb impression
Pledge item photographs
Pawn ticket
Payment receipt
Redemption receipt
Other supporting document

Allow:

📷 Camera
📁 Upload
📄 PDF

The staff should see:

Documents

✓ Customer Photo
✓ ID Proof
✓ Signature
✓ Pledge Photo
⚠ Address Proof Missing
16. Jewellery photographs

Highly recommended.

At pledge creation:

ITEM PHOTOS

[ Front ]
[ Back ]
[ Side ]
[ Stamp / hallmark ]
[ Special identification ]

Each image should automatically associate with:

Customer
Pledge
Item
Date
Staff

Optionally add a watermark:

AS JEWELLAR PAWN SHOP
P-2026-002341
29-Aug-2026

This provides stronger operational evidence.

17. Secure login

Don't make one shared username/password for everybody.

Use roles.

Admin

Everything.

Manager

Reports + approvals + selected settings.

Staff

Customer + pawn + payments.

Cashier

Payments + receipts.

Auditor / Viewer

Read-only.

18. Login security

The backend must verify permissions—not just hide buttons in JavaScript.

Use:

User ID
Password
Role
Status
Last Login
Device

Recommended:

Password hashing
Session/token system
Short-lived sessions
Login expiry
Failed login protection
Account lockout
Logout
Session revocation
Audit logs

Never store plain-text passwords in Google Sheets.

19. Audit log

This is essential for a financial system.

Record:

Who
What
When
Before
After
Device
Transaction

Example:

29-Aug-2026 10:23

Staff:
EMP-004

Action:
Interest rate changed

Before:
1.00%

After:
1.10%

Approved by:
ADMIN-001

Also log:

New pledge
Loan changes
Interest changes
Payment
Redemption
Customer modification
Document deletion
Rate changes
User creation
Permission changes
Ticket reprint
20. Payment module

Support:

Cash
UPI
Bank transfer
Card

Depending on what the business actually accepts.

For each payment:

Payment ID
Pledge ID
Customer ID
Amount
Payment Type
Reference No.
Date
Time
Staff

UPI:

UPI Transaction ID
21. Partial payment

Must be supported.

Example:

Outstanding:
₹62,850

Customer Pays:
₹20,000

Remaining:
₹42,850

The system should clearly indicate how the amount is allocated according to the configured accounting rules.

22. Renewal

Very important for pawn shops.

Button:

RENEW PLEDGE

Show:

Previous pledge
Principal
Accrued interest
Renewal date
New maturity date
Payment
Outstanding

Generate new renewal receipt without destroying the original history.

23. Redemption

When customer fully closes the pledge:

REDEEM PLEDGE

Principal       ₹50,000
Interest        ₹2,500
Charges         ₹___
Paid            ₹52,500

Then:

✓ Payment received
✓ Pledge redeemed
✓ Item released
✓ Transaction locked

The system should never simply delete the pledge.

Status becomes:

REDEEMED

History remains permanent.

24. Reminder system

Create automatic reminders for:

Maturity date
Interest due
Overdue
Renewal
Auction review
Document missing
Payment follow-up

Dashboard:

Today
8 Customers

Tomorrow
12 Customers

Next 7 Days
37 Customers
25. WhatsApp-ready reminders

This would be highly useful in Tamil Nadu.

Example:

வணக்கம் Murugan அவர்களுக்கு,
AS Jewellar Pawn Shop-ல் உள்ள உங்கள் அடகு சீட்டு எண் P-2026-002341 தொடர்பான கட்டண / காலக்கெடு நினைவூட்டல்.

Then:

Customer Name
Ticket No.
Due Date
Outstanding Amount
Shop Contact

For privacy/security, avoid putting unnecessary sensitive ID details into messages.

26. Reports

This system should have serious reporting.

Daily
Daily collection
New pledge
Redemption
Interest
Cash
UPI
Outstanding
Monthly
Total loans
Total interest
New customers
Redemptions
Renewals
Overdue
Auction pipeline
Customer
Customer statement
Pledge history
Outstanding
Jewellery
Gold pledged
Silver pledged
Total weight
Purity breakdown
Financial
Opening cash
+ Collections
+ Other income
- Loans given
- Expenses
= Closing cash
27. Cash management

Add a dedicated cash module.

Opening Cash
₹25,000
Transactions
Loan given          -₹50,000
Interest received    +₹4,000
Redemption received +₹20,000
Expense              -₹2,500
Closing
Expected:
₹46,500

Actual:
₹46,000

Difference:
-₹500

Then require manager acknowledgement.

28. Expense management

Add:

Rent
Electricity
Salary
Transport
Stationery
Repairs
Other

This provides a basic shop profit picture.

29. Auction management

This should be a separate controlled module.

Statuses:

ACTIVE
DUE
OVERDUE
RENEWAL
AUCTION REVIEW
AUCTION READY
AUCTIONED
REDEEMED
CLOSED

Never automatically auction simply because a date has passed.

The system should provide a review/approval workflow consistent with applicable law and the shop's authorized process.

The Tamil Nadu Act contains specific requirements around disposal by public auction and surplus proceeds, so this area deserves particularly careful production validation with the shop's legal/compliance advisor.

30. Inventory / Pledge locker tracking

Excellent feature for reliability.

Track:

Vault
Locker
Tray
Packet
Position

Example:

P-2026-002341

Vault: A
Locker: 03
Tray: 12
Packet: 0087

Status:

IN VAULT
OUT FOR VERIFICATION
RELEASED
AUCTION

This is much safer than only recording "item is in the shop".

31. Packet QR code

Each pledge packet gets a QR code.

Staff scans:

📷 Scan QR

→ P-2026-002341
→ Customer
→ Items
→ Weight
→ Loan
→ Status
→ Vault location

This can dramatically improve counter operations.

32. Document verification workflow

For sensitive operations:

New pledge
KYC ✓
Customer ✓
Item photo ✓
Weight ✓
Loan approved ✓
Pawn ticket ✓
Redemption
Customer verified ✓
Ticket verified ✓
Payment complete ✓
Vault item verified ✓
Release authorized ✓

This gives staff a checklist rather than relying on memory.

33. Staff approval workflow

For larger loans:

Staff creates pledge
       ↓
Manager reviews
       ↓
Approved
       ↓
Payment
       ↓
Pawn ticket issued

Set approval thresholds:

₹0 – ₹50,000       Staff
₹50,001 – ₹2L      Manager
₹2L+               Admin

These should be configurable.

34. Dashboard analytics

Use charts sparingly.

Useful charts:

Loan activity

Last 7 Days
Mon █████
Tue ███████
Wed ████
Thu █████████
...

Outstanding by category

Gold
Silver
Other

Collection mix

Cash
UPI
Bank

Don't turn the dashboard into a colourful BI application. Staff need speed.

35. Global search

This should be available everywhere.

Keyboard shortcut:

Ctrl + K

Search:

Customer
Mobile
Pawn No.
Receipt No.
Payment
Document

Result:

P-2026-002341
R. Murugan
₹75,000
Active
Due: 29-Sep-2026
36. Notifications

Use a notification center:

🔔 17

8 Due Today
5 Missing Documents
2 Approval Requests
2 Sync Warnings

Clicking notification takes the user directly to the relevant record.

37. System health monitor

Since you're using Google Apps Script + Sheets, this is especially important.

Admin page:

SYSTEM HEALTH

Backend API          🟢 Online
Google Sheets        🟢 Connected
Google Drive         🟢 Connected
Rate Provider        🟢 Connected
Sync Queue           🟢 Normal
Last Backup          🟢 11:30 PM

If something fails:

🔴 Google Drive unavailable

This prevents staff discovering problems only after a transaction fails.

38. Automatic backup

This is critical with Google Sheets.

Schedule Apps Script backups:

Daily
Weekly
Monthly

Backup:

Database sheets
Configuration
Transaction logs
Audit logs

Never rely on one spreadsheet as the only copy of critical business data.

39. Database design

I recommend separate Google Sheets tabs, rather than one massive sheet.

Core
Users
Roles
Customers
CustomerDocuments
CustomerNotes
Pledges
PledgeItems
Payments
InterestTransactions
Renewals
Redemptions
Operations
VaultLocations
PledgePackets
Reminders
Notifications
Approvals
Expenses
CashLedger
System
GoldRates
SilverRates
Settings
AuditLogs
SyncQueue
Documents
APILogs
Backups
Reporting
DailySummary
MonthlySummary
40. Important database IDs

Never rely on row numbers.

Use unique IDs:

CUS-2026-000001
PLG-2026-000001
PAY-2026-000001
DOC-2026-000001
REC-2026-000001
USR-2026-000001
AUD-2026-000001

This is essential for future migration to SQL/Supabase.

41. Google Apps Script API structure

Don't create one huge doPost() function.

Structure:

/api
    auth
    customer
    pledge
    payment
    interest
    redemption
    renewal
    documents
    rates
    reports
    reminders
    users
    audit
    system

Conceptually:

Frontend
   ↓
API Router
   ↓
Authentication
   ↓
Authorization
   ↓
Validation
   ↓
Business Logic
   ↓
Google Sheets / Drive
42. Security architecture

A very important warning for this project:

Do not treat Google Sheets as a security boundary.

Frontend should never directly access sensitive Sheets data.

Use:

Browser
   ↓
HTTPS
   ↓
Apps Script API
   ↓
Authentication
   ↓
Role check
   ↓
Validation
   ↓
Sheets / Drive

Sensitive documents should not be publicly accessible links.

43. Frontend architecture

I recommend:

AS-Jewellar/
│
├── index.html
├── login.html
│
├── dashboard.html
├── customers.html
├── customer.html
├── new-pledge.html
├── pledges.html
├── payments.html
├── redemption.html
├── renewal.html
├── reminders.html
├── reports.html
├── rates.html
├── documents.html
├── users.html
├── settings.html
│
├── assets/
│   ├── logo/
│   ├── icons/
│   └── fonts/
│
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── api.js
│   ├── customers.js
│   ├── pledges.js
│   ├── payments.js
│   ├── rates.js
│   ├── documents.js
│   ├── offline.js
│   ├── sync.js
│   ├── i18n.js
│   └── validation.js
│
└── sw.js
44. UI/UX design direction

For a pawn shop system, I would not use a flashy SaaS dashboard.

Use:

Professional jewellery-business aesthetic
clean white/cream background
gold accent
dark charcoal typography
clear green success
red warnings
large buttons
strong contrast
compact tables
large touch targets
minimal animations
Desktop
┌──────────────┬─────────────────────────────┐
│              │                             │
│ AS JEWELLAR  │ Dashboard                   │
│              │                             │
│ Dashboard    │ KPI Cards                  │
│ Customers    │                             │
│ New Pledge   │ Due / Alerts               │
│ Pledges      │                             │
│ Payments     │ Recent Transactions        │
│ Redemption   │                             │
│ Reports      │                             │
│              │                             │
└──────────────┴─────────────────────────────┘
Mobile

Bottom navigation:

Home
Customers
+ Pledge
Payments
More

The + Pledge button should be prominent.

45. Mobile-first counter mode

A staff member standing at the counter should be able to use the phone/tablet.

Large controls:

+ NEW PLEDGE

SCAN CUSTOMER

SCAN PLEDGE

COLLECT PAYMENT

REDEEM

Don't force staff to use tiny desktop tables on a phone.

46. Receipt printing

Support:

A4

For official documentation.

80mm thermal printer

For counter receipt.

PDF

For digital sharing.

The print engine should use one transaction data source and generate different layouts.

47. Numbering system

Configurable format:

AS/PLG/2026/000001
AS/PAY/2026/000001
AS/RED/2026/000001

Don't use simple row number as the public ticket number.

48. Customer privacy

Especially because you're storing identification documents:

Implement:

minimal required data collection
access restrictions
protected Drive folders
no public document URLs
audit logging
controlled document deletion
backup
restricted staff access

Also design the system to comply with applicable Indian privacy/data-protection obligations and the shop's documented retention policy.

49. Reliability features

These are more important than visual animations.

Every transaction should have:
Created
Validated
Saved
Confirmed

Example:

Saving...

✓ Customer saved
✓ Pledge saved
✓ Payment saved
✓ Pawn ticket generated

Transaction:
PLG-2026-000231

Never show "Success" before the server confirms the save.

50. Duplicate protection

A double click must not create two loans.

Use:

idempotency_key

Example:

IDEMP-7A83...

Backend checks whether it has already processed that transaction.

This is especially important in slow network conditions.

51. Loading performance

Given your previous concern about slow systems, build this one with performance as a first-class requirement.

Don't load all customers.

Use:

Search → server query → results
Don't load all documents.

Load them only when customer opens documents.

Don't fetch dashboard data one API call at a time.

Use one dashboard endpoint:

getDashboardSummary()

returning:

today
outstanding
due
overdue
collections
recent_transactions
alerts
rates
Cache

Cache:

translations
settings
shop details
logo
gold rate
recent customer searches
52. Data fetching model

Bad:

Dashboard opens
→ API 1
→ API 2
→ API 3
→ API 4
→ API 5
→ API 6

Better:

Dashboard
    ↓
single dashboard API
    ↓
parallel server-side reads
    ↓
single JSON response

This will make the application feel significantly faster.

53. Search performance

Google Sheets is fine initially, but don't scan the complete sheet for every request.

Maintain lookup-friendly data.

For example:

CustomerIndex

with:

customer_id
name_normalized
mobile_normalized
ticket_numbers

The API can return only the necessary rows.

54. Future migration architecture

Even though we're starting with Google Sheets, design the system so the frontend doesn't know the database.

Frontend
   ↓
API
   ↓
Repository Layer
   ↓
Google Sheets

Later:

Frontend
   ↓
API
   ↓
Repository Layer
   ↓
Supabase/PostgreSQL

Then the frontend doesn't need a complete rewrite.

This is the most important architectural choice if you expect AS Jewellar Pawn Shop to grow.

55. Recommended future upgrades

After the stable version:

Phase 2
WhatsApp integration
SMS
automated payment reminders
advanced reports
thermal printer integration
barcode scanner
QR scanning
customer self-service status page
Phase 3
Multi-branch support
Central admin
branch-wise reports
staff performance
consolidated accounts
Phase 4

Move database:

Google Sheets
       ↓
Supabase PostgreSQL

Keep Google Drive for documents or migrate to Supabase Storage.

56. Tamil Nadu-specific UX ideas

I would include several local-business conveniences.

Customer names

Store both:

English Name
தமிழ் பெயர்
Address

Provide:

District
Taluk
Village / Town
PIN
Common jewellery terminology

Allow Tamil staff terminology alongside English labels.

Phone-first customer identification

Many repeat customers can be found instantly by mobile number.

Aadhaar/document handling

Keep only what the business actually needs and implement access control rather than exposing identifiers everywhere.

Pawn ticket

Design the print workflow around English + Tamil.

57. Special customer situations

Build support for:

Lost pawn ticket

Workflow:

Customer verification
→ Lost ticket declaration
→ Staff approval
→ Manager approval
→ Redeem/reissue process
Authorised representative

Support:

Owner
Representative
Relationship
Verification
Customer claims ownership

Flag for manual verification.

The Tamil Nadu Act and Rules have prescribed documentation around lost pawn tickets, owner claims, receipts and related records, so these shouldn't be implemented as simple "delete/change" actions.

58. System settings

Admin should control:

Shop details
Logo
Address
Phone
WhatsApp
Language
Interest settings
Loan rules
Number format
Receipt format
Notification settings
User roles
Rate provider
Business hours
Reminder rules
Backup schedule
59. Admin configuration

Avoid hard coding business rules into JavaScript.

For example:

Interest Rate = Settings
Loan-to-value = Settings
Reminder days = Settings
Approval threshold = Settings

This means the shop can change policy without rewriting the application.

60. Development phases

I recommend 9 phases, rather than attempting everything in one huge Antigravity/Codex prompt.

Phase 0 — Foundation

Build:

project structure
UI design system
bilingual architecture
PWA
authentication architecture
API architecture
database schema
security foundation
logging foundation

Do not build business transactions yet.

Phase 1 — Login + Users

Build:

login
logout
sessions
users
roles
permissions
staff profile
audit log

Test security before continuing.

Phase 2 — Customer Management

Build:

customer CRUD
search
customer profile
photo
KYC
documents
notes
customer history

This becomes the foundation of every later transaction.

Phase 3 — Pawn/Pledge POS

Build:

new pledge
multiple items
weight
purity
valuation
loan amount
interest
pawn ticket
photographs
QR code
vault location

This should become the fastest screen in the entire system.

Phase 4 — Payments + Interest

Build:

payment
partial payment
interest
renewal
receipts
cash/UPI
payment history
outstanding balance
Phase 5 — Redemption + Reminders

Build:

redemption
verification
item release
reminder engine
due
overdue
renewal alerts
WhatsApp-ready messages
Phase 6 — Rates + Offline

Build:

gold rate
silver rate
rate history
manual override
IndexedDB
service worker
offline mode
sync queue
conflict protection
Phase 7 — Reports + Operations

Build:

daily reports
monthly reports
cash book
expenses
outstanding
collection
gold/silver weight
staff reports
audit reports
export
Phase 8 — Security + Production Hardening

Perform:

penetration-style review
authorization testing
duplicate transaction tests
offline sync tests
backup tests
document access testing
audit verification
API error testing
slow-network testing
mobile testing
printer testing

Only after this should you launch to real customers.

61. Suggested MVP

Don't launch with everything.

The first production MVP should contain:

✓ Login
✓ Dashboard
✓ Customers
✓ KYC/Documents
✓ New Pledge
✓ Multiple Jewellery Items
✓ Gold/Silver Rate
✓ Interest Calculation
✓ Pawn Ticket
✓ Payments
✓ Redemption
✓ Renewal
✓ Reminders
✓ Reports
✓ Audit Log
✓ Bilingual UI
✓ Offline Queue
✓ Cloud Documents
✓ Backup