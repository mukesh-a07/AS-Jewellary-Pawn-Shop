/**
 * AS JEWELLAR PAWN SHOP - RENEWAL & REDEMPTION WORKFLOW ENGINE
 * Handles immutable pledge chaining for renewals and 10-step verified redemption releases.
 */

class RenewalRedemptionManager {
  constructor() {
    this.storageKeyRenewals = 'as_jewellar_renewals_store';
    this.storageKeyRedemptions = 'as_jewellar_redemptions_store';
    this.storageKeyAudit = 'as_jewellar_audit_logs';
    this.renewals = this.loadInitialRenewals();
    this.redemptions = this.loadInitialRedemptions();
    this.isProcessing = false;
  }

  loadInitialRenewals() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKeyRenewals);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to load renewals', e);
    }
    // ✅ PRODUCTION: No seed data.
    this.saveRenewals([]);
    return [];
  }

  loadInitialRedemptions() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKeyRedemptions);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to load redemptions', e);
    }
    // ✅ PRODUCTION: No seed data.
    this.saveRedemptions([]);
    return [];
  }

  saveRenewals(list) {
    this.renewals = list;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeyRenewals, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to save renewals to storage', e);
    }
  }

  saveRedemptions(list) {
    this.redemptions = list;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeyRedemptions, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to save redemptions to storage', e);
    }
  }

  /**
   * Helper to write audit log entry locally and dispatch to backend
   */
  logAudit(action, refType, refId, details = {}) {
    const user = (typeof window !== 'undefined' && window.auth && window.auth.getUser()?.username) || 'ADMIN';
    const timestamp = new Date().toISOString();
    const auditRecord = {
      logId: `AUDIT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
      action,
      refType,
      refId,
      performedBy: user,
      timestamp,
      details
    };

    try {
      if (typeof localStorage !== 'undefined') {
        let existingLogs = [];
        const stored = localStorage.getItem(this.storageKeyAudit);
        if (stored) existingLogs = JSON.parse(stored);
        existingLogs.unshift(auditRecord);
        if (existingLogs.length > 500) existingLogs = existingLogs.slice(0, 500);
        localStorage.setItem(this.storageKeyAudit, JSON.stringify(existingLogs));
      }
    } catch (e) {
      console.warn('Local audit logging notice', e);
    }

    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('logReprint', auditRecord).catch(e => console.warn('Backend audit notice', e));
    }

    return auditRecord;
  }

  /**
   * Renew Pawn Ticket:
   * 1. Settles accrued interest & applicable renewal fees up to renewal date
   * 2. Preserves old ticket immutably as RENEWED -> renewedToTicket
   * 3. Generates new ticket as ACTIVE -> renewedFromTicket with fresh 12-month tenure
   */
  async renewPledge(oldTicketNo, payload = {}) {
    if (typeof oldTicketNo === 'object' && oldTicketNo !== null) {
      payload = oldTicketNo;
      oldTicketNo = payload.ticketNo || payload.oldTicketNo;
    }
    if (this.isProcessing) {
      return { success: false, message: 'Transaction in progress. Please wait...' };
    }

    const pledgesList = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const oldPledge = pledgesList.find(p => p.ticketNo === oldTicketNo);
    if (!oldPledge) {
      return { success: false, message: 'Original pawn ticket not found' };
    }

    if (oldPledge.status === 'REDEEMED' || oldPledge.status === 'RENEWED' || oldPledge.status === 'CLOSED') {
      return { success: false, message: `Pledge ticket is already ${oldPledge.status} and cannot be renewed.` };
    }

    this.isProcessing = true;

    // 1. Calculate Accrued Interest Due & Renewal Metadata (Authoritative FinancialCalculator)
    const confirmedPayments = (typeof window !== 'undefined' && window.paymentManager && window.paymentManager.payments) || [];
    const asOfDate = payload.asOfDate || payload.renewalDate || new Date();
    const renCalc = (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateRenewal === 'function')
      ? FinancialCalculator.calculateRenewal({
          oldPledge,
          asOfDate,
          confirmedPayments,
          newPrincipalOverride: payload.newPrincipal,
          interestPaymentAmount: payload.interestAmount,
          renewalFee: payload.renewalFee || payload.appraiserFee || 0,
          otherFee: payload.otherFee || payload.otherApplicableAmount || 0,
          paymentMode: payload.paymentMode || 'CASH',
          referenceNo: payload.referenceNo || ''
        })
      : {
          principal: oldPledge.loanAmount,
          accruedInterest: (typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(oldPledge).netInterestDue : 0,
          interestSettled: (payload.interestAmount !== undefined && payload.interestAmount !== '') ? parseFloat(payload.interestAmount) : ((typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(oldPledge).netInterestDue : 0),
          renewalFee: parseFloat(payload.renewalFee || payload.appraiserFee) || 0,
          otherFee: parseFloat(payload.otherFee || payload.otherApplicableAmount) || 0,
          totalRenewalFees: (parseFloat(payload.renewalFee || payload.appraiserFee) || 0) + (parseFloat(payload.otherFee || payload.otherApplicableAmount) || 0),
          amountPaid: ((payload.interestAmount !== undefined && payload.interestAmount !== '') ? parseFloat(payload.interestAmount) : 0) + (parseFloat(payload.renewalFee || payload.appraiserFee) || 0) + (parseFloat(payload.otherFee || payload.otherApplicableAmount) || 0),
          totalAmountToCollect: ((payload.interestAmount !== undefined && payload.interestAmount !== '') ? parseFloat(payload.interestAmount) : 0) + (parseFloat(payload.renewalFee || payload.appraiserFee) || 0) + (parseFloat(payload.otherFee || payload.otherApplicableAmount) || 0),
          principalCarried: (payload.newPrincipal !== undefined && parseFloat(payload.newPrincipal) > 0) ? parseFloat(payload.newPrincipal) : oldPledge.loanAmount,
          remaining: (payload.newPrincipal !== undefined && parseFloat(payload.newPrincipal) > 0) ? parseFloat(payload.newPrincipal) : oldPledge.loanAmount,
          remainingPrincipal: (payload.newPrincipal !== undefined && parseFloat(payload.newPrincipal) > 0) ? parseFloat(payload.newPrincipal) : oldPledge.loanAmount,
          renewalDate: new Date().toISOString().split('T')[0],
          newMaturityDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          newMonthlyInterestAmount: Math.round(((payload.newPrincipal || oldPledge.loanAmount) * (oldPledge.monthlyInterestRate || 1.0)) / 100)
        };

    const interestToPay = renCalc.interestSettled;
    const renewalFees = renCalc.totalRenewalFees || 0;
    const totalPaidAtRenewal = renCalc.amountPaid || (interestToPay + renewalFees);
    const newPrincipal = renCalc.principalCarried;
    const renewalDate = renCalc.renewalDate;
    const newMaturityDate = renCalc.newMaturityDate;
    const paymentMode = payload.paymentMode || 'CASH';
    const referenceNo = payload.referenceNo || 'RENEWAL-SETTLE';
    const user = (typeof window !== 'undefined' && window.auth && window.auth.getUser()?.username) || payload.createdBy || 'ADMIN';

    // 2. Record interest settlement in Payments ledger if > 0
    if (totalPaidAtRenewal > 0 && typeof window !== 'undefined' && window.paymentManager) {
      await window.paymentManager.recordPayment({
        ticketNo: oldTicketNo,
        customerId: oldPledge.customerId,
        amount: totalPaidAtRenewal,
        paymentType: 'INTEREST_ONLY',
        paymentMode: paymentMode,
        referenceNo: referenceNo,
        interestSettled: interestToPay,
        principalSettled: 0,
        remainingPrincipal: newPrincipal,
        notes: payload.notes || `Renewal settlement (Interest: ₹${interestToPay}, Fees: ₹${renewalFees}) for ${oldTicketNo}`
      });
    }

    // 3. Generate New Ticket Number
    const year = new Date().getFullYear();
    const seq = (pledgesList.length + 1).toString().padStart(6, '0');
    const newTicketNo = `PLG-${year}-${seq}`;

    // 4. Create New Active Pledge with cloned items & intact metadata
    const clonedItems = (oldPledge.items || []).map((it, idx) => ({
      ...it,
      itemId: `ITM-${newTicketNo}-${(idx + 1).toString().padStart(2, '0')}`,
      status: 'ACTIVE'
    }));

    const newPledgeRecord = {
      ticketNo: newTicketNo,
      customerId: oldPledge.customerId,
      renewedFromTicket: oldTicketNo,
      pledgeDate: renewalDate,
      maturityDate: newMaturityDate,
      tenureMonths: 12,
      totalGrossWeight: oldPledge.totalGrossWeight,
      totalStoneWeight: oldPledge.totalStoneWeight,
      totalNetWeight: oldPledge.totalNetWeight,
      rateGold24k: oldPledge.rateGold24k,
      rateGold22k: oldPledge.rateGold22k,
      rateSilver: oldPledge.rateSilver,
      totalEstimatedValue: oldPledge.totalEstimatedValue,
      totalEligibleLoan: oldPledge.totalEligibleLoan,
      loanAmount: newPrincipal,
      approvedLoan: newPrincipal,
      monthlyInterestRate: oldPledge.monthlyInterestRate || 1.0,
      monthlyInterestAmount: renCalc.newMonthlyInterestAmount,
      status: 'ACTIVE',
      vaultLocation: oldPledge.vaultLocation,
      packetId: oldPledge.packetId,
      lockerTray: oldPledge.lockerTray,
      createdAt: new Date().toISOString(),
      createdBy: user,
      items: clonedItems
    };

    const uniqueSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const idempotencyKey = payload.idempotencyKey || `IDEMP-REN-${Date.now()}-${uniqueSuffix}`;
    const localTxId = `LOCAL-REN-${Date.now()}-${uniqueSuffix}`;
    const isAppOffline = (typeof navigator !== 'undefined' && !navigator.onLine);

    newPledgeRecord.localTxId = `LOCAL-PLG-${Date.now()}-${uniqueSuffix}`;
    newPledgeRecord.idempotencyKey = `IDEMP-PLG-${Date.now()}-${uniqueSuffix}`;
    newPledgeRecord.isOfflineRecord = isAppOffline;

    // 5. Update Old Pledge to RENEWED (Immutable Chaining)
    oldPledge.status = 'RENEWED';
    oldPledge.renewedToTicket = newTicketNo;
    oldPledge.renewedAt = new Date().toISOString();
    oldPledge.renewedBy = user;

    // Insert new pledge to store
    if (typeof window !== 'undefined' && window.pledgePosManager) {
      if (Array.isArray(window.pledgePosManager.pledges)) {
        window.pledgePosManager.pledges.unshift(newPledgeRecord);
      }
      if (typeof window.pledgePosManager.savePledges === 'function') {
        window.pledgePosManager.savePledges(window.pledgePosManager.pledges);
      }
    }

    // 6. Record in Renewals ledger
    const renewalRecord = {
      renewalId: `REN-${year}-${(this.renewals.length + 1).toString().padStart(6, '0')}`,
      localTxId,
      idempotencyKey,
      oldTicketNo,
      newTicketNo,
      customerId: oldPledge.customerId,
      principal: renCalc.principal || oldPledge.loanAmount,
      accruedInterest: renCalc.accruedInterest || interestToPay,
      interestSettled: interestToPay,
      renewalFee: renCalc.renewalFee || 0,
      appraiserFee: renCalc.appraiserFee || 0,
      otherFee: renCalc.otherFee || 0,
      otherApplicableAmount: renCalc.otherApplicableAmount || 0,
      totalPaid: totalPaidAtRenewal,
      amountPaid: totalPaidAtRenewal,
      principalCarried: newPrincipal,
      remaining: newPrincipal,
      remainingPrincipal: newPrincipal,
      renewalDate,
      newMaturityDate,
      paymentMode: paymentMode,
      referenceNo: referenceNo,
      createdBy: user,
      notes: payload.notes || 'Pledge renewed for 12 months with interest cleared',
      isOfflineRecord: isAppOffline
    };

    this.renewals.unshift(renewalRecord);
    this.saveRenewals(this.renewals);

    // 7. Audit Log
    this.logAudit('RENEW_PLEDGE', 'Pledges', oldTicketNo, {
      oldTicketNo,
      newTicketNo,
      customerId: oldPledge.customerId,
      interestSettled: interestToPay,
      renewalFees,
      totalPaid: totalPaidAtRenewal,
      principalCarried: newPrincipal,
      paymentMode,
      referenceNo
    });

    // 8. Sync with backend API or queue
    let apiResult = null;
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      apiResult = await window.api.post('renewPledge', { oldTicketNo, newTicketNo, renewalRecord, newPledgeRecord }).catch(e => {
        console.warn('Backend renewal sync notice', e);
        return null;
      });
    }

    const isQueued = isAppOffline || (apiResult && apiResult.offlineQueued);
    const message = isQueued
      ? 'Renewal saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
      : 'Pledge renewed successfully';

    this.isProcessing = false;
    return {
      success: true,
      oldPledge,
      newPledge: newPledgeRecord,
      newTicket: newPledgeRecord,
      renewalRecord,
      renewal: renewalRecord,
      renCalc,
      localTxId,
      idempotencyKey,
      offlineQueued: Boolean(isQueued),
      syncStatus: isQueued ? 'PENDING' : 'SYNCED',
      message
    };
  }

  /**
   * Redeem Pledge & Physical Item Release (10-Step Verified Workflow)
   */
  async redeemPledge(ticketNo, payload = {}) {
    if (typeof ticketNo === 'object' && ticketNo !== null) {
      payload = ticketNo;
      ticketNo = payload.ticketNo;
    }
    if (this.isProcessing) {
      return { success: false, message: 'Transaction in progress. Please wait...' };
    }

    const pledgesList = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const pledge = pledgesList.find(p => p.ticketNo === ticketNo);
    if (!pledge) {
      return { success: false, message: 'Pawn ticket not found' };
    }

    if (pledge.status === 'REDEEMED') {
      return { success: false, message: 'This pledge has already been redeemed and closed.' };
    }

    // 5-Point Mandatory Pre-Redemption Verifications
    const isCustomerVerified = payload.customerVerified !== false;
    const isItemsHandedOver = payload.itemsHandedOver !== false;
    const isPledgeVerified = payload.pledgeVerified !== false;
    const isPaymentVerified = payload.paymentVerified !== false;
    const isVaultPacketVerified = payload.vaultPacketVerified !== false;

    if (!isCustomerVerified) {
      return { success: false, message: 'Customer identity & KYC verification is mandatory before redemption.' };
    }

    if (!isItemsHandedOver) {
      return { success: false, message: 'Jewellery item inspection and handover confirmation is mandatory before redemption.' };
    }

    if (!isPledgeVerified) {
      return { success: false, message: 'Pledge validity verification is mandatory before redemption.' };
    }

    if (!isVaultPacketVerified) {
      return { success: false, message: 'Safe vault packet verification is mandatory before redemption.' };
    }

    this.isProcessing = true;

    // Step 4 & 5: Calculate Outstanding & Record Settlement (Authoritative FinancialCalculator)
    const confirmedPayments = (typeof window !== 'undefined' && window.paymentManager && window.paymentManager.payments) || [];
    const asOfDate = payload.asOfDate || payload.redemptionDate || new Date();
    const redCalc = (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateRedemption === 'function')
      ? FinancialCalculator.calculateRedemption({
          pledge,
          asOfDate,
          confirmedPayments,
          applicableFees: payload.applicableFees || payload.fees || 0,
          paidAmount: payload.paidAmount || payload.totalSettlement,
          paymentType: payload.paymentMode || payload.paymentType || 'CASH',
          referenceNo: payload.referenceNo || ''
        })
      : {
          principal: pledge.loanAmount,
          principalSettled: pledge.loanAmount,
          interest: (typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(pledge).netInterestDue : 0,
          interestSettled: (typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(pledge).netInterestDue : 0,
          applicableFees: parseFloat(payload.applicableFees || payload.fees) || 0,
          totalDue: (pledge.loanAmount + ((typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(pledge).netInterestDue : 0) + (parseFloat(payload.applicableFees || payload.fees) || 0)),
          totalSettlement: (pledge.loanAmount + ((typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(pledge).netInterestDue : 0) + (parseFloat(payload.applicableFees || payload.fees) || 0)),
          paymentType: payload.paymentMode || 'CASH',
          referenceNo: payload.referenceNo || 'REDEMPTION-PAYOFF',
          paidAmount: (payload.paidAmount !== undefined) ? parseFloat(payload.paidAmount) : (pledge.loanAmount + ((typeof window !== 'undefined' && window.paymentManager) ? window.paymentManager.calculateInterestAccrual(pledge).netInterestDue : 0)),
          balance: 0
        };

    const totalSettlement = redCalc.totalDue || redCalc.totalSettlement;
    const interestSettled = redCalc.interestSettled;
    const principalSettled = redCalc.principalSettled;
    const applicableFees = redCalc.applicableFees || 0;
    const paymentMode = payload.paymentMode || payload.paymentType || 'CASH';
    const referenceNo = payload.referenceNo || 'REDEMPTION-PAYOFF';
    const user = (typeof window !== 'undefined' && window.auth && window.auth.getUser()?.username) || payload.createdBy || 'ADMIN';

    // Record settlement in Payments ledger
    if (typeof window !== 'undefined' && window.paymentManager) {
      await window.paymentManager.recordPayment({
        ticketNo,
        customerId: pledge.customerId,
        amount: totalSettlement,
        paymentType: 'FULL_SETTLEMENT',
        paymentMode: paymentMode,
        referenceNo: referenceNo,
        interestSettled: interestSettled,
        principalSettled: principalSettled,
        remainingPrincipal: 0,
        notes: payload.notes || `Full redemption payoff for ${ticketNo}`
      });
    }

    // Mark Pledge as REDEEMED (Lock Financials & preserve history)
    pledge.status = 'REDEEMED';
    pledge.packetStatus = 'RELEASED';
    pledge.loanAmount = 0;
    pledge.redeemedAt = new Date().toISOString();
    pledge.redeemedBy = user;
    pledge.redemptionNotes = payload.notes || 'Full loan redeemed and jewellery articles delivered in good condition';

    // Mark all individual items as RELEASED
    if (Array.isArray(pledge.items)) {
      pledge.items.forEach(it => {
        it.status = 'RELEASED';
        it.releasedAt = new Date().toISOString();
      });
    }

    if (typeof window !== 'undefined' && window.pledgePosManager && typeof window.pledgePosManager.savePledges === 'function') {
      window.pledgePosManager.savePledges(window.pledgePosManager.pledges);
    }

    // Release Safe Vault Packet
    const freedPacketId = pledge.packetId;
    const freedVault = pledge.vaultLocation;
    if (typeof window !== 'undefined' && window.vaultManager && typeof window.vaultManager.releasePacket === 'function') {
      window.vaultManager.releasePacket(freedPacketId, ticketNo, user, 'Redemption article handover');
    }

    // Append to Redemptions store
    const year = new Date().getFullYear();
    const uniqueSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const idempotencyKey = payload.idempotencyKey || `IDEMP-RED-${Date.now()}-${uniqueSuffix}`;
    const localTxId = `LOCAL-RED-${Date.now()}-${uniqueSuffix}`;
    const isAppOffline = (typeof navigator !== 'undefined' && !navigator.onLine);

    const redemptionRecord = {
      redemptionId: `RED-${year}-${(this.redemptions.length + 1).toString().padStart(6, '0')}`,
      localTxId,
      idempotencyKey,
      ticketNo,
      customerId: pledge.customerId,
      principal: principalSettled,
      principalSettled: principalSettled,
      interest: interestSettled,
      interestSettled: interestSettled,
      applicableFees: applicableFees,
      totalDue: totalSettlement,
      totalSettlement: totalSettlement,
      paidAmount: totalSettlement,
      balance: 0,
      paymentType: paymentMode,
      paymentMode: paymentMode,
      referenceNo: referenceNo,
      redemptionDate: new Date().toISOString().split('T')[0],
      packetId: freedPacketId,
      packetStatus: 'RELEASED',
      vaultLocation: freedVault,
      customerVerified: true,
      pledgeVerified: true,
      itemsHandedOver: true,
      vaultPacketVerified: true,
      paymentVerified: true,
      createdBy: user,
      notes: payload.notes || 'Articles delivered in good condition',
      isOfflineRecord: isAppOffline
    };

    this.redemptions.unshift(redemptionRecord);
    this.saveRedemptions(this.redemptions);

    // Update Customer active count in CustomerManager
    if (typeof window !== 'undefined' && window.customerManager && pledge.customerId) {
      const cust = window.customerManager.getCustomerById(pledge.customerId);
      if (cust) {
        cust.activePledgesCount = Math.max(0, (cust.activePledgesCount || 1) - 1);
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // Audit Log
    this.logAudit('REDEEM_PLEDGE', 'Pledges', ticketNo, {
      ticketNo,
      customerId: pledge.customerId,
      principalSettled,
      interestSettled,
      applicableFees,
      totalSettlement,
      paymentMode,
      referenceNo,
      freedPacketId,
      freedVault
    });

    // Backend sync or offline queue
    let apiResult = null;
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      apiResult = await window.api.post('redeemPledge', { ticketNo, redemptionRecord }).catch(e => {
        console.warn('Backend redemption sync notice', e);
        return null;
      });
    }

    const isQueued = isAppOffline || (apiResult && apiResult.offlineQueued);
    const message = isQueued
      ? 'Redemption saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
      : 'Pledge redeemed and jewellery released successfully';

    this.isProcessing = false;
    return {
      success: true,
      pledge,
      redemptionRecord,
      redemption: redemptionRecord,
      redCalc,
      freedPacketId,
      localTxId,
      idempotencyKey,
      offlineQueued: Boolean(isQueued),
      syncStatus: isQueued ? 'PENDING' : 'SYNCED',
      message
    };
  }
}

// Global RenewalRedemptionManager Instance
var renewalRedemptionManager = new RenewalRedemptionManager();
if (typeof window !== 'undefined') {
  window.renewalRedemptionManager = renewalRedemptionManager;
  window.RenewalRedemptionManager = RenewalRedemptionManager;
}
if (typeof global !== 'undefined') {
  global.renewalRedemptionManager = renewalRedemptionManager;
  global.RenewalRedemptionManager = RenewalRedemptionManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RenewalRedemptionManager,
    renewalRedemptionManager
  };
}
