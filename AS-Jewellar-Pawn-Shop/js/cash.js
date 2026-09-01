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

    // Also track UPI and Bank Inflows for Day-Book comparison
    const upiCollections = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && p.paymentMode === 'UPI')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const bankCollections = payments.filter(p => p.date === dateStr && p.status === 'CONFIRMED' && p.paymentMode === 'BANK_TRANSFER')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    // 2. Cash Outflows (Loans Disbursed in CASH)
    const todayPledges = pledges.filter(p => p.pledgeDate === dateStr);
    const cashLoansGiven = todayPledges.reduce((sum, p) => sum + (Number(p.principalDisbursed !== undefined ? p.principalDisbursed : p.loanAmount) || 0), 0);

    // 3. Cash Expenses
    const todayExpenses = this.expenses.filter(e => e.date === dateStr && e.paymentMethod === 'CASH');
    const cashExpensesTotal = todayExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // 4. Expected Closing Cash in Drawer
    const expectedClosingCash = openingBalance + cashCollections - cashLoansGiven - cashExpensesTotal;

    return {
      date: dateStr,
      openingBalance,
      cashCollections,
      upiCollections,
      bankCollections,
      totalCollections: cashCollections + upiCollections + bankCollections,
      cashLoansGiven,
      cashExpensesTotal,
      expectedClosingCash,
      todayPaymentsList: todayCashPayments,
      todayPledgesList: todayPledges,
      todayExpensesList: todayExpenses
    };
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
window.cashManager = new CashManager();
