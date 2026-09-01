# AS Jewellar Pawn Shop — Statutory Business Rules & Policies (BUSINESS-RULES.md)

This document specifies the statutory lending rules, interest formulas, loan tenure limits, LTV ceilings, redemption verifications, and cash drawer balance equations enforced by **AS Jewellar Pawn Shop**.

---

## 1. Statutory Lending Rules (Tamil Nadu Pawnbrokers Act)

| Business Parameter | Statutory Rule | System Enforcement |
| :--- | :--- | :--- |
| **Maximum Loan-to-Value (LTV)** | Maximum **75.0%** of pure gold net weight market value | System blocks loans $> 75\%$ unless authorized admin explicitly checks "Allow High-LTV Override". |
| **Statutory Loan Tenure** | **12 Months** (1 Year) statutory maturity period | Maturity date is automatically computed as `Pledge Date + 12 Months`. |
| **Maximum Monthly Interest Rate** | **1.0% / month** (12.0% per annum simple interest) | Default counter interest rate is set to 1.0%; custom rates are audit-logged. |
| **Purity Standards** | 22K (916 Hallmark) / 24K Fine / 18K / 925 Silver | Pure net weight ($\text{Net} = \text{Gross} - \text{Stone}$) is calculated before valuation. |
| **No Automatic Auctioning** | Overdue loans must undergo manual review | Status transitions to `OVERDUE` or `AUCTION_REVIEW`; automated auction liquidation is prohibited. |

---

## 2. Mathematical Calculation Formulas

### A. Net Pure Weight
$$\text{Net Weight (g)} = \text{Gross Weight (g)} - \text{Stone Weight (g)}$$

### B. Estimated Market Valuation
$$\text{Market Value (₹)} = \text{Net Weight (g)} \times \text{Active Market Rate (₹/g)}$$

### C. Eligible Loan Ceiling (75% LTV)
$$\text{Eligible Loan (₹)} = \text{Market Value (₹)} \times 0.75$$

### D. Accrued Interest Calculation
$$\text{Accrued Interest (₹)} = \text{Principal} \times \left(\frac{\text{Monthly Rate}}{100}\right) \times \left(\frac{\text{Days Elapsed}}{30}\right) - \text{Past Interest Paid}$$

### E. Single-Drawer Cash Day-Book Reconciliation
$$\text{Expected Closing Cash} = \text{Opening Cash} + \text{Inflow Collections} - \text{Loans Disbursed} - \text{Shop Expenses}$$

---

## 3. Ten-Step Verified Pledge Redemption Protocol

To safeguard counter inventory and ensure complete compliance, redemption enforces a strict 10-step sequence:
1. Search active pledge ticket.
2. Verify customer identity against original KYC document record.
3. Verify original ticket number and security stamp.
4. Calculate outstanding principal and accrued interest dues.
5. Receive and record settlement payment (Cash/UPI).
6. Confirm payment transaction in ledger.
7. Mark pledge status as `REDEEMED`.
8. Locate physical packet in safe (`Vault A • Locker 03 • Tray 12 • PKT-0087`).
9. Verify jewellery articles with customer and release physical packet.
10. Update vault packet status to `VACANT` and print official Redemption Receipt.
