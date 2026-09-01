# AS Jewellar Pawn Shop — Live Metal Rate System (RATE-SYSTEM.md)

This document describes the real-time gold and silver pricing engine, purity conversions, cached offline fallbacks, and manual admin override audit mechanics in **AS Jewellar Pawn Shop**.

---

## 1. Rate Architecture & API Integration

- **Live Market Feed**: Polled from `https://api.metals.dev/v1/latest?api_key=[KEY]&currency=INR&unit=g`.
- **Benchmark Source**: Grounded in India Bullion and Jewellers Association (IBJA) official market rates.
- **Conversion Formulas**:
  - Pure 24K Gold (Fine 999): Extracted directly from live API feed.
  - 22K (916 Hallmark Standard): Computed as:
    $$\text{Rate}_{\text{22K}} = \text{Rate}_{\text{24K}} \times \left(\frac{22}{24}\right) \times 0.999 = \text{Rate}_{\text{24K}} \times 0.9166$$
  - 18K Gold: Computed as $\text{Rate}_{\text{24K}} \times 0.750$.
  - Silver (Fine 999): Extracted directly per gram.

---

## 2. Offline Rate Caching & Network Resilience

When the counter computer is disconnected from the internet or the rate API is temporarily unreachable:
1. The system loads the **last validated rate snapshot** from local storage / IndexedDB.
2. The rate badge in the header and rate screen prominently flags the status:
   ```text
   [ ⚠️ CACHED (Offline) • 2026-09-01 10:00 AM ]
   ```
3. The system **never fabricates rates as live** when operating offline.
4. Counter operators are always aware if rates are historical.

---

## 3. Manual Rate Override & Audit Trail

In cases of sudden market spikes or custom shop pricing rules:
1. Authorized admins can click **Manual Rate Override (விலை திருத்தம்)** on `rates.html`.
2. Admin enters custom 24K, 22K, or Silver rates with an obligatory audit reason (e.g. *Morning MCX market surge adjustment*).
3. The system stamps the rate record with:
   - `isOverride: true`
   - `source: "MANUAL_OVERRIDE"`
   - `operator: "admin"`
   - `timestamp: [ISO 8601]`
4. An immutable event (`MANUAL_RATE_OVERRIDE`) is logged in the `AuditLogs` Google Sheets tab.
5. All new pledges booked during the override period record the exact rate snapshot in their contract terms.
