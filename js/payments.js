/**
 * AS JEWELLAR PAWN SHOP - PAYMENT & PAYMENT TYPE MANAGEMENT ENGINE
 * Accurate interest accrual calculation, flexible allocations & append-only financial ledger.
 */

const DEFAULT_PAYMENT_METHODS = [
  {
    id: 'CASH',
    code: 'CASH',
    nameEn: 'Cash',
    labelEn: 'Cash',
    nameTa: 'ரொக்கம்',
    labelTa: 'ரொக்கம்',
    enabled: true,
    refRule: 'OPTIONAL', // 'OPTIONAL', 'RECOMMENDED', 'REQUIRED'
    notesRule: 'OPTIONAL', // 'OPTIONAL', 'REQUIRED'
    icon: '💵',
    isDefault: true
  },
  {
    id: 'UPI',
    code: 'UPI',
    nameEn: 'UPI (GPay / PhonePe / Paytm / QR)',
    labelEn: 'UPI (GPay / PhonePe / Paytm / QR)',
    nameTa: 'யுபிஐ (GPay / PhonePe / Paytm)',
    labelTa: 'யுபிஐ (GPay / PhonePe / Paytm)',
    enabled: true,
    refRule: 'RECOMMENDED',
    notesRule: 'OPTIONAL',
    icon: '📱'
  },
  {
    id: 'BANK_TRANSFER',
    code: 'BANK_TRANSFER',
    nameEn: 'Bank Transfer (IMPS / NEFT / RTGS)',
    labelEn: 'Bank Transfer (IMPS / NEFT / RTGS)',
    nameTa: 'வங்கி பரிமாற்றம் (IMPS / NEFT)',
    labelTa: 'வங்கி பரிமாற்றம் (IMPS / NEFT)',
    enabled: true,
    refRule: 'REQUIRED',
    notesRule: 'OPTIONAL',
    icon: '🏦'
  },
  {
    id: 'CARD',
    code: 'CARD',
    nameEn: 'Card (Debit / Credit POS)',
    labelEn: 'Card (Debit / Credit POS)',
    nameTa: 'கார்டு (டெபிட் / கிரெடிட்)',
    labelTa: 'கார்டு (டெபிட் / கிரெடிட்)',
    enabled: true,
    refRule: 'OPTIONAL',
    notesRule: 'OPTIONAL',
    icon: '💳'
  },
  {
    id: 'OTHER',
    code: 'OTHER',
    nameEn: 'Other (Cheque / DD / Special)',
    labelEn: 'Other (Cheque / DD / Special)',
    nameTa: 'இதர முறை',
    labelTa: 'இதர முறை',
    enabled: true,
    refRule: 'OPTIONAL',
    notesRule: 'REQUIRED',
    icon: '📑'
  }
];

class PaymentMethodManager {
  static STORAGE_KEY = 'as_jewellar_payment_methods';

