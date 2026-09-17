/**
 * AS JEWELLAR PAWN SHOP - AUTHORITATIVE FINANCIAL CALCULATION ENGINE
 * Centralized, pure, deterministic calculation model used across:
 * - New Pledge POS & Booking
 * - Payments & Partial Payment Allocations
 * - Renewals (Rollover & Interest Settlement)
 * - Redemptions (Full Settlement & Article Handover)
 * - Statutory Pawn Tickets (Form F / Rule 8)
 * - Counter Receipts (A4 & 80mm POS Thermal)
 * - Reports, Day-Book & Portfolio Risk Analytics
 * - Backend Google Apps Script Validation & Recalculation
 * 
 * STANDARD FORMULAS:
 * 1. Net Weight (3-dec precision): Net = max(0, round((Gross - Stone) * 1000) / 1000)
 * 2. Item Valuation: Item Value = round(Net Weight * Purity Rate)
 * 3. Gross Valuation: Gross Value = sum(Item Values)
 * 4. Total Fees: Total Fees = Appraiser Fee + Other Applicable Fees
 * 5. Net Eligible Value: Net Eligible Value = max(0, Gross Value - Total Fees)
 * 6. Maximum Eligible Loan: Max Loan = round(Net Eligible Value * (LTV% / 100))
 * 7. Approved Loan: Actual Sanctioned Pledge Principal (<= Max Loan unless override)
 * 8. Net Disbursement:
 *    - DEDUCT_FROM_DISBURSEMENT: Net Disbursed = max(0, Approved Loan - Total Fees)
 *    - COLLECT_SEPARATELY: Net Disbursed = Approved Loan
 * 9. Monthly Interest: Monthly Int = round((Approved Loan * Monthly Rate) / 100)
 * 10. Accrued Interest: Accrued = round(Principal * (Monthly Rate / 100) * (max(1, Days Elapsed) / 30))
 * 11. Net Interest Due: Net Int Due = max(0, Accrued - Previously Paid Interest)
 * 12. Balance Due: Total Due = Remaining Principal + Net Interest Due
 */

