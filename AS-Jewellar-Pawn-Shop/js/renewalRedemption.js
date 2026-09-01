/**
 * AS JEWELLAR PAWN SHOP - RENEWAL & REDEMPTION WORKFLOW ENGINE
 * Handles immutable pledge chaining for renewals and 10-step verified redemption releases.
 */

class RenewalRedemptionManager {
  constructor() {
    this.storageKeyRenewals = 'as_jewellar_renewals_store';
    this.storageKeyRedemptions = 'as_jewellar_redemptions_store';
    this.renewals = this.loadInitialRenewals();
    this.redemptions = this.loadInitialRedemptions();
    this.isProcessing = false;
  }

  loadInitialRenewals() {
    try {
      const stored = localStorage.getItem(this.storageKeyRenewals);
      if (stored) {
        return JSON.parse(stored);
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
      const stored = localStorage.getItem(this.storageKeyRedemptions);
      if (stored) {
        return JSON.parse(stored);
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
      localStorage.setItem(this.storageKeyRenewals, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save renewals to storage', e);
    }
  }

  saveRedemptions(list) {
    this.redemptions = list;
    try {
      localStorage.setItem(this.storageKeyRedemptions, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save redemptions to storage', e);
    }
  }

  /**
   * Renew Pawn Ticket:
   * 1. Settles accrued interest up to renewal date
   * 2. Preserves old ticket immutably as RENEWED -> renewedToTicket
   * 3. Generates new ticket as ACTIVE -> renewedFromTicket with fresh 12-month tenure
   */
  async renewPledge(oldTicketNo, payload = {}) {
    if (this.isProcessing) {
      return { success: false, message: 'Transaction in progress. Please wait...' };
    }

    const oldPledge = window.pledgePosManager.pledges.find(p => p.ticketNo === oldTicketNo);
    if (!oldPledge) {
      return { success: false, message: 'Original pawn ticket not found' };
    }

    if (oldPledge.status === 'REDEEMED' || oldPledge.status === 'RENEWED' || oldPledge.status === 'CLOSED') {
      return { success: false, message: `Pledge ticket is already ${oldPledge.status} and cannot be renewed.` };
    }

    this.isProcessing = true;

    // 1. Calculate Accrued Interest Due
    const accrual = window.paymentManager.calculateInterestAccrual(oldPledge);
    const interestToPay = (payload.interestAmount !== undefined) ? parseFloat(payload.interestAmount) : accrual.netInterestDue;

    // 2. Record interest settlement in Payments ledger
    if (interestToPay > 0) {
      await window.paymentManager.recordPayment({
        ticketNo: oldTicketNo,
        customerId: oldPledge.customerId,
        amount: interestToPay,
        paymentType: 'INTEREST_ONLY',
        paymentMode: payload.paymentMode || 'CASH',
        referenceNo: payload.referenceNo || 'RENEWAL-INTEREST-SETTLE',
        interestSettled: interestToPay,
        principalSettled: 0,
        remainingPrincipal: oldPledge.loanAmount,
        notes: `Renewal interest settlement for ${oldTicketNo}`
      });
    }

    // 3. Generate New Ticket Number
    const year = new Date().getFullYear();
    const seq = (window.pledgePosManager.pledges.length + 1).toString().padStart(6, '0');
    const newTicketNo = `PLG-${year}-${seq}`;

    const now = new Date();
    const renewalDate = now.toISOString().split('T')[0];
    const newMaturityDate = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    const newPrincipal = (payload.newPrincipal !== undefined && parseFloat(payload.newPrincipal) > 0)
      ? parseFloat(payload.newPrincipal)
      : oldPledge.loanAmount;

    // 4. Create New Active Pledge
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
      monthlyInterestRate: oldPledge.monthlyInterestRate || 1.0,
      monthlyInterestAmount: Math.round((newPrincipal * (oldPledge.monthlyInterestRate || 1.0)) / 100),
      status: 'ACTIVE',
      vaultLocation: oldPledge.vaultLocation,
      packetId: oldPledge.packetId,
      lockerTray: oldPledge.lockerTray,
      createdAt: new Date().toISOString(),
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      items: oldPledge.items ? [...oldPledge.items] : []
    };

    // 5. Update Old Pledge to RENEWED (Immutable Chaining)
    oldPledge.status = 'RENEWED';
    oldPledge.renewedToTicket = newTicketNo;
    oldPledge.renewedAt = new Date().toISOString();

    // Insert new pledge to store
    window.pledgePosManager.pledges.unshift(newPledgeRecord);
    window.pledgePosManager.savePledges(window.pledgePosManager.pledges);

    // 6. Record in Renewals ledger
    const renewalRecord = {
      renewalId: `REN-${year}-${(this.renewals.length + 1).toString().padStart(6, '0')}`,
      oldTicketNo,
      newTicketNo,
      customerId: oldPledge.customerId,
      interestSettled: interestToPay,
      principalCarried: newPrincipal,
      renewalDate,
      newMaturityDate,
      paymentMode: payload.paymentMode || 'CASH',
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      notes: payload.notes || 'Pledge renewed for 12 months'
    };

    this.renewals.unshift(renewalRecord);
    this.saveRenewals(this.renewals);

    // 7. Sync with backend API
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('renewPledge', { oldTicketNo, newTicketNo, renewalRecord }).catch(e => console.warn(e));
    }

    this.isProcessing = false;
    return {
      success: true,
      oldPledge,
      newPledge: newPledgeRecord,
      renewalRecord
    };
  }

  /**
   * Redeem Pledge & Physical Item Release (10-Step Workflow)
   */
  async redeemPledge(ticketNo, payload = {}) {
    if (this.isProcessing) {
      return { success: false, message: 'Transaction in progress. Please wait...' };
    }

    const pledge = window.pledgePosManager.pledges.find(p => p.ticketNo === ticketNo);
    if (!pledge) {
      return { success: false, message: 'Pawn ticket not found' };
    }

    if (pledge.status === 'REDEEMED') {
      return { success: false, message: 'This pledge has already been redeemed and closed.' };
    }

    // Step 2 & 8 Verification Checks
    if (!payload.customerVerified) {
      return { success: false, message: 'Customer identity verification is mandatory before redemption.' };
    }

    if (!payload.itemsHandedOver) {
      return { success: false, message: 'Item inspection and handover confirmation is mandatory before redemption.' };
    }

    this.isProcessing = true;

    // Step 4 & 5: Calculate Outstanding & Record Settlement
    const accrual = window.paymentManager.calculateInterestAccrual(pledge);
    const totalSettlement = (payload.totalSettlement !== undefined) ? parseFloat(payload.totalSettlement) : accrual.totalAmountDue;

    await window.paymentManager.recordPayment({
      ticketNo,
      customerId: pledge.customerId,
      amount: totalSettlement,
      paymentType: 'FULL_SETTLEMENT',
      paymentMode: payload.paymentMode || 'CASH',
      referenceNo: payload.referenceNo || 'REDEMPTION-PAYOFF',
      interestSettled: accrual.netInterestDue,
      principalSettled: pledge.loanAmount,
      remainingPrincipal: 0,
      notes: `Full redemption payoff for ${ticketNo}`
    });

    // Step 7: Mark Pledge as REDEEMED (Lock Financials)
    pledge.status = 'REDEEMED';
    pledge.packetStatus = 'RELEASED';
    pledge.loanAmount = 0;
    pledge.redeemedAt = new Date().toISOString();
    pledge.redeemedBy = (window.auth && window.auth.getUser()?.username) || 'ADMIN';
    pledge.redemptionNotes = payload.notes || 'Full loan redeemed and jewellery delivered';
    window.pledgePosManager.savePledges(window.pledgePosManager.pledges);

    // Step 9: Update Vault / Packet Status to VACANT
    const freedPacketId = pledge.packetId;
    const freedVault = pledge.vaultLocation;

    // Step 10: Append to Redemptions store
    const year = new Date().getFullYear();
    const redemptionRecord = {
      redemptionId: `RED-${year}-${(this.redemptions.length + 1).toString().padStart(6, '0')}`,
      ticketNo,
      customerId: pledge.customerId,
      principalSettled: accrual.principal,
      interestSettled: accrual.netInterestDue,
      totalSettlement,
      paymentMode: payload.paymentMode || 'CASH',
      referenceNo: payload.referenceNo || 'REDEMPTION-SETTLED',
      redemptionDate: new Date().toISOString().split('T')[0],
      packetId: freedPacketId,
      vaultLocation: freedVault,
      customerVerified: true,
      itemsHandedOver: true,
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      notes: payload.notes || 'Articles delivered in good condition'
    };

    this.redemptions.unshift(redemptionRecord);
    this.saveRedemptions(this.redemptions);

    // Update Customer active count in CustomerManager
    if (window.customerManager && pledge.customerId) {
      const cust = window.customerManager.getCustomerById(pledge.customerId);
      if (cust) {
        cust.activePledgesCount = Math.max(0, (cust.activePledgesCount || 1) - 1);
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // Backend sync
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('redeemPledge', { ticketNo, redemptionRecord }).catch(e => console.warn(e));
    }

    this.isProcessing = false;
    return {
      success: true,
      pledge,
      redemptionRecord,
      freedPacketId
    };
  }
}

// Global RenewalRedemptionManager Instance
window.renewalRedemptionManager = new RenewalRedemptionManager();