  static getMethods() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(m => ({
            ...m,
            id: m.id || m.code,
            code: m.code || m.id,
            nameEn: m.nameEn || m.labelEn,
            labelEn: m.labelEn || m.nameEn,
            nameTa: m.nameTa || m.labelTa,
            labelTa: m.labelTa || m.nameTa
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to load payment methods', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_PAYMENT_METHODS));
  }

  static getActiveMethods() {
    const methods = this.getMethods();
    const active = methods.filter(m => m.enabled !== false);
    return active.length > 0 ? active : [DEFAULT_PAYMENT_METHODS[0]];
  }

  static getMethod(idOrCode) {
    const cleanId = String(idOrCode || 'CASH').toUpperCase();
    const methods = this.getMethods();
    const found = methods.find(m => m.id === cleanId || m.code === cleanId) || DEFAULT_PAYMENT_METHODS.find(m => m.id === cleanId || m.code === cleanId);
    if (found) {
      return {
        ...found,
        id: found.id || found.code,
        code: found.code || found.id,
        nameEn: found.nameEn || found.labelEn,
        labelEn: found.labelEn || found.nameEn,
        nameTa: found.nameTa || found.labelTa,
        labelTa: found.labelTa || found.nameTa
      };
    }
    return {
      id: cleanId,
      code: cleanId,
      nameEn: cleanId,
      labelEn: cleanId,
      nameTa: cleanId,
      labelTa: cleanId,
      enabled: true,
      refRule: 'OPTIONAL',
      notesRule: 'OPTIONAL'
    };
  }

  static saveMethods(methods) {
    try {
      if (!Array.isArray(methods) || methods.length === 0) return false;
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(methods));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('paymentMethodsChanged', { detail: { methods } }));
      }
      return true;
    } catch (e) {
      console.warn('Failed to save payment methods', e);
      return false;
    }
  }

  static validatePaymentInput(arg1, arg2, arg3, arg4) {
    let amount = null;
    let paymentMode = 'CASH';
    let referenceNo = '';
    let notes = '';

    if (arguments.length >= 4 || (typeof arg1 === 'number' && !isNaN(arg1))) {
      amount = parseFloat(arg1);
      paymentMode = arg2;
      referenceNo = arg3;
      notes = arg4;
    } else {
      paymentMode = arg1;
      referenceNo = arg2;
      notes = arg3;
    }

    if (amount !== null && (isNaN(amount) || amount <= 0)) {
      return {
        valid: false,
        field: 'amount',
        message: 'Payment amount must be greater than ₹0.'
      };
    }

    const mode = String(paymentMode || 'CASH').toUpperCase();
    const method = this.getMethod(mode);
    const cleanRef = String(referenceNo || '').trim();
    const cleanNotes = String(notes || '').trim();

    if (!method.enabled && method.id !== 'CASH') {
      return {
        valid: false,
        field: 'paymentMode',
        message: `Payment method ${method.nameEn || method.labelEn} is currently disabled in Settings.`
      };
    }

    if (method.refRule === 'REQUIRED' && !cleanRef) {
      return {
        valid: false,
        field: 'referenceNo',
        message: `Reference / UTR / Transaction number is strictly required for ${method.nameEn || method.labelEn}.`
      };
    }

    if (method.notesRule === 'REQUIRED' && !cleanNotes) {
      return {
        valid: false,
        field: 'notes',
        message: `Internal notes / remarks are strictly required for ${method.nameEn || method.labelEn}.`
      };
    }

    return { valid: true };
  }
}