var FinancialCalculator = class FinancialCalculator {
  /**
   * Round weight to specified decimal places (Standard: 3 decimals / milligrams)
   */
  static roundWeight(val, precision = 3) {
    const num = parseFloat(val);
    if (isNaN(num) || num <= 0) return 0;
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  /**
   * Round monetary currency amount (Standard: nearest integer rupee or 2 decimals)
   */
  static roundCurrency(val, precision = 0) {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    if (precision === 0) return Math.round(num);
    const factor = Math.pow(10, precision);
    return Math.round(num * factor) / factor;
  }

  /**
   * Determine exact rate per gram based on metal category and purity standard
   */
  static getPurityRate(category, purity, rateGold24k = 15958, rateGold22k = 14628, rateSilver = 243.90) {
    const cat = String(category || 'GOLD').toUpperCase();
    const pur = String(purity || '22K').toUpperCase();

    const r24 = parseFloat(rateGold24k) || 15958;
    const r22 = parseFloat(rateGold22k) || 14628;
    const rSil = parseFloat(rateSilver) || 243.90;

    if (cat === 'SILVER') {
      if (pur === 'SILVER_925' || pur === '925' || pur === '92.5%') {
        return Math.round(rSil * 0.925 * 100) / 100;
      }
      return rSil;
    }

    // GOLD
    if (pur === '24K' || pur === 'FINE' || pur === '999') {
      return r24;
    }
    if (pur === '22K' || pur === '916' || pur === 'HALLMARK') {
      return r22;
    }
    if (pur === '18K' || pur === '750') {
      return Math.round(r24 * (18 / 24) * 100) / 100;
    }
    if (pur === '14K' || pur === '585') {
      return Math.round(r24 * (14 / 24) * 100) / 100;
    }

    // Check numeric karat string (e.g. "20K")
    const match = pur.match(/^(\d+(\.\d+)?)K?$/);
    if (match) {
      const k = parseFloat(match[1]);
      if (k > 0 && k <= 24) {
        return Math.round(r24 * (k / 24) * 100) / 100;
      }
    }

    // Default to 22K 916 rate
    return r22;
  }

  /**
   * Calculate single jewellery item valuation
   * Supports both calculateItem(item, { gold24k, gold22k, silver }, ltv)
   * and legacy calculateItem(item, rate24k, rate22k, rateSilver, ltv)
   */
  static calculateItem(item = {}, rates = {}, arg3, arg4, arg5) {
    const gross = this.roundWeight(item.grossWeight, 3);
    const stone = this.roundWeight(item.stoneWeight, 3);
    const net = Math.max(0, this.roundWeight(gross - stone, 3));

    let rate24k = 15958;
    let rate22k = 14628;
    let rateSilver = 243.90;
    let ltvPercent = 75;

    if (typeof rates === 'number') {
      rate24k = rates;
      rate22k = typeof arg3 === 'number' ? arg3 : 14628;
      rateSilver = typeof arg4 === 'number' ? arg4 : 243.90;
      ltvPercent = typeof arg5 === 'number' ? arg5 : 75;
    } else if (typeof rates === 'object' && rates !== null) {
      rate24k = parseFloat(rates.gold24k || rates.rateGold24k) || 15958;
      rate22k = parseFloat(rates.gold22k || rates.rateGold22k) || 14628;
      rateSilver = parseFloat(rates.silver || rates.rateSilver) || 243.90;
      ltvPercent = parseFloat(arg3) || parseFloat(rates.ltvPercent) || 75;
    }

    const rateUsed = (item.rateUsed !== undefined && item.rateUsed !== null && item.rateUsed !== '' && !(rates && rates.forceRecalculateRate))
      ? parseFloat(item.rateUsed)
      : this.getPurityRate(item.category, item.purity, rate24k, rate22k, rateSilver);

    const estimatedValue = this.roundCurrency(net * rateUsed, 0);
    const ltv = parseFloat(ltvPercent) || 75;
    const eligibleLoan = this.roundCurrency(estimatedValue * (ltv / 100), 0);

    return {
      category: item.category || 'GOLD',
      itemType: item.itemType || 'Jewellery',
      description: item.description || '',
      purity: item.purity || '22K',
      grossWeight: gross,
      stoneWeight: stone,
      netWeight: net,
      rateUsed: rateUsed,
      estimatedValue: estimatedValue,
      eligibleLoan: eligibleLoan
    };
  }

  /**
   * Calculate complete multi-item pledge valuation & fee structure
   */
  static calculateValuation({
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
  } = {}) {
    const rates = {
      gold24k: rateGold24k,
      gold22k: rateGold22k,
      silver: rateSilver
    };

    let totalGrossWeight = 0;
    let totalStoneWeight = 0;
    let totalNetWeight = 0;
    let grossEstimatedValue = 0;

    const calculatedItems = (items || []).map((it, idx) => {
      const calc = this.calculateItem(it, rates, ltvPercent);
      totalGrossWeight += calc.grossWeight;
      totalStoneWeight += calc.stoneWeight;
      totalNetWeight += calc.netWeight;
      grossEstimatedValue += calc.estimatedValue;
      return {
        ...calc,
        itemIndex: idx + 1
      };
    });

    totalGrossWeight = this.roundWeight(totalGrossWeight, 3);
    totalStoneWeight = this.roundWeight(totalStoneWeight, 3);
    totalNetWeight = this.roundWeight(totalNetWeight, 3);
    grossEstimatedValue = this.roundCurrency(grossEstimatedValue, 0);

    // 1. Appraiser Fee Calculation
    let appraiserFee = 0;
    if (appraiserFeeOverride !== null && appraiserFeeOverride !== undefined && appraiserFeeOverride !== '') {
      appraiserFee = Math.max(0, parseFloat(appraiserFeeOverride) || 0);
    } else {
      if (appraiserFeeType === 'FIXED') {
        appraiserFee = Math.max(0, parseFloat(appraiserFeeValue) || 0);
      } else if (appraiserFeeType === 'PERCENTAGE') {
        appraiserFee = this.roundCurrency(grossEstimatedValue * ((parseFloat(appraiserFeeValue) || 0) / 100), 0);
      } else {
        appraiserFee = 0;
      }
    }

    // 2. Other Applicable Fee Calculation
    let otherFees = 0;
    if (otherFeeOverride !== null && otherFeeOverride !== undefined && otherFeeOverride !== '') {
      otherFees = Math.max(0, parseFloat(otherFeeOverride) || 0);
    } else {
      if (otherFeeType === 'FIXED') {
        otherFees = Math.max(0, parseFloat(otherFeeValue) || 0);
      } else if (otherFeeType === 'PERCENTAGE') {
        otherFees = this.roundCurrency(grossEstimatedValue * ((parseFloat(otherFeeValue) || 0) / 100), 0);
      } else {
        otherFees = 0;
      }
    }

    // 3. Gross Eligible Value & Total Fees
    const totalFees = this.roundCurrency(appraiserFee + otherFees, 0);
    const grossEligibleValue = grossEstimatedValue;

    // 4. Net Eligible Value
    const netEligibleValue = Math.max(0, this.roundCurrency(grossEligibleValue - totalFees, 0));

    // 5. Loan-to-Value % & Maximum Eligible Loan
    const loanPercentage = parseFloat(ltvPercent) || 75;
    const eligibleLoan = this.roundCurrency(netEligibleValue * (loanPercentage / 100), 0);
    const maxLoan = eligibleLoan;

    // 6. Approved Loan Amount (Pledge Principal)
    let approvedLoan = eligibleLoan;
    if (approvedLoanOverride !== null && approvedLoanOverride !== undefined && approvedLoanOverride !== '') {
      approvedLoan = Math.max(0, parseFloat(approvedLoanOverride) || 0);
    }

    // 7. Net Cash Disbursed to Borrower
    const deductionMode = feeDeductionMode || 'DEDUCT_FROM_DISBURSEMENT';
    let netDisbursementAmount = approvedLoan;
    if (deductionMode === 'DEDUCT_FROM_DISBURSEMENT') {
      netDisbursementAmount = Math.max(0, this.roundCurrency(approvedLoan - totalFees, 0));
    } else {
      netDisbursementAmount = approvedLoan;
    }

    // 8. Monthly Interest Rate & Monthly Amount
    const mRate = parseFloat(monthlyInterestRate) || 1.0;
    const monthlyInterestAmount = this.roundCurrency((approvedLoan * mRate) / 100, 0);

    return {
      items: calculatedItems,
      itemCount: calculatedItems.length,
      totalGrossWeight,
      totalStoneWeight,
      totalNetWeight,
      rateGold24k,
      rateGold22k,
      rateSilver,
      rateUsed: rateGold22k,
      grossEstimatedValue,
      grossValue: grossEstimatedValue,
      grossValuation: grossEstimatedValue,
      totalEstimatedValue: grossEstimatedValue,
      appraiserFeeType,
      appraiserFeeValue: parseFloat(appraiserFeeValue) || 0,
      appraiserFee,
      otherFeeType,
      otherFeeValue: parseFloat(otherFeeValue) || 0,
      otherFees,
      totalFees,
      lessFees: totalFees,
      grossEligibleValue,
      netEligibleValue,
      loanPercentage,
      ltvPercent: loanPercentage,
      eligibleLoan,
      maxLoan,
      totalEligibleLoan: eligibleLoan,
      approvedLoan,
      loanAmount: approvedLoan,
      feeDeductionMode: deductionMode,
      netDisbursement: netDisbursementAmount,
      netDisbursementAmount,
      principalDisbursed: netDisbursementAmount,
      monthlyInterestRate: mRate,
      monthlyInterestAmount
    };
  }

  /**
   * Calculate exact accrued interest and remaining balance based on elapsed days
   */
  static calculateInterestAccrual(pledge = {}, asOfDate = new Date(), confirmedPayments = []) {
    const pledgeDate = new Date(pledge.pledgeDate || new Date());
    const settleDate = new Date(asOfDate);
    const diffTime = Math.max(0, settleDate - pledgeDate);
    const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const monthlyRate = parseFloat(pledge.monthlyInterestRate) || 1.0;
    const originalPrincipal = parseFloat(pledge.approvedLoan || pledge.originalLoanAmount || pledge.loanAmount) || 0;

    // Effective days elapsed (minimum 1 day)
    const effectiveDays = Math.max(1, daysElapsed);
    const monthsElapsed = this.roundCurrency(daysElapsed / 30, 1);

    // Filter confirmed payments on this ticket
    const ticketPayments = (Array.isArray(confirmedPayments) ? confirmedPayments : [])
      .filter(p => p.ticketNo === pledge.ticketNo && (p.status === 'CONFIRMED' || p.status === 'SUCCESS' || !p.status));

    const previouslyPaidInterest = ticketPayments.reduce((sum, p) => sum + (Number(p.interestSettled) || 0), 0);
    const previouslyPaidPrincipal = ticketPayments.reduce((sum, p) => sum + (Number(p.principalSettled) || 0), 0);

    const currentPrincipal = Math.max(0, originalPrincipal - previouslyPaidPrincipal);

    // Accrued interest on current principal
    const accruedInterest = this.roundCurrency(currentPrincipal * (monthlyRate / 100) * (effectiveDays / 30), 0);
    const netInterestDue = Math.max(0, accruedInterest - previouslyPaidInterest);
    const totalAmountDue = currentPrincipal + netInterestDue;

    return {
      daysElapsed,
      effectiveDays,
      monthsElapsed,
      monthlyRate,
      originalPrincipal,
      principal: currentPrincipal,
      currentPrincipal,
      accruedInterest,
      previouslyPaidInterest,
      previouslyPaidPrincipal,
      netInterestDue,
      totalAmountDue
    };
  }

  /**
   * Deterministic payment allocation breakdown (Interest first, then Principal)
   */
  static allocatePayment({
    amount = 0,
    pledge = {},
    asOfDate = new Date(),
    confirmedPayments = [],
    allocationMode = 'AUTO'
  } = {}) {
    const amt = Math.max(0, parseFloat(amount) || 0);
    const accrual = this.calculateInterestAccrual(pledge, asOfDate, confirmedPayments);

    let interestSettled = 0;
    let principalSettled = 0;

    if (allocationMode === 'INTEREST_ONLY') {
      interestSettled = Math.min(amt, accrual.netInterestDue);
      principalSettled = 0;
    } else if (allocationMode === 'PRINCIPAL_ONLY') {
      principalSettled = Math.min(amt, accrual.principal);
      interestSettled = 0;
    } else if (allocationMode === 'FULL_SETTLEMENT') {
      interestSettled = accrual.netInterestDue;
      principalSettled = accrual.principal;
    } else {
      // AUTO / COMBINED: Interest first, surplus to principal
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
    const netInterestDueAfter = Math.max(0, accrual.netInterestDue - interestSettled);
    const isFullSettlement = (remainingPrincipal === 0 && netInterestDueAfter === 0);
    const totalAmountPaid = (allocationMode === 'FULL_SETTLEMENT') ? (interestSettled + principalSettled) : amt;

    return {
      amountPaid: totalAmountPaid,
      allocationMode,
      interestSettled,
      principalSettled,
      remainingPrincipal,
      netInterestDueAfter,
      isFullSettlement,
      totalPayoffRequired: accrual.totalAmountDue,
      accrual
    };
  }

  /**
   * Renewal calculation: Accrued interest settlement, configured renewal/appraiser fees & new 12-month ticket issuance
   */
  static calculateRenewal({
    oldPledge = {},
    asOfDate = new Date(),
    confirmedPayments = [],
    newPrincipalOverride = null,
    interestPaymentAmount = null,
    renewalFee = 0,
    otherFee = 0,
    paymentMode = 'CASH',
    referenceNo = ''
  } = {}) {
    const accrual = this.calculateInterestAccrual(oldPledge, asOfDate, confirmedPayments);
    const interestToPay = (interestPaymentAmount !== null && interestPaymentAmount !== undefined && interestPaymentAmount !== '')
      ? parseFloat(interestPaymentAmount)
      : accrual.netInterestDue;

    const currentPrincipal = accrual.principal;
    const newPrincipal = (newPrincipalOverride !== null && newPrincipalOverride !== undefined && parseFloat(newPrincipalOverride) > 0)
      ? parseFloat(newPrincipalOverride)
      : currentPrincipal;

    const renFee = Math.max(0, parseFloat(renewalFee) || 0);
    const othFee = Math.max(0, parseFloat(otherFee) || 0);
    const totalRenewalFees = renFee + othFee;
    const totalAmountToCollect = this.roundCurrency(interestToPay + totalRenewalFees, 0);

    const mRate = parseFloat(oldPledge.monthlyInterestRate) || 1.0;
    const newMonthlyInterestAmount = this.roundCurrency((newPrincipal * mRate) / 100, 0);

    const now = new Date(asOfDate);
    const renewalDate = now.toISOString().split('T')[0];
    const newMaturityDate = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    return {
      oldTicketNo: oldPledge.ticketNo,
      customerId: oldPledge.customerId,
      principal: currentPrincipal,
      accruedInterest: accrual.netInterestDue,
      interestSettled: interestToPay,
      renewalFee: renFee,
      appraiserFee: renFee,
      otherFee: othFee,
      otherApplicableAmount: othFee,
      totalRenewalFees,
      amountPaid: totalAmountToCollect,
      totalAmountToCollect,
      principalCarried: newPrincipal,
      remaining: newPrincipal,
      remainingPrincipal: newPrincipal,
      renewalDate,
      newMaturityDate,
      paymentMode,
      referenceNo,
      monthlyInterestRate: mRate,
      newMonthlyInterestAmount,
      accrual
    };
  }

  /**
   * Redemption calculation: Full payoff & article release
   */
  static calculateRedemption({
    pledge = {},
    asOfDate = new Date(),
    confirmedPayments = [],
    applicableFees = 0,
    paidAmount = null,
    paymentType = 'CASH',
    referenceNo = ''
  } = {}) {
    const accrual = this.calculateInterestAccrual(pledge, asOfDate, confirmedPayments);
    const principalSettled = accrual.principal;
    const interestSettled = accrual.netInterestDue;
    const fees = Math.max(0, parseFloat(applicableFees) || 0);
    const totalDue = this.roundCurrency(principalSettled + interestSettled + fees, 0);
    const actualPaid = (paidAmount !== null && paidAmount !== undefined && paidAmount !== '')
      ? parseFloat(paidAmount)
      : totalDue;
    const remainingBalance = Math.max(0, this.roundCurrency(totalDue - actualPaid, 0));

    return {
      ticketNo: pledge.ticketNo,
      customerId: pledge.customerId,
      principal: principalSettled,
      principalSettled,
      interest: interestSettled,
      interestSettled,
      applicableFees: fees,
      fees,
      totalDue,
      totalSettlement: totalDue,
      paymentType,
      paymentMode: paymentType,
      referenceNo,
      paidAmount: actualPaid,
      amountPaid: actualPaid,
      balance: remainingBalance,
      remainingPrincipal: remainingBalance === 0 ? 0 : Math.max(0, principalSettled - Math.max(0, actualPaid - (interestSettled + fees))),
      netInterestDueAfter: remainingBalance === 0 ? 0 : Math.max(0, interestSettled - actualPaid),
      accrual
    };
  }
}

// Backward-compatibility alias
if (typeof PledgeValuationEngine === 'undefined') {
  var PledgeValuationEngine = FinancialCalculator;
}

// Browser / Global Exports
if (typeof window !== 'undefined') {
  window.FinancialCalculator = FinancialCalculator;
  window.PledgeValuationEngine = FinancialCalculator;
}

if (typeof global !== 'undefined') {
  global.FinancialCalculator = FinancialCalculator;
  global.PledgeValuationEngine = FinancialCalculator;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FinancialCalculator,
    PledgeValuationEngine
  };
}
