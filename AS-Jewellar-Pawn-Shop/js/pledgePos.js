/**
 * AS JEWELLAR PAWN SHOP - NEW PLEDGE / PAWN POS SERVICE
 * High-Speed Multi-Item Pawn Booking & Valuation Engine.
 * 
 * Features:
 * - Multi-item calculation (Net Wt = Gross - Stone, Market Valuation, LTV Loan)
 * - Advanced Valuation with Configurable Gold Appraiser Fee & Other Fees
 * - Fee Collection Modes (Deduct from Disbursement vs Collect Separately at Counter)
 * - Live metal rate stamping
 * - Idempotency duplicate prevention
 * - Offline-first IndexedDB / LocalStorage persistence
 * - Printable bilingual statutory Pawn Ticket generator (Form F)
 */

/**
 * PledgeValuationEngine - Aliased and delegated to unified FinancialCalculator
 */
var PledgeValuationEngine = (typeof FinancialCalculator !== 'undefined') ? FinancialCalculator : class {
  static roundWeight(val, precision = 3) {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return 0;
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  static roundCurrency(val, precision = 0) {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    if (precision === 0) return Math.round(num);
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  static calculateItem(item, rate24k = 15958, rate22k = 14628, rateSilver = 243.90, ltvPercent = 75) {
    if (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateItem === 'function') {
      return FinancialCalculator.calculateItem(item, rate24k, rate22k, rateSilver, ltvPercent);
    }
    const gross = this.roundWeight(Math.max(0, parseFloat(item.grossWeight) || 0), 3);
    const stone = this.roundWeight(Math.max(0, parseFloat(item.stoneWeight) || 0), 3);
    const net = this.roundWeight(Math.max(0, gross - stone), 3);
    let rateUsed = rate22k;
    const cat = String(item.category || 'GOLD').toUpperCase();
    const pur = String(item.purity || '22K').toUpperCase();
    if (cat === 'SILVER') {
      rateUsed = (pur === 'SILVER_925' || pur === '925') ? Math.round(rateSilver * 0.925 * 100) / 100 : rateSilver;
    } else {
      if (pur === '24K') rateUsed = rate24k;
      else if (pur === '18K') rateUsed = Math.round(rate24k * (18 / 24) * 100) / 100;
      else if (pur === '14K') rateUsed = Math.round(rate24k * (14 / 24) * 100) / 100;
      else rateUsed = rate22k;
    }
    const estimatedValue = this.roundCurrency(net * rateUsed, 0);
    const eligibleLoan = this.roundCurrency(estimatedValue * (ltvPercent / 100), 0);
    return {
      ...item,
      grossWeight: gross,
      stoneWeight: stone,
      netWeight: net,
      rateUsed,
      estimatedValue,
      eligibleLoan
    };
  }

  static calculateValuation(params = {}) {
    if (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateValuation === 'function') {
      const res = FinancialCalculator.calculateValuation(params);
      return {
        ...res,
        lessFees: res.totalFees,
        ltvPercent: res.loanPercentage,
        principalDisbursed: res.approvedLoan,
        netDisbursementAmount: res.netDisbursementAmount || res.netDisbursement,
        netDisbursement: res.netDisbursement || res.netDisbursementAmount
      };
    }
    const {
      items = [],
      rateGold24k = 15958,
      rateGold22k = 14628,
      rateSilver = 243.90,
      appraiserFeeType = 'FIXED',
      appraiserFeeValue = 150,
      appraiserFeeOverride = null,
      otherFeeType = 'NONE',
      otherFeeValue = 0,
      otherFeeOverride = null,
      feeDeductionMode = 'DEDUCT_FROM_DISBURSEMENT',
      ltvPercent = 75,
      approvedLoanOverride = null,
      monthlyInterestRate = 1.0
    } = params;

    let totalGrossWeight = 0;
    let totalStoneWeight = 0;
    let totalNetWeight = 0;
    let grossEstimatedValue = 0;

    const calculatedItems = (items || []).map((it, idx) => {
      const calc = this.calculateItem(it, rateGold24k, rateGold22k, rateSilver, ltvPercent);
      totalGrossWeight += calc.grossWeight;
      totalStoneWeight += calc.stoneWeight;
      totalNetWeight += calc.netWeight;
      grossEstimatedValue += calc.estimatedValue;
      return { ...calc, itemIndex: idx + 1 };
    });

    totalGrossWeight = this.roundWeight(totalGrossWeight, 3);
    totalStoneWeight = this.roundWeight(totalStoneWeight, 3);
    totalNetWeight = this.roundWeight(totalNetWeight, 3);
    grossEstimatedValue = this.roundCurrency(grossEstimatedValue, 0);

    let appraiserFee = 0;
    if (appraiserFeeOverride !== null && appraiserFeeOverride !== undefined && appraiserFeeOverride !== '') {
      appraiserFee = Math.max(0, parseFloat(appraiserFeeOverride) || 0);
    } else {
      if (appraiserFeeType === 'FIXED') appraiserFee = Math.max(0, parseFloat(appraiserFeeValue) || 0);
      else if (appraiserFeeType === 'PERCENTAGE') appraiserFee = this.roundCurrency(grossEstimatedValue * ((parseFloat(appraiserFeeValue) || 0) / 100), 0);
    }

    let otherFees = 0;
    if (otherFeeOverride !== null && otherFeeOverride !== undefined && otherFeeOverride !== '') {
      otherFees = Math.max(0, parseFloat(otherFeeOverride) || 0);
    } else {
      if (otherFeeType === 'FIXED') otherFees = Math.max(0, parseFloat(otherFeeValue) || 0);
      else if (otherFeeType === 'PERCENTAGE') otherFees = this.roundCurrency(grossEstimatedValue * ((parseFloat(otherFeeValue) || 0) / 100), 0);
    }

    const totalFees = this.roundCurrency(appraiserFee + otherFees, 0);
    const grossEligibleValue = grossEstimatedValue;
    const netEligibleValue = Math.max(0, this.roundCurrency(grossEligibleValue - totalFees, 0));
    const loanPercentage = parseFloat(ltvPercent) || 75;
    const eligibleLoan = this.roundCurrency(netEligibleValue * (loanPercentage / 100), 0);

    let approvedLoan = eligibleLoan;
    if (approvedLoanOverride !== null && approvedLoanOverride !== undefined && approvedLoanOverride !== '') {
      approvedLoan = Math.max(0, parseFloat(approvedLoanOverride) || 0);
    }

    let netDisbursement = approvedLoan;
    if (feeDeductionMode === 'DEDUCT_FROM_DISBURSEMENT') {
      netDisbursement = Math.max(0, this.roundCurrency(approvedLoan - totalFees, 0));
    }

    const monthlyInterestAmount = this.roundCurrency((approvedLoan * (parseFloat(monthlyInterestRate) || 1.0)) / 100, 0);

    return {
      items: calculatedItems,
      totalGrossWeight,
      totalStoneWeight,
      totalNetWeight,
      grossEstimatedValue,
      grossValue: grossEstimatedValue,
      totalEstimatedValue: grossEstimatedValue,
      appraiserFee,
      appraiserFeeType,
      appraiserFeeValue: parseFloat(appraiserFeeValue) || 0,
      otherFees,
      otherFeeType,
      otherFeeValue: parseFloat(otherFeeValue) || 0,
      totalFees,
      lessFees: totalFees,
      grossEligibleValue,
      netEligibleValue,
      loanPercentage,
      ltvPercent: loanPercentage,
      eligibleLoan,
      maxLoan: eligibleLoan,
      totalEligibleLoan: eligibleLoan,
      approvedLoan,
      loanAmount: approvedLoan,
      principalDisbursed: approvedLoan,
      feeDeductionMode,
      netDisbursement,
      netDisbursementAmount: netDisbursement,
      netCashDisbursed: netDisbursement,
      monthlyInterestRate: parseFloat(monthlyInterestRate) || 1.0,
      monthlyInterestAmount
    };
  }
};



class PledgePosManager {
  constructor() {
    this.storageKeyPledges = 'as_jewellar_pledges_store';
    this.storageKeyItems = 'as_jewellar_pledge_items_store';
    this.pledges = this.loadInitialPledges();
    this.items = [];
    this.selectedCustomer = null;
    this.loanPercentage = 75; // Default 75% LTV
    this.monthlyInterestRate = 1.0; // 1.0% per month / 12% p.a.
    this.tenureMonths = 12; // 1 Year statutory tenure
    this.itemPhotos = [];
    this.isSubmitting = false;

    // Fee state
    this.customAppraiserFee = null;
    this.customOtherFee = null;
    this.feeDeductionMode = null;

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.syncWithBackend(), 150);
    }
  }

  /**
   * Synchronize Pledges with Google Sheets Backend
   */
  async syncWithBackend() {
    if (typeof window === 'undefined' || !window.api || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return this.pledges;
    }

    try {
      const res = await window.api.get('listPledges');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const remoteList = res.data.map(item => {
          const loanAmt = parseFloat(item.loanAmount || item.loan_amount || item.approvedLoan || item.approved_loan || item.principalAmount || item.principal_amount) || 0;
          const monthlyRate = parseFloat(item.monthlyInterestRate || item.monthly_interest_rate || item.interestRate || item.interest_rate) || 1.0;
          const monthlyIntAmt = parseFloat(item.monthlyInterestAmount || item.monthly_interest_amount) || Math.round(loanAmt * (monthlyRate / 100));
          const grossVal = parseFloat(item.totalEstimatedValue || item.total_estimated_value || item.grossValue || item.gross_value) || 0;
          const grossWt = parseFloat(item.totalGrossWeight || item.total_gross_weight || item.grossWeight || item.gross_weight) || 0;
          const netWt = parseFloat(item.totalNetWeight || item.total_net_weight || item.netWeight || item.net_weight) || grossWt;
          const stoneWt = parseFloat(item.totalStoneWeight || item.total_stone_weight || item.stoneWeight || item.stone_weight) || Math.max(0, grossWt - netWt);
          const ticketNo = item.ticketNo || item.ticket_no || item.pledgeId || item.pledge_id || item.id;

          return {
            ticketNo: ticketNo,
            customerId: item.customerId || item.customer_id,
            pledgeDate: item.pledgeDate || item.pledge_date || (item.createdAt ? item.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
            maturityDate: item.maturityDate || item.maturity_date || '',
            tenureMonths: parseInt(item.tenureMonths || item.tenure_months) || 12,
            totalGrossWeight: grossWt,
            totalStoneWeight: stoneWt,
            totalNetWeight: netWt,
            rateGold24k: parseFloat(item.rateGold24k || item.rate_gold_24k) || 15958,
            rateGold22k: parseFloat(item.rateGold22k || item.rate_gold_22k) || 14628,
            rateSilver: parseFloat(item.rateSilver || item.rate_silver) || 243.90,
            rateUsed: parseFloat(item.rateUsed || item.rate_used || item.rateGold22k || item.rate_gold_22k) || 14628,
            grossValue: grossVal,
            totalEstimatedValue: grossVal,
            appraiserFee: parseFloat(item.appraiserFee || item.appraiser_fee) || 0,
            otherFees: parseFloat(item.otherFees || item.other_fees) || 0,
            totalFees: parseFloat(item.totalFees || item.total_fees) || 0,
            loanPercentage: parseFloat(item.loanPercentage || item.loan_percentage || item.ltvPercent || item.ltv_percent) || 75,
            eligibleLoan: parseFloat(item.eligibleLoan || item.eligible_loan || item.totalEligibleLoan || item.total_eligible_loan) || 0,
            approvedLoan: loanAmt,
            loanAmount: loanAmt,
            principalDisbursed: loanAmt,
            disbursementMode: item.disbursementMode || item.disbursement_mode || 'CASH',
            disbursementRefNo: item.disbursementRefNo || item.disbursement_ref_no || '',
            feeDeductionMode: item.feeDeductionMode || item.fee_deduction_mode || 'DEDUCT_FROM_DISBURSEMENT',
            netDisbursementAmount: parseFloat(item.netDisbursementAmount || item.net_disbursement_amount) || loanAmt,
            monthlyInterestRate: monthlyRate,
            monthlyInterestAmount: monthlyIntAmt,
            status: item.status || 'ACTIVE',
            closedDate: item.closedDate || item.closed_date || '',
            closedReason: item.closedReason || item.closed_reason || '',
            vaultLocation: item.vaultLocation || item.vault_location || 'Vault A',
            locker: item.locker || 'Locker 01',
            tray: item.tray || 'Tray 01',
            lockerTray: item.lockerTray || item.locker_tray || 'Locker 01 • Tray 01',
            packetId: item.packetId || item.packet_id || 'PKT-0001',
            locationNote: item.locationNote || item.location_note || 'Standard pouch',
            packetStatus: item.packetStatus || item.packet_status || 'IN_VAULT',
            createdAt: item.createdAt || item.created_at || new Date().toISOString(),
            createdBy: item.createdBy || item.created_by || 'ADMIN',
            items: Array.isArray(item.items) ? item.items : [
              {
                itemId: `ITM-${ticketNo}-01`,
                itemType: 'Gold Jewellery',
                purity: '22K',
                grossWeight: grossWt,
                stoneWeight: stoneWt,
                netWeight: netWt,
                rateUsed: 14628,
                estimatedValue: grossVal
              }
            ]
          };
        });

        const merged = [...remoteList];
        this.pledges.forEach(localPlg => {
          if (!merged.some(r => r.ticketNo === localPlg.ticketNo)) {
            merged.push(localPlg);
          }
        });

        this.pledges = merged;
        this.savePledges(this.pledges);

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pledgesSynced', { detail: this.pledges }));
        }
        return this.pledges;
      }
    } catch (e) {
      console.warn('Backend pledge sync notice:', e);
    }
    return this.pledges;
  }

  loadInitialPledges() {
    try {
      const stored = localStorage.getItem(this.storageKeyPledges);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load stored pledges', e);
    }

    this.savePledges([]);
    return [];
  }

  savePledges(pledgesList) {
    this.pledges = pledgesList;
    try {
      localStorage.setItem(this.storageKeyPledges, JSON.stringify(pledgesList));
    } catch (e) {
      console.warn('Failed to save pledges to localStorage', e);
    }
    // Mirror to IndexedDB pledgesStore
    if (typeof window !== 'undefined' && window.offlineDB && typeof window.offlineDB.putRecord === 'function') {
      pledgesList.forEach(p => {
        window.offlineDB.putRecord('pledgesStore', p).catch(e => console.warn(e));
      });
    }
  }

  /**
   * Reset POS Form State
   */
  resetPos() {
    this.items = [];
    this.selectedCustomer = null;
    this.itemPhotos = [];
    this.isSubmitting = false;
    this.customAppraiserFee = null;
    this.customOtherFee = null;
    this.feeDeductionMode = null;
  }

  /**
   * Calculate single pledge item values
   */
  calculateItem(item, rate24k, rate22k, rateSilver) {
    const ltv = parseFloat(localStorage.getItem('as_jewellar_ltv_percent')) || this.loanPercentage;
    return PledgeValuationEngine.calculateItem(item, rate24k, rate22k, rateSilver, ltv);
  }

  /**
   * Add Item to POS State
   */
  addItem(itemData, rate24k, rate22k, rateSilver) {
    const calculated = this.calculateItem(itemData, rate24k, rate22k, rateSilver);
    this.items.push(calculated);
    return this.getAggregateTotals();
  }

  removeItem(index) {
    if (index >= 0 && index < this.items.length) {
      this.items.splice(index, 1);
    }
    return this.getAggregateTotals();
  }

  /**
   * Calculate Full Aggregate Totals & Valuation Breakdown
   */
  getAggregateTotals(options = {}) {
    const rates = window.ratesManager?.rates || {
      gold24k: 15958,
      gold22k: 14628,
      silver1g: 243.90
    };

    const appraiserFeeType = localStorage.getItem('as_jewellar_appraiser_fee_type') || 'FIXED';
    const appraiserFeeVal = localStorage.getItem('as_jewellar_appraiser_fee_val') || '150';
    const otherFeeType = localStorage.getItem('as_jewellar_other_fee_type') || 'NONE';
    const otherFeeVal = localStorage.getItem('as_jewellar_other_fee_val') || '0';
    const feeMode = options.feeDeductionMode || this.feeDeductionMode || localStorage.getItem('as_jewellar_fee_mode') || 'DEDUCT_FROM_DISBURSEMENT';
    const ltvPercent = options.ltvPercent || parseFloat(localStorage.getItem('as_jewellar_ltv_percent')) || this.loanPercentage;

    const breakdown = PledgeValuationEngine.calculateValuation({
      items: this.items,
      rateGold24k: rates.gold24k,
      rateGold22k: rates.gold22k,
      rateSilver: rates.silver1g,
      appraiserFeeType,
      appraiserFeeValue: appraiserFeeVal,
      appraiserFeeOverride: (options.appraiserFeeOverride !== undefined) ? options.appraiserFeeOverride : this.customAppraiserFee,
      otherFeeType,
      otherFeeValue: otherFeeVal,
      otherFeeOverride: (options.otherFeeOverride !== undefined) ? options.otherFeeOverride : this.customOtherFee,
      feeDeductionMode: feeMode,
      ltvPercent,
      approvedLoanOverride: options.approvedLoanOverride,
      monthlyInterestRate: options.monthlyInterestRate || this.monthlyInterestRate
    });

    return breakdown;
  }

  /**
   * Validate entire transaction before submission
   */
  validatePledge(data) {
    if (!data.customerId) {
      return { valid: false, message: 'Please select a customer for this pawn ticket' };
    }

    if (!data.items || data.items.length === 0) {
      return { valid: false, message: 'Please add at least one jewellery item to pledge' };
    }

    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      if (it.grossWeight <= 0) {
        return { valid: false, message: `Item #${i + 1} (${it.itemType}) must have gross weight > 0` };
      }
      if (it.stoneWeight > it.grossWeight) {
        return { valid: false, message: `Item #${i + 1}: Stone weight cannot exceed gross weight` };
      }
    }

    const loanAmt = parseFloat(data.loanAmount || data.approvedLoan) || 0;
    if (loanAmt <= 0) {
      return { valid: false, message: 'Approved loan amount must be greater than ₹ 0' };
    }

    // High LTV override validation
    const maxEligible = parseFloat(data.eligibleLoan || data.totalEligibleLoan || data.maxLoan) || 0;
    if (loanAmt > maxEligible && !data.allowLtvOverride) {
      return {
        valid: false,
        message: `Approved loan (₹${loanAmt.toLocaleString('en-IN')}) exceeds maximum eligible limit (₹${maxEligible.toLocaleString('en-IN')}). Enable High-LTV override if authorized.`
      };
    }

    // Disbursement Mode Validation
    const disMode = data.disbursementMode || 'CASH';
    const disRef = (data.disbursementRefNo || '').trim();
    if (typeof PaymentMethodManager !== 'undefined' && typeof PaymentMethodManager.getMethod === 'function') {
      const method = PaymentMethodManager.getMethod(disMode);
      if (method && method.refRule === 'REQUIRED' && !disRef) {
        return { valid: false, message: `Reference / UTR / Cheque number is required for ${method.labelEn || method.nameEn || disMode} loan disbursement` };
      }
    } else if (disMode === 'BANK_TRANSFER' && !disRef) {
      return { valid: false, message: 'Reference / UTR number is required for Bank Transfer loan disbursement' };
    }

    return { valid: true };
  }

  /**
   * Submit & Generate Pawn Ticket
   */
  /**
   * Submit & Generate Pawn Ticket
   */
  async submitPledge(payload) {
    if (this.isSubmitting) {
      return { success: false, message: 'Transaction is already being processed. Please wait...' };
    }

    this.isSubmitting = true;

    // 1. Validation Check
    const val = this.validatePledge(payload);
    if (!val.valid) {
      this.isSubmitting = false;
      return { success: false, message: val.message };
    }

    const year = new Date().getFullYear();
    const seq = (this.pledges.length + 1).toString().padStart(6, '0');
    const ticketNo = `PLG-${year}-${seq}`;
    const uniqueSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    const idempotencyKey = payload.idempotencyKey || `IDEMP-PLG-${Date.now()}-${uniqueSuffix}`;
    const localTxId = `LOCAL-PLG-${Date.now()}-${uniqueSuffix}`;

    const now = new Date();
    const pledgeDate = now.toISOString().split('T')[0];
    const maturityDate = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    const approvedLoanAmt = parseFloat(payload.approvedLoan || payload.loanAmount) || 0;
    const grossVal = parseFloat(payload.grossValue || payload.grossEstimatedValue || payload.totalEstimatedValue) || 0;
    const appFee = parseFloat(payload.appraiserFee) || 0;
    const othFee = parseFloat(payload.otherFees) || 0;
    const totFees = appFee + othFee;
    const netEligible = parseFloat(payload.netEligibleValue) || Math.max(0, grossVal - totFees);
    const maxLoan = parseFloat(payload.eligibleLoan || payload.totalEligibleLoan || payload.maxLoan) || 0;
    const feeMode = payload.feeDeductionMode || 'DEDUCT_FROM_DISBURSEMENT';
    const netDisbursed = (feeMode === 'DEDUCT_FROM_DISBURSEMENT')
      ? Math.max(0, approvedLoanAmt - totFees)
      : approvedLoanAmt;

    const disbursementMode = payload.disbursementMode || 'CASH';
    const disbursementRefNo = (payload.disbursementRefNo || '').trim();

    const isAppOffline = (typeof navigator !== 'undefined' && !navigator.onLine);
    const rateSource = payload.rateSource || (isAppOffline ? 'CACHED' : ((window.rateManager && window.rateManager.activeRates && window.rateManager.activeRates.source) || 'LIVE_API'));
    const rateStatus = isAppOffline ? 'CACHED_OFFLINE' : 'ACTIVE';

    const newPledgeRecord = {
      ticketNo,
      localTxId,
      customerId: payload.customerId,
      idempotencyKey,
      pledgeDate: payload.pledgeDate || pledgeDate,
      maturityDate: payload.maturityDate || maturityDate,
      tenureMonths: payload.tenureMonths || 12,
      totalGrossWeight: payload.totalGrossWeight,
      totalStoneWeight: payload.totalStoneWeight,
      totalNetWeight: payload.totalNetWeight,
      rateGold24k: payload.rateGold24k || 15958,
      rateGold22k: payload.rateGold22k || 14628,
      rateSilver: payload.rateSilver || 243.90,
      rateUsed: payload.rateGold22k || 14628,
      rateSource,
      rateStatus,
      isOfflineRecord: isAppOffline,
      
      // Valuation & Fee Attributes
      grossValue: grossVal,
      totalEstimatedValue: grossVal,
      appraiserFee: appFee,
      otherFees: othFee,
      totalFees: totFees,
      grossEligibleValue: grossVal,
      netEligibleValue: netEligible,
      loanPercentage: payload.loanPercentage || 75,
      eligibleLoan: maxLoan,
      totalEligibleLoan: maxLoan,
      approvedLoan: approvedLoanAmt,
      loanAmount: approvedLoanAmt,
      principalDisbursed: approvedLoanAmt,
      disbursementMode: disbursementMode,
      disbursementRefNo: disbursementRefNo,
      feeDeductionMode: feeMode,
      netDisbursementAmount: netDisbursed,

      monthlyInterestRate: payload.monthlyInterestRate || 1.0,
      monthlyInterestAmount: payload.monthlyInterestAmount,
      status: 'ACTIVE',
      vaultLocation: payload.vaultLocation || 'Vault A',
      locker: payload.locker || (payload.lockerTray ? payload.lockerTray.split('•')[0].trim() : 'Locker 01'),
      tray: payload.tray || (payload.lockerTray && payload.lockerTray.includes('•') ? payload.lockerTray.split('•')[1].trim() : 'Tray 01'),
      lockerTray: payload.lockerTray || `${payload.locker || 'Locker 01'} • ${payload.tray || 'Tray 01'}`,
      packetId: payload.packetId || `PKT-${seq.slice(-4)}`,
      locationNote: payload.locationNote || 'Standard pouch',
      packetStatus: 'IN_VAULT',
      createdAt: new Date().toISOString(),
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      itemPhotos: payload.itemPhotos || [],
      items: (payload.items || []).map((it, idx) => ({
        itemId: `ITM-${ticketNo}-${(idx + 1).toString().padStart(2, '0')}`,
        status: 'ACTIVE',
        ...it
      }))
    };

    // Save to local store
    this.pledges.unshift(newPledgeRecord);
    this.savePledges(this.pledges);

    // Auto-register item photos into DocumentManager
    if (payload.itemPhotos && payload.itemPhotos.length > 0 && typeof window !== 'undefined' && window.documentManager && typeof window.documentManager.uploadDocument === 'function') {
      payload.itemPhotos.forEach((photoDataUrl, pIdx) => {
        window.documentManager.uploadDocument({
          customerId: payload.customerId,
          docType: 'PLEDGE_ITEM_PHOTO',
          docTitle: `Pledge Item Photo #${pIdx + 1} (${ticketNo})`,
          pledgeId: ticketNo,
          fileName: `Pledge_Item_${ticketNo}_${pIdx + 1}.jpg`,
          fileDataUrl: photoDataUrl,
          fileSize: Math.round((photoDataUrl.length * 3) / 4)
        }).catch(e => console.warn('Item photo doc registration:', e));
      });
    }

    // Initialize Vault Packet Record & Movement Audit Log
    if (typeof window !== 'undefined' && window.vaultManager && typeof window.vaultManager.assignPacket === 'function') {
      window.vaultManager.assignPacket(ticketNo, {
        vaultLocation: newPledgeRecord.vaultLocation,
        locker: newPledgeRecord.locker,
        tray: newPledgeRecord.tray,
        packetId: newPledgeRecord.packetId,
        locationNote: newPledgeRecord.locationNote
      }, newPledgeRecord.createdBy);
    }

    // Record in physical cash drawer management only if mode is physical CASH
    if (disbursementMode === 'CASH' && typeof window !== 'undefined' && window.cashManager && typeof window.cashManager.recordLoanDisbursement === 'function') {
      window.cashManager.recordLoanDisbursement(netDisbursed, ticketNo);
    }

    // Update customer's active stats in CustomerManager
    if (typeof window !== 'undefined' && window.customerManager) {
      const cust = window.customerManager.getCustomerById(payload.customerId);
      if (cust) {
        cust.activePledgesCount = (cust.activePledgesCount || 0) + 1;
        cust.totalOutstanding = (cust.totalOutstanding || 0) + approvedLoanAmt;
        cust.totalGoldWeight = Math.round(((cust.totalGoldWeight || 0) + (payload.totalNetWeight || 0)) * 1000) / 1000;
        cust.lifetimeLoanTotal = (cust.lifetimeLoanTotal || 0) + approvedLoanAmt;
        cust.vaultPlacement = `${newPledgeRecord.vaultLocation} • ${newPledgeRecord.lockerTray} • Packet ${newPledgeRecord.packetId}`;
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // Sync with backend API or offline queue
    let apiResult = null;
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      apiResult = await window.api.post('createPledge', newPledgeRecord).catch(err => {
        console.warn('Background sync notice for pledge:', err);
        return null;
      });
    }

    const isQueued = isAppOffline || (apiResult && apiResult.offlineQueued);
    const message = isQueued
      ? 'Pledge saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
      : 'Pledge created successfully';

    this.isSubmitting = false;
    return {
      success: true,
      pledge: newPledgeRecord,
      ticketNo,
      localTxId,
      idempotencyKey,
      offlineQueued: Boolean(isQueued),
      syncStatus: isQueued ? 'PENDING' : 'SYNCED',
      message
    };
  }

  async createPledge(payload) {
    return this.submitPledge(payload);
  }

  getPledge(ticketNo) {
    return this.pledges.find(p => p.ticketNo === ticketNo) || null;
  }

  /**
   * Generate Printable Bilingual Pawn Ticket (Form F Statutory Standard)
   */
  generatePawnTicketHtml(pledge, customer) {
    if (window.billingManager) {
      return window.billingManager.renderPawnTicket(pledge, customer, 'A4');
    }

    const custName = customer ? `${customer.nameEn} / ${customer.nameTa || ''}` : pledge.customerId;
    const custMobile = customer ? customer.mobile : '-';
    const custAddress = customer ? `${customer.address}, ${customer.townVillage} - ${customer.pincode}` : '-';

    const itemsList = Array.isArray(pledge.items) ? pledge.items : [];
    const itemsRows = itemsList.map((it, idx) => `
      <tr>
        <td style="text-align:center;">${idx + 1}</td>
        <td><strong>${it.itemType || 'Article'}</strong> (${it.purity || '22K'})<br/><span style="font-size:10px; color:#555;">${it.description || ''}</span></td>
        <td style="text-align:right; font-family:monospace;">${Number(it.grossWeight || 0).toFixed(3)} g</td>
        <td style="text-align:right; font-family:monospace;">${Number(it.stoneWeight || 0).toFixed(3)} g</td>
        <td style="text-align:right; font-family:monospace; font-weight:bold;">${Number(it.netWeight || 0).toFixed(3)} g</td>
        <td style="text-align:right;">₹ ${Number(it.rateUsed || 0).toLocaleString('en-IN')}</td>
        <td style="text-align:right; font-weight:bold;">₹ ${Number(it.estimatedValue || 0).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const feeText = (pledge.feeDeductionMode === 'COLLECT_SEPARATELY')
      ? `Appraiser Fee ₹${(pledge.appraiserFee || 0).toLocaleString('en-IN')} collected separately at counter`
      : `Appraiser Fee ₹${(pledge.appraiserFee || 0).toLocaleString('en-IN')} deducted from loan disbursement`;

    return `
      <div class="pawn-ticket-print" style="font-family:'Mukta Malar', 'Noto Sans Tamil', sans-serif; padding:16px; color:#0F172A; max-width:800px; margin:0 auto; line-height:1.4;">
        
        <!-- Header -->
        <div style="text-align:center; border-bottom:2px solid #0F172A; padding-bottom:12px; margin-bottom:12px;">
          <h2 style="margin:0; font-size:22px; font-weight:900; letter-spacing:0.5px;">AS JEWELLAR PAWN SHOP</h2>
          <div style="font-size:13px; font-weight:700; color:#B8860B;">ஏ.எஸ் ஜூவல்லர்ஸ் &bull; அடகு கடை & நகை மாளிகை</div>
          <div style="font-size:11px; color:#475569; margin-top:2px;">No. 14, Main Bazaar, Madurai - 625001 &bull; Phone: 0452-2345678 &bull; Pawn Broker Lic No: PB/MDU/2026/042</div>
          <div style="display:inline-block; border:1px solid #0F172A; padding:2px 16px; font-size:12px; font-weight:800; text-transform:uppercase; margin-top:6px; background:#F8FAFC;">
            PAWN TICKET &bull; அடகு ரசீது (FORM F - RULE 8)
          </div>
        </div>

        <!-- Ticket Details Meta -->
        <div style="display:flex; justify-content:space-between; margin-bottom:12px; font-size:12px;">
          <div style="flex:1;">
            <div><strong>Pawn Ticket No / சீட்டு எண்:</strong> <span style="font-family:monospace; font-size:14px; font-weight:bold;">${pledge.ticketNo}</span></div>
            <div><strong>Pledge Date / அடகு தேதி:</strong> ${pledge.pledgeDate}</div>
            <div><strong>Maturity Date / கெடு தேதி:</strong> ${pledge.maturityDate} (12 Months)</div>
            <div><strong>Packet / பெட்டக எண்:</strong> ${pledge.packetId} (${pledge.vaultLocation})</div>
          </div>
          <div style="flex:1; text-align:right;">
            <div><strong>Customer ID:</strong> <span style="font-family:monospace;">${pledge.customerId}</span></div>
            <div><strong>Borrower / பெயர்:</strong> <span style="font-weight:bold;">${custName}</span></div>
            <div><strong>Phone / கைபேசி:</strong> ${custMobile}</div>
            <div><strong>Address:</strong> <span style="font-size:11px;">${custAddress}</span></div>
          </div>
        </div>

        <!-- Pledged Items Table -->
        <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px;" border="1" cellpadding="6">
          <thead>
            <tr style="background:#F1F5F9;">
              <th style="width:5%;">#</th>
              <th>Pledged Item Description / நகை விவரம்</th>
              <th style="text-align:right; width:12%;">Gross Wt (கி)</th>
              <th style="text-align:right; width:12%;">Stone Wt (கி)</th>
              <th style="text-align:right; width:12%;">Net Wt (கி)</th>
              <th style="text-align:right; width:14%;">Rate / கி</th>
              <th style="text-align:right; width:16%;">Valuation (மதிப்பு)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold; background:#F8FAFC;">
              <td colspan="2" style="text-align:right;">TOTALS / மொத்தம்:</td>
              <td style="text-align:right; font-family:monospace;">${Number(pledge.totalGrossWeight || 0).toFixed(3)} g</td>
              <td style="text-align:right; font-family:monospace;">${Number(pledge.totalStoneWeight || 0).toFixed(3)} g</td>
              <td style="text-align:right; font-family:monospace; color:#B8860B; font-size:12px;">${Number(pledge.totalNetWeight || 0).toFixed(3)} g</td>
              <td></td>
              <td style="text-align:right; font-size:12px;">₹ ${Number(pledge.grossValue || pledge.totalEstimatedValue || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Valuation & Fee Breakdown -->
        <div style="background:#F8FAFC; border:1px solid #CBD5E1; border-radius:6px; padding:8px 12px; margin-bottom:10px; font-size:11px; display:flex; justify-content:space-between;">
          <div>
            <div><strong>Gross Valuation:</strong> ₹ ${Number(pledge.grossValue || pledge.totalEstimatedValue || 0).toLocaleString('en-IN')}</div>
            <div><strong>Gold Appraiser Fee:</strong> ₹ ${Number(pledge.appraiserFee || 0).toLocaleString('en-IN')}${pledge.otherFees ? ` + Other Fee: ₹${Number(pledge.otherFees).toLocaleString('en-IN')}` : ''}</div>
          </div>
          <div style="text-align:right;">
            <div><strong>Net Eligible Value:</strong> ₹ ${Number(pledge.netEligibleValue || (pledge.grossValue - (pledge.totalFees || 0))).toLocaleString('en-IN')}</div>
            <div><strong>Loan-to-Value (LTV):</strong> ${pledge.loanPercentage || 75}%</div>
          </div>
        </div>

        <!-- Loan Summary Box -->
        <div style="background:#FEF3C7; border:1px solid #F59E0B; border-radius:6px; padding:10px 14px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#92400E; font-weight:bold;">Approved Principal Loan (அங்கீகரிக்கப்பட்ட கடன்)</div>
            <div style="font-size:20px; font-weight:900; color:#78350F;">₹ ${Number(pledge.approvedLoan || pledge.loanAmount || 0).toLocaleString('en-IN')}</div>
            <div style="font-size:10px; color:#6B7280; margin-top:2px;">${feeText}</div>
          </div>
          <div>
            <div><strong>Disbursement Mode:</strong> <span style="font-weight:bold; color:#0369A1;">${pledge.disbursementMode || 'CASH'}${pledge.disbursementRefNo ? ` (Ref: ${pledge.disbursementRefNo})` : ''}</span></div>
            <div><strong>Net Disbursed to Borrower:</strong> <span style="font-size:16px; font-weight:900; color:#15803D;">₹ ${Number(pledge.netDisbursementAmount || pledge.loanAmount || 0).toLocaleString('en-IN')}</span></div>
            <div><strong>Monthly Interest:</strong> <strong style="color:#B8860B;">₹ ${Number(pledge.monthlyInterestAmount || 0).toLocaleString('en-IN')}</strong> (${pledge.monthlyInterestRate || 1.0}% / mo)</div>
          </div>
          <div style="text-align:right;">
            <div><strong>Status:</strong> <span style="background:#15803D; color:#FFF; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">ACTIVE</span></div>
          </div>
        </div>

        <!-- Statutory Terms in Tamil & English -->
        <div style="font-size:9.5px; color:#475569; line-height:1.3; border-top:1px dashed #CBD5E1; padding-top:8px; margin-bottom:24px;">
          <p style="margin:0 0 4px 0;"><strong>விதிமுறைகள் (Terms & Conditions):</strong></p>
          <ol style="margin:0; padding-left:14px;">
            <li>அடகு வைக்கப்பட்ட நகைகளை 12 மாத காலத்திற்குள் அசல் மற்றும் வட்டி செலுத்தி மீட்டுக்கொள்ள வேண்டும். (Loans must be redeemed within 12 months with interest).</li>
            <li>மாதாந்திர வட்டி தவறாமல் செலுத்தப்பட வேண்டும். (Interest should be paid regularly each month).</li>
            <li>கெடு முடிந்த பின்னரும் வட்டி செலுத்தாத நகைகள் சட்டப்படி ஏலத்திற்கு விடப்படும். (Unredeemed articles after maturity will be subject to statutory public auction).</li>
          </ol>
        </div>

        <!-- Signatures Block -->
        <div style="display:flex; justify-content:space-between; margin-top:30px; padding-top:10px; font-size:11px; font-weight:bold;">
          <div style="text-align:center; width:220px; border-top:1px solid #0F172A; padding-top:4px;">
            Customer / Borrower Signature<br/>(வாடிக்கையாளர் கையொப்பம்)
          </div>
          <div style="text-align:center; width:220px; border-top:1px solid #0F172A; padding-top:4px;">
            For AS JEWELLAR PAWN SHOP<br/>(Authorised Signatory / நிர்வாகி)
          </div>
        </div>

      </div>
    `;
  }
}

// Global PledgePosManager & Engine Instances
if (typeof window !== 'undefined') {
  window.PledgeValuationEngine = PledgeValuationEngine;
  window.PledgePosManager = PledgePosManager;
  window.PledgeManager = PledgePosManager;
  window.pledgePosManager = new PledgePosManager();
  window.pledgeManager = window.pledgePosManager;
}
if (typeof global !== 'undefined') {
  global.PledgeValuationEngine = PledgeValuationEngine;
  global.PledgePosManager = PledgePosManager;
  global.PledgeManager = PledgePosManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PledgeValuationEngine,
    PledgePosManager,
    PledgeManager: PledgePosManager
  };
}
