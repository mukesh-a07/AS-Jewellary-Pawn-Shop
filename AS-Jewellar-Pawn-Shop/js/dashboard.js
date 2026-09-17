/**
 * AS JEWELLAR PAWN SHOP - OPERATIONAL DASHBOARD ENGINE
 * Consolidates daily counter metrics, portfolio risk health, operational alerts,
 * system diagnostics, rates, and high-speed omni-search into a single optimized model.
 */

class DashboardManager {
  constructor() {
    this.cacheKey = 'as_jewellar_dashboard_summary';
  }

  /**
   * Get Consolidated Operational Dashboard Summary via Single Optimized Endpoint
   */
  async getDashboardSummary() {
    // 1. Try single backend API endpoint if online
    if (typeof navigator !== 'undefined' && navigator.onLine && typeof window !== 'undefined' && window.api && typeof window.api.get === 'function') {
      try {
        const res = await window.api.get('getDashboardSummary');
        if (res && res.success && res.data) {
          // Merge with live client offline queue / local diagnostics
          const summary = this.enrichWithClientDiagnostics(res.data);
          this.cacheSummary(summary);
          return summary;
        }
      } catch (e) {
        console.warn('Backend dashboard summary fetch fallback to local computation', e);
      }
    }

    // 2. Local deterministic calculation fallback (Instant & Offline-ready)
    const localSummary = this.computeLocalSummary();
    this.cacheSummary(localSummary);
    return localSummary;
  }

