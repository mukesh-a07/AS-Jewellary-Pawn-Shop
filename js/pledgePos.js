/**
 * AS JEWELLAR PAWN SHOP - NEW PLEDGE / PAWN POS SERVICE
 * High-Speed Multi-Item Pawn Booking Engine.
 * 
 * Handles:
 * - Multi-item calculation (Net Wt = Gross - Stone, Market Valuation, 75% LTV Loan)
 * - Live metal rate stamping
 * - Idempotency duplicate prevention
 * - Offline-first IndexedDB / LocalStorage persistence
 * - Printable bilingual statutory Pawn Ticket generator (Form F)
 */

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

    // Default Seed Pledges
    const seedPledges = [
      {
        ticketNo: 'PLG-2026-002341',
        customerId: 'CUS-2026-000184',
        pledgeDate: '2026-07-10',
        maturityDate: '2027-07-10',
        tenureMonths: 12,
        totalGrossWeight: 17.120,
        totalStoneWeight: 0.500,
        totalNetWeight: 16.620,
        rateGold24k: 15958.00,
        rateGold22k: 14628.00,
        rateSilver: 243.90,
        totalEstimatedValue: 243117,
        totalEligibleLoan: 182338,
        loanAmount: 75000,
        monthlyInterestRate: 1.0,
        monthlyInterestAmount: 750,
        status: 'ACTIVE',
        vaultLocation: 'Vault A',
        packetId: 'PKT-0087',
        lockerTray: 'Locker 03 • Tray 12',
        createdAt: '2026-07-10T11:45:00.000Z',
        createdBy: 'ADMIN',
        items: [
          {
            itemId: 'ITM-2026-002341-01',
            category: 'GOLD',
            itemType: 'Chain',
            description: '22K Gold Rope Chain (Hallmarked)',
            grossWeight: 12.500,
            stoneWeight: 0.000,
            netWeight: 12.500,
            purity: '22K',
            rateUsed: 14628.00,
            estimatedValue: 182850,
            eligibleLoan: 137138,
            approvedLoan: 55000
          },
          {
            itemId: 'ITM-2026-002341-02',
            category: 'GOLD',
            itemType: 'Ring',
            description: '22K Gold Signet Ring (Enamel/Stone)',
            grossWeight: 4.620,
            stoneWeight: 0.500,
            netWeight: 4.120,
            purity: '22K',
            rateUsed: 14628.00,
            estimatedValue: 60267,
            eligibleLoan: 45200,
            approvedLoan: 20000
          }
        ]
      },
      {
        ticketNo: 'PLG-2026-002340',
        customerId: 'CUS-2026-000092',
        pledgeDate: '2025-08-28',
        maturityDate: '2026-08-28',
        tenureMonths: 12,
        totalGrossWeight: 32.400,
        totalStoneWeight: 0.000,
        totalNetWeight: 32.400,
        rateGold24k: 15880.00,
        rateGold22k: 14556.00,
        rateSilver: 241.50,
        totalEstimatedValue: 471614,
        totalEligibleLoan: 353710,
        loanAmount: 150000,
        monthlyInterestRate: 1.0,
        monthlyInterestAmount: 1500,
        status: 'DUE',
        vaultLocation: 'Vault A',
        packetId: 'PKT-0042',
        lockerTray: 'Locker 05 • Tray 04',
        createdAt: '2025-08-28T09:20:00.000Z',
        createdBy: 'ADMIN',
        items: [
          {
            itemId: 'ITM-2026-002340-01',
            category: 'GOLD',
            itemType: 'Bangle',
            description: '22K Gold Bangles (2 Pairs)',
            grossWeight: 32.400,
            stoneWeight: 0.000,
            netWeight: 32.400,
            purity: '22K',
            rateUsed: 14556.00,
            estimatedValue: 471614,
            eligibleLoan: 353710,
            approvedLoan: 150000
          }
        ]
      }
    ];

    this.savePledges(seedPledges);
    return seedPledges;
  }

  savePledges(pledgesList) {
    this.pledges = pledgesList;
    try {
      localStorage.setItem(this.storageKeyPledges, JSON.stringify(pledgesList));
    } catch (e) {
      console.warn('Failed to save pledges to localStorage', e);
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
  }

  /**
   * Calculate single pledge item values
   */
  calculateItem(item, rate24k, rate22k, rateSilver) {
    const gross = Math.max(0, parseFloat(item.grossWeight) || 0);
    const stone = Math.max(0, parseFloat(item.stoneWeight) || 0);
    const net = Math.max(0, gross - stone);

    let rateUsed = rate22k;
    if (item.category === 'SILVER') {
      rateUsed = (item.purity === 'SILVER_925') ? (rateSilver * 0.925) : rateSilver;
    } else {
      // GOLD
      if (item.purity === '24K') rateUsed = rate24k;
      else if (item.purity === '18K') rateUsed = rate24k * (18 / 24);
      else rateUsed = rate22k; // Default 22K 916
    }

    const estimatedValue = Math.round(net * rateUsed);
    const eligibleLoan = Math.round(estimatedValue * (this.loanPercentage / 100));

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
   * Aggregate totals for all items in the current POS session
   */
  getAggregateTotals(approvedLoanOverride = null) {
    let totalGrossWeight = 0;
    let totalStoneWeight = 0;
    let totalNetWeight = 0;
    let totalEstimatedValue = 0;
    let totalEligibleLoan = 0;

    this.items.forEach(it => {
      totalGrossWeight += it.grossWeight;
      totalStoneWeight += it.stoneWeight;
      totalNetWeight += it.netWeight;
      totalEstimatedValue += it.estimatedValue;
      totalEligibleLoan += it.eligibleLoan;
    });

    const approvedLoan = (approvedLoanOverride !== null && approvedLoanOverride !== undefined && approvedLoanOverride !== '')
      ? parseFloat(approvedLoanOverride)
      : totalEligibleLoan;

    const monthlyInterestAmount = Math.round((approvedLoan * this.monthlyInterestRate) / 100);

    return {
      itemCount: this.items.length,
      totalGrossWeight: Math.round(totalGrossWeight * 1000) / 1000,
      totalStoneWeight: Math.round(totalStoneWeight * 1000) / 1000,
      totalNetWeight: Math.round(totalNetWeight * 1000) / 1000,
      totalEstimatedValue,
      totalEligibleLoan,
      approvedLoan,
      monthlyInterestRate: this.monthlyInterestRate,
      monthlyInterestAmount
    };
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

    if (data.loanAmount <= 0) {
      return { valid: false, message: 'Approved loan amount must be greater than ₹ 0' };
    }

    // High LTV override validation
    if (data.loanAmount > data.totalEligibleLoan && !data.allowLtvOverride) {
      return {
        valid: false,
        message: `Approved loan (₹${data.loanAmount.toLocaleString('en-IN')}) exceeds maximum eligible limit (₹${data.totalEligibleLoan.toLocaleString('en-IN')}). Enable High-LTV override if authorized.`
      };
    }

    return { valid: true };
  }

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
    const idempotencyKey = `IDEMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const now = new Date();
    const pledgeDate = now.toISOString().split('T')[0];
    const maturityDate = new Date(now.setFullYear(now.getFullYear() + 1)).toISOString().split('T')[0];

    const newPledgeRecord = {
      ticketNo,
      customerId: payload.customerId,
      idempotencyKey,
      pledgeDate,
      maturityDate,
      tenureMonths: payload.tenureMonths || 12,
      totalGrossWeight: payload.totalGrossWeight,
      totalStoneWeight: payload.totalStoneWeight,
      totalNetWeight: payload.totalNetWeight,
      rateGold24k: payload.rateGold24k,
      rateGold22k: payload.rateGold22k,
      rateSilver: payload.rateSilver,
      totalEstimatedValue: payload.totalEstimatedValue,
      totalEligibleLoan: payload.totalEligibleLoan,
      loanAmount: payload.loanAmount,
      monthlyInterestRate: payload.monthlyInterestRate || 1.0,
      monthlyInterestAmount: payload.monthlyInterestAmount,
      status: 'ACTIVE',
      vaultLocation: payload.vaultLocation || 'Vault A',
      packetId: payload.packetId || `PKT-${seq.slice(-4)}`,
      lockerTray: payload.lockerTray || 'Locker 01 • Tray 01',
      createdAt: new Date().toISOString(),
      createdBy: (window.auth && window.auth.getUser()?.username) || 'ADMIN',
      items: payload.items.map((it, idx) => ({
        itemId: `ITM-${ticketNo}-${(idx + 1).toString().padStart(2, '0')}`,
        ...it
      }))
    };

    // Save to local store
    this.pledges.unshift(newPledgeRecord);
    this.savePledges(this.pledges);

    // Update customer's active stats in CustomerManager
    if (window.customerManager) {
      const cust = window.customerManager.getCustomerById(payload.customerId);
      if (cust) {
        cust.activePledgesCount = (cust.activePledgesCount || 0) + 1;
        cust.totalOutstanding = (cust.totalOutstanding || 0) + payload.loanAmount;
        cust.totalGoldWeight = Math.round(((cust.totalGoldWeight || 0) + payload.totalNetWeight) * 1000) / 1000;
        cust.lifetimeLoanTotal = (cust.lifetimeLoanTotal || 0) + payload.loanAmount;
        cust.vaultPlacement = `${newPledgeRecord.vaultLocation} • ${newPledgeRecord.lockerTray} • Packet ${newPledgeRecord.packetId}`;
        window.customerManager.saveCustomers(window.customerManager.customers);
      }
    }

    // Sync with backend API
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('createPledge', newPledgeRecord).catch(err => {
        console.warn('Background sync notice for pledge:', err);
      });
    }

    this.isSubmitting = false;
    return { success: true, pledge: newPledgeRecord, ticketNo };
  }

  /**
   * Generate Printable Bilingual Pawn Ticket (Form F Statutory Standard)
   */
  generatePawnTicketHtml(pledge, customer) {
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
        <table style="width:100%; border-collapse:collapse; margin-bottom:14px; font-size:11px;" border="1" cellpadding="6">
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
              <td style="text-align:right; font-size:12px;">₹ ${Number(pledge.totalEstimatedValue || 0).toLocaleString('en-IN')}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Loan Summary Box -->
        <div style="background:#FEF3C7; border:1px solid #F59E0B; border-radius:6px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <div>
            <div style="font-size:11px; text-transform:uppercase; color:#92400E; font-weight:bold;">Principal Loan Disbursed (வழங்கப்பட்ட கடன் அசல்)</div>
            <div style="font-size:20px; font-weight:900; color:#78350F;">₹ ${Number(pledge.loanAmount || 0).toLocaleString('en-IN')}</div>
          </div>
          <div>
            <div><strong>Interest Rate:</strong> ${pledge.monthlyInterestRate || 1.0}% / month (12% per annum)</div>
            <div><strong>Monthly Interest Amount:</strong> <strong style="color:#B8860B;">₹ ${Number(pledge.monthlyInterestAmount || 0).toLocaleString('en-IN')}</strong> / month</div>
          </div>
          <div style="text-align:right;">
            <div><strong>Rate Applied (22K):</strong> ₹ ${Number(pledge.rateGold22k || (pledge.items && pledge.items[0] && pledge.items[0].rateUsed) || 14628).toLocaleString('en-IN')}/g</div>
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

// Global PledgePosManager Instance
window.pledgePosManager = new PledgePosManager();
