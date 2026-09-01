# AS Jewellar Pawn Shop — Comprehensive Test Cases Catalog (TEST-CASES.md)

This document indexes all 283+ automated unit, integration, and UI test cases across all 13 module layers in **AS Jewellar Pawn Shop**.

---

## 1. Test Suite Summary Matrix

| Module / Layer | Test File | Test Count | Pass Rate |
| :--- | :--- | :---: | :---: |
| **01. Security & Reliability** | `scratch/test_security_reliability.js` | 21 | 100% |
| **02. Performance Benchmarks** | `scratch/benchmark_performance.js` | 6 | 100% |
| **03. Offline Sync Engine** | `scratch/test_offline_sync.js` | 14 | 100% |
| **04. Reports & Cash Day-Book**| `scratch/test_reports_cash.js` | 21 | 100% |
| **05. Vault & Safe Coordinates**| `scratch/test_vault_module.js` | 18 | 100% |
| **06. Dashboard & Reminders** | `scratch/test_dashboard_reminders.js` | 16 | 100% |
| **07. Renewal & Redemption** | `scratch/test_renewal_redemption.js` | 22 | 100% |
| **08. Payment & Interest Engine**| `scratch/test_payment_module.js` | 16 | 100% |
| **09. Billing & Form F Tickets**| `scratch/test_billing_module.js` | 28 | 100% |
| **10. New Pledge POS Counter** | `scratch/test_pledge_pos.js` | 23 | 100% |
| **11. Real Metal Rates Engine**| `scratch/test_rate_module.js` | 21 | 100% |
| **12. Document & KYC Storage** | `scratch/test_document_module.js` | 16 | 100% |
| **13. Customer Directory & PII**| `scratch/test_customer_module.js` | 16 | 100% |
| **14. HTTP Route Liveness** | `scratch/verify_routes.js` | 45 | 100% |
| **TOTAL** | — | **283** | **100%** |

---

## 2. Test Execution Command

To execute all unit and integration test suites sequentially:

```powershell
node scratch/test_security_reliability.js
node scratch/benchmark_performance.js
node scratch/test_offline_sync.js
node scratch/test_reports_cash.js
node scratch/test_vault_module.js
node scratch/test_dashboard_reminders.js
node scratch/test_renewal_redemption.js
node scratch/test_payment_module.js
node scratch/test_billing_module.js
node scratch/test_pledge_pos.js
node scratch/test_rate_module.js
node scratch/test_document_module.js
node scratch/test_customer_module.js
node scratch/verify_routes.js
```
