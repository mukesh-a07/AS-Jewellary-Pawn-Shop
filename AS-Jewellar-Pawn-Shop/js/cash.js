/**
 * AS JEWELLAR PAWN SHOP - CASH MANAGEMENT & DAY-BOOK ENGINE
 * Handles single-drawer cash reconciliation, inflow/outflow day-book, and expense tracking.
 */

class CashManager {
  constructor() {
    this.storageKeyExpenses = 'as_jewellar_expenses_store';
    this.storageKeyDayBook = 'as_jewellar_cash_daybook_store';
    this.expenses = this.loadExpenses();
    this.dayBookClosings = this.loadDayBookClosings();
  }

  loadExpenses() {
    try {
      const stored = localStorage.getItem(this.storageKeyExpenses);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load expenses', e);
    }
    // ✅ PRODUCTION: No seed data. Expenses are recorded by admin during counter operations.
    this.saveExpenses([]);
    return [];
  }

  loadDayBookClosings() {
    try {
      const stored = localStorage.getItem(this.storageKeyDayBook);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load daybook closings', e);
    }
    return [];
  }

  saveExpenses(list) {
    this.expenses = list;
    try {
      localStorage.setItem(this.storageKeyExpenses, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save expenses', e);
    }
  }

  saveDayBookClosings(list) {
    this.dayBookClosings = list;
    try {
      localStorage.setItem(this.storageKeyDayBook, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save daybook closings', e);
    }
  }

  /**
   * Get Cash Day-Book Summary for a specific Date
   * Formula: Expected Closing = Opening + Cash Collections - Cash Loans Given - Cash Expenses
   */
  getDailyCashSummary(targetDate = null) {
    const dateStr = targetDate || new Date().toISOString().split('T')[0];

    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const payments = (window.paymentManager && window.paymentManager.payments) || [];

    // Opening Balance (Fixed seed ₹1,00,000 base or previous day closing)
    let openingBalance = 100000;
    const prevClosing = this.dayBookClosings.find(c => c.date < dateStr);
    if (prevClosing && prevClosing.actualCash) {
      openingBalance = prevClosing.actualCash;
    }

    // 1. Cash Inflows (Payments & Settlements in CASH)
    const todayCashPayments = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && (p.paymentMode === 'CASH' || !p.paymentMode));
    const cashCollections = todayCashPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // Also track UPI, Bank, Card, Other Inflows for Day-Book comparison
    const upiCollections = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && p.paymentMode === 'UPI')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const bankCollections = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && p.paymentMode === 'BANK_TRANSFER')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const cardCollections = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && p.paymentMode === 'CARD')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const otherCollections = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && (p.paymentMode === 'OTHER' || (p.paymentMode && !['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'].includes(p.paymentMode))))
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 2. Loans Disbursed & Outflows (Physical CASH Drawer Outflows vs Digital/Bank Modes)
    const todayPledges = pledges.filter(p => p.pledgeDate === dateStr);
    const todayCashPledges = todayPledges.filter(p => !p.disbursementMode || p.disbursementMode === 'CASH');
    const cashLoansGiven = todayCashPledges.reduce((sum, p) => sum + (Number(p.netDisbursementAmount !== undefined ? p.netDisbursementAmount : (p.principalDisbursed !== undefined ? p.principalDisbursed : p.loanAmount)) || 0), 0);

    const upiLoansGiven = todayPledges.filter(p => p.disbursementMode === 'UPI')
      .reduce((sum, p) => sum + (Number(p.netDisbursementAmount !== undefined ? p.netDisbursementAmount : (p.principalDisbursed !== undefined ? p.principalDisbursed : p.loanAmount)) || 0), 0);
    const bankLoansGiven = todayPledges.filter(p => p.disbursementMode === 'BANK_TRANSFER')
      .reduce((sum, p) => sum + (Number(p.netDisbursementAmount !== undefined ? p.netDisbursementAmount : (p.principalDisbursed !== undefined ? p.principalDisbursed : p.loanAmount)) || 0), 0);
    const cardLoansGiven = todayPledges.filter(p => p.disbursementMode === 'CARD')
      .reduce((sum, p) => sum + (Number(p.netDisbursementAmount !== undefined ? p.netDisbursementAmount : (p.principalDisbursed !== undefined ? p.principalDisbursed : p.loanAmount)) || 0), 0);
    const otherLoansGiven = todayPledges.filter(p => p.disbursementMode && !['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'].includes(p.disbursementMode))
      .reduce((sum, p) => sum + (Number(p.netDisbursementAmount !== undefined ? p.netDisbursementAmount : (p.principalDisbursed !== undefined ? p.principalDisbursed : p.loanAmount)) || 0), 0);
    const totalLoansGiven = cashLoansGiven + upiLoansGiven + bankLoansGiven + cardLoansGiven + otherLoansGiven;

    // 3. Cash Expenses
    const todayExpenses = this.expenses.filter(e => e.date === dateStr && e.paymentMethod === 'CASH');
    const cashExpensesTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 4. Expected Closing Cash in Drawer (Physical Cash Only)
    const expectedClosingCash = openingBalance + cashCollections - cashLoansGiven - cashExpensesTotal;

    return {
      date: dateStr,
      openingBalance,
      cashCollections,
      upiCollections,
      bankCollections,
      cardCollections,
      otherCollections,
      totalCollections: cashCollections + upiCollections + bankCollections + cardCollections + otherCollections,
      cashLoansGiven,
      upiLoansGiven,
      bankLoansGiven,
      cardLoansGiven,
      otherLoansGiven,
      totalLoansGiven,
      totalLoansDisbursed: totalLoansGiven,
      cashExpensesTotal,
      expectedClosingCash,
      todayPaymentsList: todayCashPayments,
      todayPledgesList: todayPledges,
      todayExpensesList: todayExpenses
    };
  }

  /**
   * Record physical cash disbursement from counter till
   */
  recordLoanDisbursement(amount, ticketNo, mode = 'CASH') {
    if (mode !== 'CASH') return;
    // Log or track drawer outflow if needed
    console.log(`[CashManager] Physical cash loan disbursed: ₹${amount} for ${ticketNo}`);
  }

  /**
   * Record a Shop Expense
   */
  async recordExpense(payload = {}) {
    const amt = parseFloat(payload.amount);
    if (isNaN(amt) || amt <= 0) {
      return { success: false, message: 'Please enter a valid expense amount (> ₹0).' };
    }

    if (!payload.category) {
      return { success: false, message: 'Expense category is required.' };
    }

    const year = new Date().getFullYear();
    const seq = (this.expenses.length + 1).toString().padStart(6, '0');
    const expenseId = `EXP-${year}-${seq}`;

    const newExpense = {
      expenseId,
      category: payload.category,
      amount: amt,
      date: payload.date || new Date().toISOString().split('T')[0],
      description: payload.description || 'Shop operational expense',
      paymentMethod: payload.paymentMethod || 'CASH',
      createdAt: new Date().toISOString(),
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN'
    };

    this.expenses.unshift(newExpense);
    this.saveExpenses(this.expenses);

    // Sync to backend
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('recordExpense', newExpense).catch(e => console.warn(e));
    }

    return {
      success: true,
      expense: newExpense
    };
  }

  /**
   * Get Expenses within Date Range
   */
  getExpenses(startDate = null, endDate = null) {
    if (!startDate && !endDate) return this.expenses;

    return this.expenses.filter(e => {
      if (startDate && e.date < startDate) return false;
      if (endDate && e.date > endDate) return false;
      return true;
    });
  }

  /**
   * Close Daily Day-Book Drawer & Reconcile
   */
  closeDayBook(dateStr, actualCashInDrawer, notes = '') {
    const summary = this.getDailyCashSummary(dateStr);
    const variance = Number(actualCashInDrawer) - summary.expectedClosingCash;

    const closingRecord = {
      date: dateStr,
      openingBalance: summary.openingBalance,
      cashCollections: summary.cashCollections,
      cashLoansGiven: summary.cashLoansGiven,
      cashExpenses: summary.cashExpensesTotal,
      expectedCash: summary.expectedClosingCash,
      actualCash: Number(actualCashInDrawer),
      variance,
      notes,
      closedAt: new Date().toISOString(),
      closedBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN'
    };

    const filtered = this.dayBookClosings.filter(c => c.date !== dateStr);
    filtered.unshift(closingRecord);
    this.saveDayBookClosings(filtered);

    return {
      success: true,
      closingRecord
    };
  }
}

// Global CashManager Instance
if (typeof window !== 'undefined') {
  window.CashManager = CashManager;
  window.cashManager = new CashManager();
}
if (typeof global !== 'undefined') {
  global.CashManager = CashManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CashManager };
}
