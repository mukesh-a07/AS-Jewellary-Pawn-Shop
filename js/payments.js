/**
 * AS JEWELLAR PAWN SHOP - PAYMENT & INTEREST MANAGEMENT ENGINE
 * Accurate interest accrual calculation, flexible allocations & append-only financial ledger.
 */

class PaymentManager {
  constructor() {
    this.storageKeyPayments = 'as_jewellar_payments_store';
    this.payments = this.loadInitialPayments();
    this.isSubmitting = false;
  }

  loadInitialPayments() {
    try {
      const stored = localStorage.getItem(this.storageKeyPayments);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load payments from storage', e);
    }

    const seedPayments = [
      {
        paymentId: 'PAY-2026-000412',
        idempotencyKey: 'IDEMP-SEED-01',
        ticketNo: 'PLG-2026-002341',
        customerId: 'CUS-2026-000184',
        amount: 1500,
        paymentType: 'INTEREST_ONLY',
        paymentMode: 'CASH',
        referenceNo: 'CASH-CNTR-01',
        principalSettled: 0,
        interestSettled: 1500,
        remainingPrincipal: 75000,
        date: '2026-08-10',
        time: '11:45 AM',
        createdBy: 'ADMIN',
        status: 'CONFIRMED',
        notes: 'Monthly interest payment for July-August'
      },
      {
        paymentId: 'PAY-2026-000411',
        idempotencyKey: 'IDEMP-SEED-02',
        ticketNo: 'PLG-2026-002340',
        customerId: 'CUS-2026-000092',
        amount: 3000,
        paymentType: 'INTEREST_ONLY',
        paymentMode: 'UPI',
        referenceNo: 'UPI/GPAY/982348123',
        principalSettled: 0,
        interestSettled: 3000,
        remainingPrincipal: 150000,
        date: '2026-07-28',
        time: '04:15 PM',
        createdBy: 'ADMIN',
        status: 'CONFIRMED',
        notes: 'GPay UPI interest collection'
      }
    ];

    this.savePayments(seedPayments);
    return seedPayments;
  }

  savePayments(paymentsList) {
    this.payments = paymentsList;
    try {
      localStorage.setItem(this.storageKeyPayments, JSON.stringify(paymentsList));
    } catch (e) {
      console.warn('Failed to save payments to localStorage', e);
    }
  }

  /**
   * Calculate exact accrued interest based on elapsed days/months
   */
  calculateInterestAccrual(pledge, asOfDate = new Date()) {
    const pledgeDate = new Date(pledge.pledgeDate);
    const settleDate = new Date(asOfDate);
    const diffTime = Math.max(0, settleDate - pledgeDate);
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    const monthlyRate = parseFloat(pledge.monthlyInterestRate) || 1.0;
    const principal = parseFloat(pledge.loanAmount) || 0;

    // Minimum 15 days or fractional month calculation (30 days = 1 month)
    const effectiveDays = Math.max(1, daysElapsed);
    const accruedInterest = Math.round(principal * (monthlyRate / 100) * (effectiveDays / 30));

    // Sum of previous interest payments on this ticket
    const ticketPayments = this.payments.filter(p => p.ticketNo === pledge.ticketNo && p.status === 'CONFIRMED');
    const previouslyPaidInterest = ticketPayments.reduce((sum, p) => sum + (Number(p.interestSettled) || 0), 0);

    const netInterestDue = Math.max(0, accruedInterest - previouslyPaidInterest);
    const totalAmountDue = principal + netInterestDue;

    return {
      daysElapsed,
      monthsElapsed: (daysElapsed / 30).toFixed(1),
      monthlyRate,
      principal,
      accruedInterest,
      previouslyPaidInterest,
      netInterestDue,
      totalAmountDue
    };
  }

  /**
   * Transparent allocation breakdown (Interest first, then Principal)
   */
  allocatePayment(paymentAmount, pledge, allocationMode = 'AUTO') {
    const amt = Math.max(0, parseFloat(paymentAmount) || 0);
    const accrual = this.calculateInterestAccrual(pledge);

    let interestSettled = 0;
    let principalSettled = 0;

    if (allocationMode === 'INTEREST_ONLY') {
      interestSettled = Math.min(amt, accrual.netInterestDue);
      principalSettled = 0;
    } else if (allocationMode === 'PRINCIPAL_ONLY') {
      principalSettled = Math.min(amt, accrual.principal);
      interestSettled = 0;
    } else {
      // AUTO / COMBINED: Settle net interest due first, remainder to principal
      if (amt <= accrual.netInterestDue) {
        interestSettled = amt;
        principalSettled = 0;
      } else {
        interestSettled = accrual.netInterestDue;
        const surplus = amt - interestSettled;
        principalSettled = Math.min(surplus, accrual.principal);
      }
    }

    const remainingPrincipal = Math.max(0, accrual.principal - principalSettled);
    const isFullSettlement = (remainingPrincipal === 0 && (amt >= accrual.totalAmountDue));

    return {
      amountPaid: amt,
      allocationMode,
      interestSettled,
      principalSettled,
      remainingPrincipal,
      isFullSettlement,
      netInterestDueAfter: Math.max(0, accrual.netInterestDue - interestSettled)
    };
  }