class PaymentManager {
  constructor() {
    this.storageKeyPayments = 'as_jewellar_payments_store';
    this.payments = this.loadInitialPayments();
    this.isSubmitting = false;

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.syncWithBackend(), 200);
    }
  }

  /**
   * Synchronize Payments with Google Sheets Backend
   */
  async syncWithBackend() {
    if (typeof window === 'undefined' || !window.api || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return this.payments;
    }

    try {
      const res = await window.api.get('listPayments');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const remoteList = res.data.map(item => {
          const amt = parseFloat(item.amountPaid || item.amount_paid || item.amount) || 0;
          const intSettled = parseFloat(item.interestSettled || item.interest_settled) || 0;
          const prinSettled = parseFloat(item.principalSettled || item.principal_settled) || 0;
          const remPrin = parseFloat(item.remainingPrincipal || item.remaining_principal) || 0;
          const paymentId = item.paymentId || item.payment_id || item.receiptNo || item.receipt_no || item.id;

          return {
            paymentId: paymentId,
            receiptNo: paymentId,
            ticketNo: item.ticketNo || item.ticket_no || item.pledgeId || item.pledge_id,
            pledgeId: item.ticketNo || item.ticket_no || item.pledgeId || item.pledge_id,
            customerId: item.customerId || item.customer_id || '',
            amount: amt,
            paymentType: item.paymentType || item.payment_type || (prinSettled > 0 ? 'COMBINED' : 'INTEREST_ONLY'),
            paymentMode: (item.paymentMode || item.payment_mode || item.paymentType || 'CASH').toUpperCase(),
            referenceNo: item.referenceNo || item.reference_no || item.refNo || item.ref_no || '',
            referenceNumber: item.referenceNo || item.reference_no || item.refNo || item.ref_no || '',
            principalSettled: prinSettled,
            interestSettled: intSettled,
            remainingPrincipal: remPrin,
            date: item.paymentDate || item.payment_date || item.date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            time: item.time || (item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            createdBy: item.createdBy || item.created_by || 'ADMIN',
            status: item.status || 'CONFIRMED',
            notes: item.notes || ''
          };
        });

        const merged = [...remoteList];
        this.payments.forEach(localPay => {
          if (!merged.some(r => r.paymentId === localPay.paymentId)) {
            merged.push(localPay);
          }
        });

        this.payments = merged;
        this.savePayments(this.payments);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('paymentsSynced', { detail: this.payments }));
        }
        return this.payments;
      }
    } catch (e) {
      console.warn('Backend payment sync notice:', e);
    }
    return this.payments;
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

    // ✅ PRODUCTION: No seed data. Payments are recorded as customers make transactions.
    this.savePayments([]);
    return [];
  }

  savePayments(paymentsList) {
    this.payments = paymentsList;
    try {
      localStorage.setItem(this.storageKeyPayments, JSON.stringify(paymentsList));
    } catch (e) {
      console.warn('Failed to save payments to localStorage', e);
    }
    // Mirror to IndexedDB paymentsStore
    if (typeof window !== 'undefined' && window.offlineDB && typeof window.offlineDB.putRecord === 'function') {
      paymentsList.forEach(p => {
        window.offlineDB.putRecord('paymentsStore', p).catch(e => console.warn(e));
      });
    }
  }

  /**
   * Calculate exact accrued interest based on elapsed days/months (Authoritative FinancialCalculator)
   */
  calculateInterestAccrual(pledge, asOfDate = new Date()) {
    if (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateInterestAccrual === 'function') {
      return FinancialCalculator.calculateInterestAccrual(pledge, asOfDate, this.payments);
    }
    const pledgeDate = new Date(pledge.pledgeDate);
    const settleDate = new Date(asOfDate);
    const diffTime = Math.max(0, settleDate - pledgeDate);
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const monthlyRate = parseFloat(pledge.monthlyInterestRate) || 1.0;
    const principal = parseFloat(pledge.loanAmount) || 0;
    const effectiveDays = Math.max(1, daysElapsed);
    const accruedInterest = Math.round(principal * (monthlyRate / 100) * (effectiveDays / 30));
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
   * Transparent allocation breakdown (Authoritative FinancialCalculator)
   */
  allocatePayment(paymentAmount, pledge, allocationMode = 'AUTO') {
    if (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.allocatePayment === 'function') {
      return FinancialCalculator.allocatePayment({
        amount: paymentAmount,
        pledge,
        asOfDate: new Date(),
        confirmedPayments: this.payments,
        allocationMode
      });
    }
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

    const paymentMode = String(payload.paymentMode || payload.paymentType || 'CASH').toUpperCase();
    const referenceNo = String(payload.referenceNo || '').trim();
    const notes = String(payload.notes || '').trim();

    // Method-specific rule validation
    const valResult = PaymentMethodManager.validatePaymentInput(paymentMode, referenceNo, notes);
    if (!valResult.valid) {
      return { success: false, message: valResult.message, field: valResult.field };
    }

    // Idempotency check: prevent duplicate submissions with identical idempotencyKey
    const uniqueSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const idempotencyKey = payload.idempotencyKey || `IDEMP-PAY-${Date.now()}-${uniqueSuffix}`;
    const localTxId = `LOCAL-PAY-${Date.now()}-${uniqueSuffix}`;
    const existing = this.payments.find(p => p.idempotencyKey === idempotencyKey);
    if (existing) {
      return {
        success: true,
        payment: existing,
        receiptNo: existing.paymentId,
        localTxId: existing.localTxId || null,
        idempotencyKey,
        duplicatePrevented: true,
        message: 'Payment already recorded (idempotent de-duplicated response)'
      };
    }

    this.isSubmitting = true;

    const year = new Date().getFullYear();
    const seq = (this.payments.length + 1).toString().padStart(6, '0');
    const paymentId = payload.paymentId || `PAY-${year}-${seq}`;

    const now = new Date();
    const dateStr = payload.date || now.toISOString().split('T')[0];
    const timeStr = payload.time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timestamp = now.toISOString();

    const isAppOffline = (typeof navigator !== 'undefined' && !navigator.onLine);

    const newPaymentRecord = {
      paymentId,
      receiptNo: paymentId,
      localTxId,
      idempotencyKey,
      ticketNo: payload.ticketNo,
      pledgeId: payload.ticketNo,
      customerId: payload.customerId || '',
      amount: amt,
      paymentType: payload.paymentType || 'COMBINED',
      paymentMode: paymentMode,
      referenceNo: referenceNo || payload.referenceNumber || (paymentMode === 'CASH' ? 'CASH-COUNTER' : ''),
      referenceNumber: referenceNo || payload.referenceNumber || (paymentMode === 'CASH' ? 'CASH-COUNTER' : ''),
      principalSettled: payload.principalSettled !== undefined ? payload.principalSettled : (payload.principalAmount !== undefined ? payload.principalAmount : 0),
      interestSettled: payload.interestSettled !== undefined ? payload.interestSettled : (payload.interestAmount !== undefined ? payload.interestAmount : amt),
      remainingPrincipal: payload.remainingPrincipal !== undefined ? payload.remainingPrincipal : 0,
      date: dateStr,
      time: timeStr,
      createdAt: timestamp,
      createdBy: (typeof window !== 'undefined' && window.auth && window.auth.getUser()?.username) || 'ADMIN',
      status: 'CONFIRMED',
      notes: notes || 'Counter payment collection',
      isOfflineRecord: isAppOffline
    };

    // 1. Append to Payments store
    this.payments.unshift(newPaymentRecord);
    this.savePayments(this.payments);

    // 2. Update Pledge in PledgePosManager store
    if (typeof window !== 'undefined' && window.pledgePosManager) {
      const pledge = window.pledgePosManager.pledges.find(p => p.ticketNo === payload.ticketNo);
      if (pledge) {
        const pPaid = (pledge.principalPaid || 0) + (newPaymentRecord.principalSettled || 0);
        pledge.principalPaid = pPaid;
        pledge.principalOutstanding = Math.max(0, (pledge.loanAmount || 0) - pPaid);
        if (pledge.principalOutstanding === 0 && newPaymentRecord.principalSettled > 0) {
          pledge.status = 'READY_FOR_REDEMPTION';
        }
        window.pledgePosManager.savePledges(window.pledgePosManager.pledges);
      }
    }

    // 3. Update Customer's Outstanding in CustomerManager
    if (typeof window !== 'undefined' && window.customerManager && payload.customerId) {
      const cust = window.customerManager.getCustomerById(payload.customerId);
      if (cust) {
        cust.totalOutstanding = Math.max(0, (cust.totalOutstanding || 0) - (payload.principalSettled || 0));
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // 4. Background sync / API dispatch
    let apiResult = null;
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      apiResult = await window.api.post('recordPayment', newPaymentRecord).catch(err => {
        console.warn('Background sync notice for payment:', err);
        return null;
      });
    }

    const isQueued = isAppOffline || (apiResult && apiResult.offlineQueued);
    const message = isQueued
      ? 'Payment saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
      : 'Payment recorded successfully';

    this.isSubmitting = false;
    return {
      success: true,
      payment: newPaymentRecord,
      receiptNo: paymentId,
      localTxId,
      idempotencyKey,
      offlineQueued: Boolean(isQueued),
      syncStatus: isQueued ? 'PENDING' : 'SYNCED',
      message
    };
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
      createdAt: new Date().toISOString(),
      createdBy: (typeof window !== 'undefined' && window.auth && window.auth.getUser()?.username) || 'ADMIN',
      status: 'CONFIRMED',
      notes: `Reversal of payment ${original.paymentId}: ${reason}`
    };

    this.payments.unshift(reversalRecord);
    this.savePayments(this.payments);

    // 3. Restore Pledge balance
    if (typeof window !== 'undefined' && window.pledgePosManager) {
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
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('reversePayment', { originalPaymentId: paymentId, reason }).catch(e => console.warn(e));
    }

    return { success: true, reversal: reversalRecord };
  }
}

// Global Instances & Exports
if (typeof window !== 'undefined') {
  window.PaymentMethodManager = PaymentMethodManager;
  window.paymentMethodManager = PaymentMethodManager;
  window.DEFAULT_PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;
  window.PaymentManager = PaymentManager;
  window.paymentManager = new PaymentManager();
  window.paymentsManager = window.paymentManager;
}
if (typeof global !== 'undefined') {
  global.PaymentMethodManager = PaymentMethodManager;
  global.DEFAULT_PAYMENT_METHODS = DEFAULT_PAYMENT_METHODS;
  global.PaymentManager = PaymentManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DEFAULT_PAYMENT_METHODS,
    PaymentMethodManager,
    PaymentManager
  };
}
