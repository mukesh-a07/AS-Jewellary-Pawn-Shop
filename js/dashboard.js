/**
 * AS JEWELLAR PAWN SHOP - OPERATIONAL DASHBOARD ENGINE
 * Consolidates daily counter metrics, portfolio risk health, operational alerts, and activity feed.
 */

class DashboardManager {
  constructor() {
    this.cacheKey = 'as_jewellar_dashboard_summary';
  }

  /**
   * Get Consolidated Operational Dashboard Summary
   */
  async getDashboardSummary() {
    // 1. Try Backend API first if online
    if (typeof navigator !== 'undefined' && navigator.onLine && window.api && typeof window.api.get === 'function') {
      try {
        const res = await window.api.get('getDashboardSummary');
        if (res && res.success && res.data) {
          const summary = this.computeLocalSummary(res.data);
          this.cacheSummary(summary);
          return summary;
        }
      } catch (e) {
        console.warn('Backend dashboard summary fetch fallback to local computation', e);
      }
    }

    // 2. Compute directly from local stores
    const localSummary = this.computeLocalSummary();
    this.cacheSummary(localSummary);
    return localSummary;
  }

  cacheSummary(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
      console.warn('Failed to cache dashboard summary', e);
    }
  }

  /**
   * Compute complete operational summary from pledges, payments, customers, and reminders
   */
  computeLocalSummary(backendData = null) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const payments = (window.paymentManager && window.paymentManager.payments) || [];
    const customers = (window.customerManager && window.customerManager.customers) || [];
    const rates = (window.rateManager && window.rateManager.activeRates) || { gold24k: 15958, gold22k: 14628, silver: 243.90 };

    // --- 1. TODAY'S COUNTER METRICS ---
    const todayPledges = pledges.filter(p => p.pledgeDate === todayStr);
    const todayPayments = payments.filter(p => p.date === todayStr && p.status === 'CONFIRMED');
    const todayRedemptions = pledges.filter(p => p.status === 'REDEEMED' && (p.redeemedAt || '').startsWith(todayStr));

    const todayLoansDisbursed = todayPledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);
    const todayTotalCollections = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const todayInterestCollected = todayPayments.reduce((sum, p) => sum + (Number(p.interestSettled) || 0), 0);

    // --- 2. ACTIVE PORTFOLIO & RISK HEALTH ---
    const activePledges = pledges.filter(p => p.status === 'ACTIVE' || p.status === 'DUE' || p.status === 'OVERDUE');
    const totalOutstandingPrincipal = activePledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);

    let totalInterestPending = 0;
    let dueTodayCount = 0;
    let due7DaysCount = 0;
    let overdueCount = 0;

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    activePledges.forEach(p => {
      // Calculate pending interest
      if (window.paymentManager) {
        const acc = window.paymentManager.calculateInterestAccrual(p);
        totalInterestPending += acc.netInterestDue;
      }

      // Check maturity status
      const maturity = new Date(p.maturityDate);
      if (p.maturityDate === todayStr) {
        dueTodayCount++;
      } else if (maturity > now && maturity <= sevenDaysFromNow) {
        due7DaysCount++;
      } else if (maturity < now) {
        overdueCount++;
      }
    });

    // --- 3. CRITICAL OPERATIONAL ALERTS ---
    const alerts = [];

    if (dueTodayCount > 0) {
      alerts.push({
        id: 'ALT-DUE-TODAY',
        type: 'DANGER',
        title: `${dueTodayCount} Pawn Loans Due Today (இன்று கெடு)`,
        desc: 'Borrowers have reached 1-year statutory maturity today. Action required.',
        link: 'reminders.html?filter=today',
        count: dueTodayCount
      });
    }

    if (due7DaysCount > 0) {
      alerts.push({
        id: 'ALT-DUE-7D',
        type: 'WARNING',
        title: `${due7DaysCount} Loans Maturing within Next 7 Days`,
        desc: 'Send WhatsApp reminder or phone call for upcoming maturity.',
        link: 'reminders.html?filter=7days',
        count: due7DaysCount
      });
    }

    if (overdueCount > 0) {
      alerts.push({
        id: 'ALT-OVERDUE',
        type: 'DANGER',
        title: `${overdueCount} Overdue Loans (> 12 Months)`,
        desc: 'Review for renewal or statutory auction notice preparation.',
        link: 'reminders.html?filter=overdue',
        count: overdueCount
      });
    }

    // Missing KYC Alert
    const missingKycCustomers = customers.filter(c => c.kycStatus === 'PENDING' || !c.idNumber);
    if (missingKycCustomers.length > 0) {
      alerts.push({
        id: 'ALT-MISSING-KYC',
        type: 'INFO',
        title: `${missingKycCustomers.length} Customers Missing KYC ID Proofs`,
        desc: 'Upload Aadhaar, Smart Card, or Voter ID proofs to complete profile.',
        link: 'customers.html?kyc=pending',
        count: missingKycCustomers.length
      });
    }

    // Offline queue alert
    if (window.offlineQueue && window.offlineQueue.getQueueCount && window.offlineQueue.getQueueCount() > 0) {
      const qCount = window.offlineQueue.getQueueCount();
      alerts.push({
        id: 'ALT-OFFLINE-QUEUE',
        type: 'WARNING',
        title: `${qCount} Offline Transactions Queued for Sync`,
        desc: 'Will automatically sync once internet connection is restored.',
        link: 'settings.html',
        count: qCount
      });
    }

    // --- 4. UNIFIED RECENT TRANSACTIONS FEED (Last 10) ---
    const recentActivity = [];

    // Pledges
    pledges.slice(0, 5).forEach(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      recentActivity.push({
        type: 'NEW_PLEDGE',
        title: `Pawn Ticket ${p.ticketNo}`,
        subtitle: `${cust ? cust.nameEn : p.customerId} &bull; ${p.totalNetWeight}g Net Gold`,
        amount: p.loanAmount,
        date: p.pledgeDate,
        timestamp: p.createdAt || p.pledgeDate,
        ticketNo: p.ticketNo,
        status: p.status,
        badgeClass: 'badge-gold'
      });
    });

    // Payments
    payments.slice(0, 5).forEach(pay => {
      const cust = customers.find(c => c.customerId === pay.customerId);
      recentActivity.push({
        type: 'PAYMENT',
        title: `Payment ${pay.paymentId}`,
        subtitle: `${cust ? cust.nameEn : pay.customerId} &bull; Ref: ${pay.ticketNo}`,
        amount: pay.amount,
        date: pay.date,
        timestamp: pay.date,
        receiptNo: pay.paymentId,
        ticketNo: pay.ticketNo,
        status: pay.paymentType,
        badgeClass: 'badge-success'
      });
    });

    // Sort by timestamp desc
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      today: {
        loansDisbursed: todayLoansDisbursed,
        totalCollections: todayTotalCollections,
        interestCollected: todayInterestCollected,
        newPledgesCount: todayPledges.length,
        redemptionsCount: todayRedemptions.length
      },
      portfolio: {
        activePledgesCount: activePledges.length,
        totalOutstandingPrincipal,
        totalInterestPending,
        dueTodayCount,
        due7DaysCount,
        overdueCount
      },
      alerts,
      recentActivity: recentActivity.slice(0, 8),
      ratesSnapshot: rates,
      updatedAt: new Date().toISOString()
    };
  }
}

// Global DashboardManager Instance
window.dashboardManager = new DashboardManager();
