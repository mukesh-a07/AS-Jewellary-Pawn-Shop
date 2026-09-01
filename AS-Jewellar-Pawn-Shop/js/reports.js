/**
 * AS JEWELLAR PAWN SHOP - REPORTS & ANALYTICS ENGINE
 * Generates Daily Day-Book, Outstanding Portfolio, Customer Statements, Metal Purity Inventory, and Monthly Summaries.
 */

class ReportManager {
  constructor() {}

  /**
   * 1. Daily Day-Book Report (Counter Activity & Inflows/Outflows)
   */
  generateDailyReport(startDate = null, endDate = null) {
    const todayStr = new Date().toISOString().split('T')[0];
    const sDate = startDate || todayStr;
    const eDate = endDate || todayStr;

    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const payments = (window.paymentManager && window.paymentManager.payments) || [];
    const renewals = (window.renewalRedemptionManager && window.renewalRedemptionManager.renewals) || [];
    const redemptions = (window.renewalRedemptionManager && window.renewalRedemptionManager.redemptions) || [];
    const customers = (window.customerManager && window.customerManager.customers) || [];

    // Filter by date range
    const filteredPledges = pledges.filter(p => p.pledgeDate >= sDate && p.pledgeDate <= eDate);
    const filteredPayments = payments.filter(p => p.date >= sDate && p.date <= eDate && p.status === 'CONFIRMED');
    const filteredRenewals = renewals.filter(r => r.renewalDate >= sDate && r.renewalDate <= eDate);
    const filteredRedemptions = redemptions.filter(r => r.redemptionDate >= sDate && r.redemptionDate <= eDate);

    // Inflows
    const cashCollections = filteredPayments.filter(p => p.paymentMode === 'CASH' || !p.paymentMode).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const upiCollections = filteredPayments.filter(p => p.paymentMode === 'UPI').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const bankCollections = filteredPayments.filter(p => p.paymentMode === 'BANK_TRANSFER').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalCollections = cashCollections + upiCollections + bankCollections;
    const interestCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.interestSettled) || 0), 0);

    // Outflows
    const totalLoansDisbursed = filteredPledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);

    // Detailed transaction feed for table
    const rows = [];

    filteredPledges.forEach(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      rows.push({
        type: 'LOAN_DISBURSED',
        typeLabel: 'New Pledge Loan',
        refNo: p.ticketNo,
        date: p.pledgeDate,
        customerName: cust ? cust.nameEn : p.customerId,
        inflow: 0,
        outflow: p.loanAmount,
        mode: 'CASH',
        notes: `${p.totalNetWeight}g Net Gold (${p.packetId})`
      });
    });

    filteredPayments.forEach(pay => {
      const cust = customers.find(c => c.customerId === pay.customerId);
      rows.push({
        type: 'PAYMENT_COLLECTED',
        typeLabel: pay.paymentType || 'Payment',
        refNo: pay.paymentId,
        date: pay.date,
        customerName: cust ? cust.nameEn : pay.customerId,
        inflow: pay.amount,
        outflow: 0,
        mode: pay.paymentMode || 'CASH',
        notes: `Pledge: ${pay.ticketNo} (Interest: ₹${pay.interestSettled})`
      });
    });

    return {
      startDate: sDate,
      endDate: eDate,
      summary: {
        newPledgesCount: filteredPledges.length,
        totalLoansDisbursed,
        totalCollections,
        cashCollections,
        upiCollections,
        bankCollections,
        interestCollected,
        redemptionsCount: filteredRedemptions.length,
        renewalsCount: filteredRenewals.length
      },
      rows
    };
  }

  /**
   * 2. Outstanding Portfolio Report (Active Loans, Risk & Maturity)
   */
  generateOutstandingReport() {
    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const customers = (window.customerManager && window.customerManager.customers) || [];

    const activePledges = pledges.filter(p => p.status === 'ACTIVE' || p.status === 'DUE' || p.status === 'OVERDUE');
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let totalOutstandingPrincipal = 0;
    let totalEstimatedInterest = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let dueCount = 0;
    let overdueCount = 0;

    const rows = activePledges.map(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      const accrual = window.paymentManager ? window.paymentManager.calculateInterestAccrual(p) : { netInterestDue: 0, totalAmountDue: p.loanAmount, daysElapsed: 0 };

      totalOutstandingPrincipal += (Number(p.loanAmount) || 0);
      totalEstimatedInterest += accrual.netInterestDue;
      totalGrossWeight += (Number(p.totalGrossWeight) || 0);
      totalNetWeight += (Number(p.totalNetWeight) || 0);

      const maturity = new Date(p.maturityDate);
      let riskStatus = 'ACTIVE';
      if (p.maturityDate <= todayStr) {
        riskStatus = 'DUE';
        dueCount++;
      } else if (maturity < now) {
        riskStatus = 'OVERDUE';
        overdueCount++;
      }

      return {
        ticketNo: p.ticketNo,
        packetId: p.packetId || '-',
        vaultLocation: `${p.vaultLocation || 'Vault A'} • ${p.lockerTray || ''}`,
        customerId: p.customerId,
        customerName: cust ? cust.nameEn : p.customerId,
        mobile: cust ? cust.mobile : '',
        pledgeDate: p.pledgeDate,
        maturityDate: p.maturityDate,
        daysElapsed: accrual.daysElapsed,
        principal: p.loanAmount,
        accruedInterest: accrual.netInterestDue,
        totalDue: accrual.totalAmountDue,
        netWeight: p.totalNetWeight,
        riskStatus
      };
    });

    return {
      summary: {
        activeCount: activePledges.length,
        totalOutstandingPrincipal,
        totalEstimatedInterest,
        totalPortfolioValue: totalOutstandingPrincipal + totalEstimatedInterest,
        totalGrossWeight,
        totalNetWeight,
        dueCount,
        overdueCount
      },
      rows
    };
  }

  /**
   * 3. Customer 360 Statement
   */
  generateCustomerStatement(customerId) {
    const cust = window.customerManager ? window.customerManager.getCustomerById(customerId) : null;
    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges.filter(p => p.customerId === customerId)) || [];
    const payments = (window.paymentManager && window.paymentManager.payments.filter(p => p.customerId === customerId && p.status === 'CONFIRMED')) || [];

    const totalLoansTaken = pledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);
    const totalPaymentsMade = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const activePledges = pledges.filter(p => p.status === 'ACTIVE' || p.status === 'DUE' || p.status === 'OVERDUE');
    const currentOutstanding = activePledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);

    return {
      customer: cust,
      summary: {
        totalPledgesCount: pledges.length,
        activePledgesCount: activePledges.length,
        totalLoansTaken,
        totalPaymentsMade,
        currentOutstanding
      },
      pledges,
      payments
    };
  }

  /**
   * 4. Gold & Silver Inventory Report (Purity Breakdown in Safe)
   */
  generateMetalInventoryReport() {
    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges.filter(p => p.status === 'ACTIVE' || p.status === 'DUE' || p.status === 'OVERDUE')) || [];

    let gold24kNetWeight = 0;
    let gold22kNetWeight = 0;
    let gold18kNetWeight = 0;
    let silverNetWeight = 0;
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    let totalValuation = 0;
    let totalItemsCount = 0;

    const purityRows = [
      { purity: 'Gold 24K (Pure)', karat: '24K', itemsCount: 0, grossWeight: 0, netWeight: 0, valuation: 0 },
      { purity: 'Gold 22K (916 Hallmark)', karat: '22K', itemsCount: 0, grossWeight: 0, netWeight: 0, valuation: 0 },
      { purity: 'Gold 18K / Other', karat: '18K', itemsCount: 0, grossWeight: 0, netWeight: 0, valuation: 0 },
      { purity: 'Silver Articles', karat: 'SILVER', itemsCount: 0, grossWeight: 0, netWeight: 0, valuation: 0 }
    ];

    pledges.forEach(p => {
      if (p.items && p.items.length > 0) {
        p.items.forEach(it => {
          totalItemsCount++;
          const gw = Number(it.grossWeight) || 0;
          const nw = Number(it.netWeight) || 0;
          const val = Number(it.estimatedValue) || 0;

          totalGrossWeight += gw;
          totalNetWeight += nw;
          totalValuation += val;

          const pUpper = (it.purity || '').toUpperCase();
          if (pUpper.includes('24K')) {
            purityRows[0].itemsCount++;
            purityRows[0].grossWeight += gw;
            purityRows[0].netWeight += nw;
            purityRows[0].valuation += val;
            gold24kNetWeight += nw;
          } else if (pUpper.includes('22K') || pUpper.includes('916')) {
            purityRows[1].itemsCount++;
            purityRows[1].grossWeight += gw;
            purityRows[1].netWeight += nw;
            purityRows[1].valuation += val;
            gold22kNetWeight += nw;
          } else if (pUpper.includes('SILVER') || (it.category || '').toUpperCase() === 'SILVER') {
            purityRows[3].itemsCount++;
            purityRows[3].grossWeight += gw;
            purityRows[3].netWeight += nw;
            purityRows[3].valuation += val;
            silverNetWeight += nw;
          } else {
            purityRows[2].itemsCount++;
            purityRows[2].grossWeight += gw;
            purityRows[2].netWeight += nw;
            purityRows[2].valuation += val;
            gold18kNetWeight += nw;
          }
        });
      } else {
        // Fallback to top-level pledge weights
        totalGrossWeight += (Number(p.totalGrossWeight) || 0);
        totalNetWeight += (Number(p.totalNetWeight) || 0);
        gold22kNetWeight += (Number(p.totalNetWeight) || 0);
        purityRows[1].itemsCount++;
        purityRows[1].netWeight += (Number(p.totalNetWeight) || 0);
      }
    });

    return {
      summary: {
        activePacketsCount: pledges.length,
        totalItemsCount,
        totalGrossWeight,
        totalNetWeight,
        gold24kNetWeight,
        gold22kNetWeight,
        silverNetWeight,
        totalValuation
      },
      purityBreakdown: purityRows
    };
  }

  /**
   * 5. Monthly Summary Report
   */
  generateMonthlyReport(year = null, month = null) {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== null ? month : (now.getMonth() + 1);
    const monthPrefix = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;

    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const payments = (window.paymentManager && window.paymentManager.payments) || [];
    const renewals = (window.renewalRedemptionManager && window.renewalRedemptionManager.renewals) || [];
    const redemptions = (window.renewalRedemptionManager && window.renewalRedemptionManager.redemptions) || [];

    const monthPledges = pledges.filter(p => (p.pledgeDate || '').startsWith(monthPrefix));
    const monthPayments = payments.filter(p => (p.date || '').startsWith(monthPrefix) && p.status === 'CONFIRMED');
    const monthRenewals = renewals.filter(r => (r.renewalDate || '').startsWith(monthPrefix));
    const monthRedemptions = redemptions.filter(r => (r.redemptionDate || '').startsWith(monthPrefix));

    const totalLoansDisbursed = monthPledges.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);
    const totalCollections = monthPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const interestCollected = monthPayments.reduce((sum, p) => sum + (Number(p.interestSettled) || 0), 0);
    const principalCollected = monthPayments.reduce((sum, p) => sum + (Number(p.principalSettled) || 0), 0);

    return {
      year: targetYear,
      month: targetMonth,
      monthLabel: `${monthPrefix}`,
      totalLoansDisbursed,
      newPledgesCount: monthPledges.length,
      totalCollections,
      interestCollected,
      principalCollected,
      redemptionsCount: monthRedemptions.length,
      renewalsCount: monthRenewals.length
    };
  }

  /**
   * Export Table Data to Clean UTF-8 CSV
   */
  exportToCsv(filename, headers, rows) {
    const csvContent = [];
    csvContent.push(headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','));

    rows.forEach(row => {
      const line = row.map(val => {
        const clean = (val === null || val === undefined) ? '' : String(val);
        return `"${clean.replace(/"/g, '""')}"`;
      }).join(',');
      csvContent.push(line);
    });

    const blob = new Blob(['\uFEFF' + csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Global ReportManager Instance
window.reportManager = new ReportManager();