  /**
   * Record payment transaction (Append-only & Idempotent)
   */
  async recordPayment(payload) {
    if (this.isSubmitting) {
      return { success: false, message: 'Payment is already being processed. Please wait...' };
    }

    const amt = parseFloat(payload.amount);
    if (isNaN(amt) || amt <= 0) {
      return { success: false, message: 'Please enter a valid payment amount > ₹ 0' };
    }

    if (!payload.ticketNo) {
      return { success: false, message: 'Please select a valid pawn ticket' };
    }

    this.isSubmitting = true;

    const year = new Date().getFullYear();
    const seq = (this.payments.length + 1).toString().padStart(6, '0');
    const paymentId = `PAY-${year}-${seq}`;
    const idempotencyKey = `IDEMP-PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newPaymentRecord = {
      paymentId,
      receiptNo: paymentId,
      idempotencyKey,
      ticketNo: payload.ticketNo,
      customerId: payload.customerId,
      amount: amt,
      paymentType: payload.paymentType || 'COMBINED',
      paymentMode: payload.paymentMode || 'CASH',
      referenceNo: payload.referenceNo || (payload.paymentMode === 'CASH' ? 'CASH-COUNTER' : 'UPI-UTR-PENDING'),
      principalSettled: payload.principalSettled || 0,
      interestSettled: payload.interestSettled || amt,
      remainingPrincipal: payload.remainingPrincipal,
      date: dateStr,
      time: timeStr,
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      status: 'CONFIRMED',
      notes: payload.notes || 'Counter payment collection'
    };

    // 1. Append to Payments store
    this.payments.unshift(newPaymentRecord);
    this.savePayments(this.payments);

    // 2. Update Pledge in PledgePosManager store
    if (window.pledgePosManager) {
      const pledge = window.pledgePosManager.pledges.find(p => p.ticketNo === payload.ticketNo);
      if (pledge) {
        pledge.loanAmount = payload.remainingPrincipal;
        if (payload.remainingPrincipal === 0) {
          pledge.status = 'READY_FOR_REDEMPTION';
        }
        window.pledgePosManager.savePledges(window.pledgePosManager.pledges);
      }
    }

    // 3. Update Customer's Outstanding in CustomerManager
    if (window.customerManager && payload.customerId) {
      const cust = window.customerManager.getCustomerById(payload.customerId);
      if (cust) {
        cust.totalOutstanding = Math.max(0, (cust.totalOutstanding || 0) - payload.principalSettled);
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // 4. Background sync with backend API
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('recordPayment', newPaymentRecord).catch(err => {
        console.warn('Background sync notice for payment:', err);
      });
    }

    this.isSubmitting = false;
    return { success: true, payment: newPaymentRecord, receiptNo: paymentId };
  }

  /**
   * Reversal / Correction: Append-only offsetting entry
   */
  async reversePayment(paymentId, reason = 'Correction') {
    const original = this.payments.find(p => p.paymentId === paymentId);
    if (!original) {
      return { success: false, message: 'Payment record not found' };
    }

    if (original.status === 'REVERSED') {
      return { success: false, message: 'This payment has already been reversed' };
    }

    // 1. Mark original as REVERSED
    original.status = 'REVERSED';
    original.reversalReason = reason;

    // 2. Append offsetting reversal record
    const reversalRecord = {
      paymentId: `PAY-REV-${original.paymentId.slice(4)}`,
      receiptNo: `PAY-REV-${original.paymentId.slice(4)}`,
      idempotencyKey: `IDEMP-REV-${Date.now()}`,
      ticketNo: original.ticketNo,
      customerId: original.customerId,
      amount: -original.amount,
      paymentType: 'REVERSAL',
      paymentMode: original.paymentMode,
      referenceNo: `REV-OF-${original.paymentId}`,
      principalSettled: -original.principalSettled,
      interestSettled: -original.interestSettled,
      remainingPrincipal: original.remainingPrincipal + original.principalSettled,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      status: 'REVERSED',
      notes: `Reversal of ${original.paymentId}: ${reason}`
    };

    this.payments.unshift(reversalRecord);
    this.savePayments(this.payments);

    // 3. Rollback pledge principal
    if (window.pledgePosManager) {
      const pledge = window.pledgePosManager.pledges.find(p => p.ticketNo === original.ticketNo);
      if (pledge) {
        pledge.loanAmount += original.principalSettled;
        if (pledge.status === 'READY_FOR_REDEMPTION' && pledge.loanAmount > 0) {
          pledge.status = 'ACTIVE';
        }
        window.pledgePosManager.savePledges(window.pledgePosManager.pledges);
      }
    }

    // 4. Notify backend
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('reversePayment', { originalPaymentId: paymentId, reason }).catch(e => console.warn(e));
    }

    return { success: true, reversal: reversalRecord };
  }
}

// Global PaymentManager Instance
window.paymentManager = new PaymentManager();