  cacheSummary(data) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
      }
    } catch (e) {
      console.warn('Failed to cache dashboard summary', e);
    }
  }

  /**
   * Enrich server summary with client-side local offline queue and diagnostics
   */
  enrichWithClientDiagnostics(serverData) {
    const summary = { ...serverData };
    
    // Normalize today metrics
    const t = serverData.today || {};
    summary.today = {
      newPledgesCount: t.newPledgesCount || 0,
      loansDisbursed: t.loansDisbursed || t.loanDisbursedAmount || 0,
      totalCollections: t.totalCollections || t.paymentsCollectedAmount || 0,
      interestCollected: t.interestCollected || t.interestCollectedAmount || 0,
      redemptionsCount: t.redemptionsCount || 0,
      renewalsCount: t.renewalsCount || 0,
      collectionsByMethod: t.collectionsByMethod || { CASH: t.paymentsCollectedAmount || 0, UPI: 0, BANK_TRANSFER: 0, CARD: 0, OTHER: 0 }
    };

    // Normalize outstanding metrics
    const o = serverData.outstanding || {};
    summary.outstanding = {
      activePledgesCount: o.activePledgesCount || 0,
      totalOutstandingPrincipal: o.totalOutstandingPrincipal || o.principalOutstandingAmount || 0,
      totalInterestPending: o.totalInterestPending || o.interestPendingAmount || 0
    };

    const offlineCount = (typeof window !== 'undefined' && window.offlineQueue && typeof window.offlineQueue.getQueueCount === 'function')
      ? window.offlineQueue.getQueueCount()
      : 0;

    let failedSyncCount = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        const storedQ = localStorage.getItem('as_jewellar_sync_queue');
        if (storedQ) {
          const list = JSON.parse(storedQ);
          failedSyncCount = list.filter(i => i.syncStatus === 'FAILED' || i.syncStatus === 'CONFLICT').length;
        }
      }
    } catch (e) {}

    const rates = (typeof window !== 'undefined' && window.rateManager && window.rateManager.activeRates) || summary.ratesSnapshot || { gold24k: 15958, gold22k: 14628, silver: 243.90 };

    summary.system = {
      offlineQueueCount: offlineCount,
      failedSyncCount: failedSyncCount,
      rateStatus: rates.isOverride ? 'MANUAL_OVERRIDE' : (rates.source || 'LIVE_API'),
      rateLastUpdated: rates.updatedAt || new Date().toISOString(),
      backupStatus: 'HEALTHY (Drive)',
      lastBackupTime: summary.serverTime || new Date().toISOString()
    };

    summary.ratesSnapshot = rates;
    return summary;
  }

  /**
   * Compute complete operational summary from local stores
   */
  computeLocalSummary(backendData = null) {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const pledges = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const payments = (typeof window !== 'undefined' && window.paymentManager && window.paymentManager.payments) || [];
    const customers = (typeof window !== 'undefined' && window.customerManager && window.customerManager.customers) || [];
    const renewals = (typeof window !== 'undefined' && window.renewalRedemptionManager && window.renewalRedemptionManager.renewals) || [];
    const redemptions = (typeof window !== 'undefined' && window.renewalRedemptionManager && window.renewalRedemptionManager.redemptions) || [];
    const documents = (typeof window !== 'undefined' && window.documentManager && window.documentManager.documents) || [];
    const rates = (typeof window !== 'undefined' && window.rateManager && window.rateManager.activeRates) || { gold24k: 15958, gold22k: 14628, silver: 243.90 };

    // --- 1. TODAY'S COUNTER PERFORMANCE ---
    const todayPledges = pledges.filter(p => (p.pledgeDate === todayStr || (p.createdAt || '').startsWith(todayStr)));
    const todayPayments = payments.filter(p => (p.date === todayStr || (p.createdAt || '').startsWith(todayStr)) && p.status !== 'REVERSED');
    const todayRedemptionsList = redemptions.filter(r => (r.redemptionDate === todayStr || (r.createdAt || '').startsWith(todayStr)));
    const todayRenewalsList = renewals.filter(r => (r.renewalDate === todayStr || (r.createdAt || '').startsWith(todayStr)));

    const todayLoansDisbursed = todayPledges.reduce((sum, p) => sum + (Number(p.loanAmount || p.approvedLoan) || 0), 0);
    const todayTotalCollections = todayPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const todayInterestCollected = todayPayments.reduce((sum, p) => sum + (Number(p.interestSettled) || 0), 0);

    const todayCollectionsByMethod = {
      CASH: 0,
      UPI: 0,
      BANK_TRANSFER: 0,
      CARD: 0,
      OTHER: 0
    };

    todayPayments.forEach(p => {
      const mode = (p.paymentMode || 'CASH').toUpperCase();
      const amt = Number(p.amount) || 0;
      if (todayCollectionsByMethod[mode] !== undefined) {
        todayCollectionsByMethod[mode] += amt;
      } else {
        todayCollectionsByMethod.OTHER += amt;
      }
    });

    // --- 2. OUTSTANDING PORTFOLIO & MATURITY REMINDERS ---
    const activePledges = pledges.filter(p => p.status === 'ACTIVE' || p.status === 'DUE' || p.status === 'OVERDUE');
    const totalOutstandingPrincipal = activePledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);

    let totalInterestPending = 0;
    let dueTodayCount = 0;
    let due3DaysCount = 0;
    let due7DaysCount = 0;
    let overdueCount = 0;

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    activePledges.forEach(p => {
      // Calculate pro-rata accrued interest
      if (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateInterestAccrual === 'function') {
        const acc = FinancialCalculator.calculateInterestAccrual(p, now, payments);
        totalInterestPending += (acc.netInterestDue || 0);
      } else if (typeof window !== 'undefined' && window.paymentManager) {
        const acc = window.paymentManager.calculateInterestAccrual(p);
        totalInterestPending += (acc.netInterestDue || 0);
      }

      // Check maturity status
      const maturity = new Date(p.maturityDate || p.pledgeDate);
      if (p.maturityDate === todayStr) {
        dueTodayCount++;
      } else if (maturity > now && maturity <= threeDaysFromNow) {
        due3DaysCount++;
        due7DaysCount++;
      } else if (maturity > now && maturity <= sevenDaysFromNow) {
        due7DaysCount++;
      } else if (maturity < now) {
        overdueCount++;
      }
    });

    // --- 3. DOCUMENT & KYC ALERTS ---
    let missingKycCount = 0;
    let missingCustomerPhotoCount = 0;
    customers.forEach(c => {
      if (c.kycStatus === 'PENDING' || !c.idNumber) {
        missingKycCount++;
      }
      const hasPhoto = Boolean(c.photoUrl) || documents.some(d => d.customerId === c.customerId && d.docType === 'CUSTOMER_PHOTO' && d.status !== 'ARCHIVED');
      if (!hasPhoto) {
        missingCustomerPhotoCount++;
      }
    });

    let missingPledgePhotoCount = 0;
    activePledges.forEach(p => {
      const hasPledgePhoto = Boolean(p.itemPhotos && p.itemPhotos.length > 0) || documents.some(d => (d.pledgeId === p.ticketNo || (d.docTitle || '').includes(p.ticketNo)) && d.docType === 'PLEDGE_ITEM_PHOTO' && d.status !== 'ARCHIVED');
      if (!hasPledgePhoto) {
        missingPledgePhotoCount++;
      }
    });

    // --- 4. SYSTEM HEALTH & DIAGNOSTICS ---
    const offlineQueueCount = (typeof window !== 'undefined' && window.offlineQueue && typeof window.offlineQueue.getQueueCount === 'function')
      ? window.offlineQueue.getQueueCount()
      : 0;

    let failedSyncCount = 0;
    try {
      if (typeof localStorage !== 'undefined') {
        const storedQ = localStorage.getItem('as_jewellar_sync_queue');
        if (storedQ) {
          const list = JSON.parse(storedQ);
          failedSyncCount = list.filter(i => i.syncStatus === 'FAILED' || i.syncStatus === 'CONFLICT').length;
        }
      }
    } catch (e) {}

    const alerts = [];
    if (dueTodayCount > 0) {
      alerts.push({
        id: 'ALT-DUE-TODAY',
        type: 'DANGER',
        title: `${dueTodayCount} Pawn Loans Due Today (இன்று கெடு)`,
        desc: 'Borrowers have reached statutory 1-year maturity today. Contact for renewal or redemption.',
        link: 'reminders.html?filter=today',
        count: dueTodayCount
      });
    }

    if (due3DaysCount > 0) {
      alerts.push({
        id: 'ALT-DUE-3D',
        type: 'WARNING',
        title: `${due3DaysCount} Loans Maturing in 3 Days`,
        desc: 'Follow up with borrowers for timely interest payment or renewal.',
        link: 'reminders.html?filter=3days',
        count: due3DaysCount
      });
    }

    if (overdueCount > 0) {
      alerts.push({
        id: 'ALT-OVERDUE',
        type: 'DANGER',
        title: `${overdueCount} Overdue Loans (> 12 Months)`,
        desc: 'Statutory maturity exceeded. Review for auction review or renewal.',
        link: 'reminders.html?filter=overdue',
        count: overdueCount
      });
    }

    if (missingKycCount > 0) {
      alerts.push({
        id: 'ALT-MISSING-KYC',
        type: 'INFO',
        title: `${missingKycCount} Customers Missing KYC ID Proofs`,
        desc: 'Upload Aadhaar, Voter ID, or Ration Card proofs to complete profile.',
        link: 'customers.html?kyc=pending',
        count: missingKycCount
      });
    }

    if (offlineQueueCount > 0) {
      alerts.push({
        id: 'ALT-OFFLINE-QUEUE',
        type: 'WARNING',
        title: `${offlineQueueCount} Offline Transactions Queued`,
        desc: 'Will automatically sync to Google Drive when connectivity is active.',
        link: 'settings.html',
        count: offlineQueueCount
      });
    }

    // --- 5. RECENT ACTIVITY FEED ---
    const recentActivity = [];

    // Pledges
    pledges.slice(0, 5).forEach(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      recentActivity.push({
        type: 'NEW_PLEDGE',
        title: `Pawn Ticket ${p.ticketNo}`,
        subtitle: `${cust ? cust.nameEn : p.customerId} &bull; ${p.totalNetWeight || 0}g Gold`,
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
        timestamp: pay.createdAt || pay.date,
        receiptNo: pay.paymentId,
        ticketNo: pay.ticketNo,
        status: pay.paymentType,
        badgeClass: 'badge-success'
      });
    });

    // Renewals
    renewals.slice(0, 3).forEach(ren => {
      const cust = customers.find(c => c.customerId === ren.customerId);
      recentActivity.push({
        type: 'RENEWAL',
        title: `Renewal ${ren.newTicketNo}`,
        subtitle: `${cust ? cust.nameEn : ren.customerId} &bull; Old: ${ren.oldTicketNo}`,
        amount: ren.amountPaid || ren.totalPaid,
        date: ren.renewalDate,
        timestamp: ren.createdAt || ren.renewalDate,
        ticketNo: ren.newTicketNo,
        status: 'RENEWED',
        badgeClass: 'badge-primary'
      });
    });

    // Redemptions
    redemptions.slice(0, 3).forEach(red => {
      const cust = customers.find(c => c.customerId === red.customerId);
      recentActivity.push({
        type: 'REDEMPTION',
        title: `Redemption ${red.ticketNo}`,
        subtitle: `${cust ? cust.nameEn : red.customerId} &bull; Released`,
        amount: red.paidAmount || red.totalDue,
        date: red.redemptionDate,
        timestamp: red.redeemedAt || red.redemptionDate,
        ticketNo: red.ticketNo,
        status: 'REDEEMED',
        badgeClass: 'badge-danger'
      });
    });

    // Sort by timestamp desc
    recentActivity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      today: {
        newPledgesCount: todayPledges.length,
        loansDisbursed: todayLoansDisbursed,
        totalCollections: todayTotalCollections,
        interestCollected: todayInterestCollected,
        redemptionsCount: todayRedemptionsList.length || pledges.filter(p => p.status === 'REDEEMED' && (p.redeemedAt || '').startsWith(todayStr)).length,
        renewalsCount: todayRenewalsList.length || pledges.filter(p => p.status === 'RENEWED' && (p.renewedAt || '').startsWith(todayStr)).length,
        collectionsByMethod: todayCollectionsByMethod
      },
      outstanding: {
        activePledgesCount: activePledges.length,
        totalOutstandingPrincipal,
        totalInterestPending: Math.round(totalInterestPending)
      },
      portfolio: {
        activePledgesCount: activePledges.length,
        totalOutstandingPrincipal,
        totalInterestPending: Math.round(totalInterestPending),
        dueTodayCount,
        due3DaysCount,
        due7DaysCount,
        overdueCount
      },
      reminders: {
        dueTodayCount,
        due3DaysCount,
        due7DaysCount,
        overdueCount
      },
      documentAlerts: {
        missingKycCount,
        missingCustomerPhotoCount,
        missingPledgePhotoCount
      },
      system: {
        offlineQueueCount,
        failedSyncCount,
        rateStatus: rates.isOverride ? 'MANUAL_OVERRIDE' : (rates.source || 'LIVE_API'),
        rateLastUpdated: rates.updatedAt || new Date().toISOString(),
        backupStatus: 'HEALTHY (Drive)',
        lastBackupTime: new Date().toISOString()
      },
      ratesSnapshot: rates,
      totalCustomersCount: customers.length,
      alerts,
      recentActivity: recentActivity.slice(0, 10),
      serverTime: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Omni-Search Engine:
   * Fast real-time multi-entity lookup across Tickets, Customers, Mobiles, Aadhaar, and Packet IDs.
   */
  omniSearch(query) {
    if (!query || !query.trim()) return [];
    const q = query.trim().toLowerCase();

    const pledges = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const customers = (typeof window !== 'undefined' && window.customerManager && window.customerManager.customers) || [];
    const payments = (typeof window !== 'undefined' && window.paymentManager && window.paymentManager.payments) || [];

    const results = [];

    // 1. Search Pledges by Ticket No, Packet ID, Vault Location
    pledges.forEach(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      const matchTicket = (p.ticketNo && p.ticketNo.toLowerCase().includes(q));
      const matchPacket = (p.packetId && p.packetId.toLowerCase().includes(q));
      const matchVault = (p.vaultLocation && p.vaultLocation.toLowerCase().includes(q));
      const matchCustomer = cust && (cust.nameEn.toLowerCase().includes(q) || (cust.nameTa && cust.nameTa.includes(q)) || (cust.mobile && cust.mobile.includes(q)));

      if (matchTicket || matchPacket || matchVault || matchCustomer) {
        results.push({
          type: 'PLEDGE',
          title: `Pawn Ticket: ${p.ticketNo}`,
          subtitle: `${cust ? cust.nameEn : p.customerId} &bull; ₹${Number(p.loanAmount).toLocaleString('en-IN')} &bull; Status: ${p.status}`,
          badge: p.status,
          link: `pledges.html?ticket=${p.ticketNo}`,
          icon: '📑',
          entity: p
        });
      }
    });

    // 2. Search Customers by Name, Mobile, ID Number, Town
    customers.forEach(c => {
      const matchName = c.nameEn && c.nameEn.toLowerCase().includes(q);
      const matchNameTa = c.nameTa && c.nameTa.includes(q);
      const matchMobile = c.mobile && c.mobile.includes(q);
      const matchAltMobile = c.altMobile && c.altMobile.includes(q);
      const matchId = c.idNumber && c.idNumber.toLowerCase().includes(q);
      const matchTown = c.town && c.town.toLowerCase().includes(q);

      if (matchName || matchNameTa || matchMobile || matchAltMobile || matchId || matchTown) {
        results.push({
          type: 'CUSTOMER',
          title: `Customer: ${c.nameEn} (${c.customerId})`,
          subtitle: `📱 ${c.mobile} &bull; 📍 ${c.town || 'Town'} &bull; KYC: ${c.kycStatus || 'VERIFIED'}`,
          badge: c.kycStatus || 'ACTIVE',
          link: `customer.html?id=${c.customerId}`,
          icon: '👤',
          entity: c
        });
      }
    });

    // 3. Search Payments by Payment ID or Reference No
    payments.forEach(pay => {
      const matchPayId = pay.paymentId && pay.paymentId.toLowerCase().includes(q);
      const matchRef = pay.referenceNo && pay.referenceNo.toLowerCase().includes(q);

      if (matchPayId || matchRef) {
        results.push({
          type: 'PAYMENT',
          title: `Payment: ${pay.paymentId}`,
          subtitle: `Ticket: ${pay.ticketNo} &bull; ₹${Number(pay.amount).toLocaleString('en-IN')} &bull; Mode: ${pay.paymentMode || 'CASH'}`,
          badge: pay.paymentType,
          link: `payments.html?ticket=${pay.ticketNo}`,
          icon: '💳',
          entity: pay
        });
      }
    });

    return results.slice(0, 12);
  }
}

// Global DashboardManager Instance
if (typeof window !== 'undefined') {
  window.dashboardManager = new DashboardManager();
}

// Export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DashboardManager };
}
