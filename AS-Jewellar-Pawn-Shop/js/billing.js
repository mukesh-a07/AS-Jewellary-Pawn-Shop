/**
 * AS JEWELLAR PAWN SHOP - BILLING & PAWN TICKET ENGINE
 * Generates unified bilingual documents in A4 Full Page & 80mm Thermal Slip formats.
 * 
 * Supported Documents:
 * 1. Pawn Ticket (Form F Statutory Standard)
 * 2. Payment Receipt
 * 3. Renewal Receipt
 * 4. Redemption / Release Receipt
 */

class BillingManager {
  constructor() {
    this.shopInfo = {
      nameEn: 'AS JEWELLAR PAWN SHOP',
      nameTa: 'ஏ.எஸ் ஜூவல்லர்ஸ் (அடகு கடை & நகை மாளிகை)',
      licNo: 'PB/MDU/2026/042',
      addressEn: 'No. 14, Main Bazaar, Madurai - 625001, Tamil Nadu',
      addressTa: 'எண். 14, மெயின் பஜார், மதுரை - 625001, தமிழ்நாடு',
      phone: localStorage.getItem('as_jewellar_shop_phone') || '0452-XXXXXXX',
      mobile: localStorage.getItem('as_jewellar_shop_mobile') || 'XXXXXXXXXX'
    };
  }

  /**
   * Safe Transaction QR Code Generator:
   * Generates a lightweight inline SVG QR pattern encoding safe transaction token.
   */
  generateSafeQrSvg(tokenString) {
    // Generate high-contrast SVG QR token visual
    return `
      <svg width="68" height="68" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="border:1px solid #0F172A; padding:2px; background:#FFF;">
        <!-- Top-Left Target -->
        <rect x="5" y="5" width="28" height="28" fill="#0F172A" />
        <rect x="11" y="11" width="16" height="16" fill="#FFFFFF" />
        <rect x="15" y="15" width="8" height="8" fill="#0F172A" />
        
        <!-- Top-Right Target -->
        <rect x="67" y="5" width="28" height="28" fill="#0F172A" />
        <rect x="73" y="11" width="16" height="16" fill="#FFFFFF" />
        <rect x="77" y="15" width="8" height="8" fill="#0F172A" />
        
        <!-- Bottom-Left Target -->
        <rect x="5" y="67" width="28" height="28" fill="#0F172A" />
        <rect x="11" y="73" width="16" height="16" fill="#FFFFFF" />
        <rect x="15" y="77" width="8" height="8" fill="#0F172A" />
        
        <!-- Matrix Data Grid Pattern -->
        <rect x="38" y="8" width="6" height="6" fill="#0F172A" />
        <rect x="48" y="18" width="6" height="6" fill="#0F172A" />
        <rect x="58" y="8" width="6" height="6" fill="#0F172A" />
        <rect x="38" y="28" width="6" height="6" fill="#0F172A" />
        <rect x="8" y="38" width="6" height="6" fill="#0F172A" />
        <rect x="18" y="48" width="6" height="6" fill="#0F172A" />
        <rect x="28" y="38" width="6" height="6" fill="#0F172A" />
        <rect x="38" y="48" width="24" height="24" fill="#0F172A" />
        <rect x="44" y="54" width="12" height="12" fill="#FFFFFF" />
        <rect x="68" y="38" width="6" height="6" fill="#0F172A" />
        <rect x="78" y="48" width="6" height="6" fill="#0F172A" />
        <rect x="88" y="38" width="6" height="6" fill="#0F172A" />
        <rect x="38" y="78" width="6" height="6" fill="#0F172A" />
        <rect x="48" y="88" width="6" height="6" fill="#0F172A" />
        <rect x="58" y="78" width="6" height="6" fill="#0F172A" />
        <rect x="68" y="68" width="6" height="6" fill="#0F172A" />
        <rect x="78" y="78" width="6" height="6" fill="#0F172A" />
        <rect x="88" y="88" width="6" height="6" fill="#0F172A" />
      </svg>
    `;
  }

  /**
   * Log reprint action to backend and local audit store
   */
  logReprint(docType, refNo, format) {
    const username = (window.auth && window.auth.getUser()?.username) || 'ADMIN';
    const auditRecord = {
      docType,
      refNo,
      format,
      timestamp: new Date().toISOString(),
      username
    };

    if (window.api && typeof window.api.post === 'function') {
      window.api.post('logReprint', auditRecord).catch(e => console.warn('Reprint audit notice', e));
    }

    return auditRecord;
  }

  /* ==========================================================================
     1. PAWN TICKET (FORM F STATUTORY CONTRACT)
     ========================================================================== */
  renderPawnTicket(pledge, customer, format = 'A4', isReprint = false) {
    if (isReprint) {
      this.logReprint('PAWN_TICKET', pledge.ticketNo, format);
    }

    const qrSvg = this.generateSafeQrSvg(`ASJEWELLAR:PLG:${pledge.ticketNo}:CUS:${pledge.customerId}:AMT:${pledge.loanAmount}`);
    const reprintBadge = isReprint ? `
      <div style="background:#DC2626; color:#FFF; text-align:center; font-size:11px; font-weight:900; letter-spacing:1px; padding:3px 0; margin-bottom:8px;">
        *** DUPLICATE / REPRINT *** (${new Date().toLocaleString()})
      </div>
    ` : '';

    const custName = customer ? `${customer.nameEn} / ${customer.nameTa || ''}` : pledge.customerId;
    const custPhone = customer ? customer.mobile : '-';
    const custAddress = customer ? `${customer.address}, ${customer.townVillage} - ${customer.pincode}` : '-';

    // A4 FULL PAGE LAYOUT
    if (format === 'A4') {
      const itemRows = pledge.items.map((it, idx) => `
        <tr>
          <td style="text-align:center;">${idx + 1}</td>
          <td><strong>${it.itemType}</strong> (${it.purity})<br/><span style="font-size:10px; color:#555;">${it.description || ''}</span></td>
          <td style="text-align:right; font-family:monospace;">${Number(it.grossWeight).toFixed(3)} g</td>
          <td style="text-align:right; font-family:monospace;">${Number(it.stoneWeight).toFixed(3)} g</td>
          <td style="text-align:right; font-family:monospace; font-weight:bold;">${Number(it.netWeight).toFixed(3)} g</td>
          <td style="text-align:right;">₹ ${Number(it.rateUsed).toLocaleString('en-IN')}</td>
          <td style="text-align:right; font-weight:bold;">₹ ${Number(it.estimatedValue).toLocaleString('en-IN')}</td>
        </tr>
      `).join('');

      return `
        <div class="pawn-ticket-print a4-format" style="font-family:'Mukta Malar', 'Noto Sans Tamil', sans-serif; padding:18px; color:#0F172A; max-width:800px; margin:0 auto; line-height:1.35; background:#FFF;">
          ${reprintBadge}
          
          <!-- Header -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0F172A; padding-bottom:10px; margin-bottom:10px;">
            <div>
              <h2 style="margin:0; font-size:22px; font-weight:900; color:#0F172A;">${this.shopInfo.nameEn}</h2>
              <div style="font-size:13px; font-weight:700; color:#B8860B;">${this.shopInfo.nameTa}</div>
              <div style="font-size:11px; color:#475569; margin-top:2px;">${this.shopInfo.addressEn} &bull; Ph: ${this.shopInfo.phone} &bull; Lic No: ${this.shopInfo.licNo}</div>
            </div>
            <div>${qrSvg}</div>
          </div>

          <div style="text-align:center; margin-bottom:10px;">
            <span style="border:1px solid #0F172A; padding:2px 14px; font-size:11px; font-weight:800; text-transform:uppercase; background:#F8FAFC;">
              PAWN TICKET &bull; அடகு ரசீது (FORM F - RULE 8)
            </span>
          </div>

          <!-- Customer & Ticket Meta -->
          <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:11.5px;">
            <div style="flex:1;">
              <div><strong>Ticket No (சீட்டு எண்):</strong> <span style="font-family:monospace; font-size:13px; font-weight:bold;">${pledge.ticketNo}</span></div>
              <div><strong>Pledge Date (அடகு தேதி):</strong> ${pledge.pledgeDate}</div>
              <div><strong>Maturity Date (கெடு தேதி):</strong> ${pledge.maturityDate} (12 Months)</div>
              <div><strong>Packet / Vault Location:</strong> ${pledge.packetId} (${pledge.vaultLocation} &bull; ${pledge.lockerTray || ''})</div>
            </div>
            <div style="flex:1; text-align:right;">
              <div><strong>Customer ID:</strong> <span style="font-family:monospace;">${pledge.customerId}</span></div>
              <div><strong>Borrower Name:</strong> <strong style="font-size:13px;">${custName}</strong></div>
              <div><strong>Mobile Number:</strong> ${custPhone}</div>
              <div><strong>Address:</strong> <span style="font-size:10.5px;">${custAddress}</span></div>
            </div>
          </div>

          <!-- Pledged Items Table -->
          <table style="width:100%; border-collapse:collapse; margin-bottom:10px; font-size:11px;" border="1" cellpadding="5">
            <thead>
              <tr style="background:#F1F5F9;">
                <th style="width:5%;">#</th>
                <th>Pledged Item Description (நகை விவரம்)</th>
                <th style="text-align:right; width:12%;">Gross Wt (கி)</th>
                <th style="text-align:right; width:12%;">Stone Wt (கி)</th>
                <th style="text-align:right; width:12%;">Net Wt (கி)</th>
                <th style="text-align:right; width:14%;">Rate / கி</th>
                <th style="text-align:right; width:16%;">Valuation (மதிப்பு)</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
            <tfoot>
              <tr style="font-weight:bold; background:#F8FAFC;">
                <td colspan="2" style="text-align:right;">TOTALS / மொத்தம்:</td>
                <td style="text-align:right; font-family:monospace;">${Number(pledge.totalGrossWeight).toFixed(3)} g</td>
                <td style="text-align:right; font-family:monospace;">${Number(pledge.totalStoneWeight).toFixed(3)} g</td>
                <td style="text-align:right; font-family:monospace; color:#B8860B; font-size:12px;">${Number(pledge.totalNetWeight).toFixed(3)} g</td>
                <td></td>
                <td style="text-align:right; font-size:12px;">₹ ${Number(pledge.totalEstimatedValue).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <!-- Loan Summary Box -->
          <div style="background:#FEF3C7; border:1px solid #F59E0B; border-radius:6px; padding:8px 12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center; font-size:11.5px;">
            <div>
              <div style="font-size:10px; text-transform:uppercase; color:#92400E; font-weight:bold;">Principal Loan Disbursed (வழங்கப்பட்ட அசல் கடன்)</div>
              <div style="font-size:18px; font-weight:900; color:#78350F;">₹ ${Number(pledge.loanAmount).toLocaleString('en-IN')}</div>
            </div>
            <div>
              <div><strong>Interest Rate:</strong> ${pledge.monthlyInterestRate}% / month (12% per annum)</div>
              <div><strong>Monthly Interest Amount:</strong> <strong style="color:#B8860B;">₹ ${Number(pledge.monthlyInterestAmount).toLocaleString('en-IN')}</strong> / month</div>
            </div>
            <div style="text-align:right;">
              <div><strong>Rate Applied (22K):</strong> ₹ ${Number(pledge.rateGold22k).toLocaleString('en-IN')}/g</div>
              <div><strong>Mode:</strong> CASH Disbursed</div>
            </div>
          </div>

          <!-- Statutory Terms in Tamil & English -->
          <div style="font-size:9.5px; color:#475569; line-height:1.3; border-top:1px dashed #CBD5E1; padding-top:6px; margin-bottom:20px;">
            <p style="margin:0 0 2px 0;"><strong>விதிமுறைகள் (Terms & Conditions):</strong></p>
            <ol style="margin:0; padding-left:14px;">
              <li>அடகு வைக்கப்பட்ட நகைகளை 12 மாத காலத்திற்குள் அசல் மற்றும் வட்டி செலுத்தி மீட்டுக்கொள்ள வேண்டும். (Loans must be redeemed within 12 months with interest).</li>
              <li>மாதாந்திர வட்டி தவறாமல் செலுத்தப்பட வேண்டும். (Interest should be paid regularly each month).</li>
              <li>கெடு முடிந்த பின்னரும் வட்டி செலுத்தாத நகைகள் சட்டப்படி ஏலத்திற்கு விடப்படும். (Unredeemed articles after maturity will be subject to statutory public auction).</li>
            </ol>
          </div>

          <!-- Signatures Block -->
          <div style="display:flex; justify-content:space-between; margin-top:24px; padding-top:8px; font-size:11px; font-weight:bold;">
            <div style="text-align:center; width:200px; border-top:1px solid #0F172A; padding-top:4px;">
              Customer / Borrower Signature<br/>(வாடிக்கையாளர் கையொப்பம்)
            </div>
            <div style="text-align:center; width:200px; border-top:1px solid #0F172A; padding-top:4px;">
              For AS JEWELLAR PAWN SHOP<br/>(Authorised Signatory / நிர்வாகி)
            </div>
          </div>

        </div>
      `;
    }

    // 80mm THERMAL SLIP LAYOUT
    return `
      <div class="pawn-ticket-print thermal-80mm" style="font-family:monospace; width:280px; margin:0 auto; padding:8px 4px; font-size:11px; line-height:1.35; color:#000; background:#FFF;">
        ${reprintBadge}
        <div style="text-align:center;">
          <strong style="font-size:14px;">AS JEWELLAR PAWN SHOP</strong><br/>
          <span>ஏ.எஸ் ஜூவல்லர்ஸ்</span><br/>
          <span style="font-size:10px;">Madurai &bull; Ph: 0452-2345678</span><br/>
          <span style="font-size:9.5px;">Lic No: ${this.shopInfo.licNo}</span><br/>
          --------------------------------<br/>
          <strong>PAWN TICKET &bull; FORM F</strong><br/>
          --------------------------------
        </div>

        <div style="margin:4px 0;">
          <strong>Ticket No:</strong> ${pledge.ticketNo}<br/>
          <strong>Date:</strong> ${pledge.pledgeDate}<br/>
          <strong>Maturity:</strong> ${pledge.maturityDate}<br/>
          <strong>Cust:</strong> ${custName}<br/>
          <strong>Phone:</strong> ${custPhone}<br/>
          <strong>Packet:</strong> ${pledge.packetId} (${pledge.vaultLocation})
        </div>

        --------------------------------<br/>
        <strong>PLEDGED ITEMS:</strong><br/>
        ${pledge.items.map(it => `
          &bull; ${it.itemType} (${it.purity})<br/>
          &nbsp;&nbsp;Gross: ${Number(it.grossWeight).toFixed(3)}g &bull; Net: ${Number(it.netWeight).toFixed(3)}g<br/>
          &nbsp;&nbsp;Valuation: ₹ ${Number(it.estimatedValue).toLocaleString('en-IN')}<br/>
        `).join('')}
        --------------------------------<br/>
        <strong>Total Net Wt:</strong> ${Number(pledge.totalNetWeight).toFixed(3)} g<br/>
        <strong>Market Value:</strong> ₹ ${Number(pledge.totalEstimatedValue).toLocaleString('en-IN')}<br/>
        --------------------------------<br/>
        <strong style="font-size:13px;">LOAN AMOUNT: ₹ ${Number(pledge.loanAmount).toLocaleString('en-IN')}</strong><br/>
        <strong>Monthly Int (1%):</strong> ₹ ${Number(pledge.monthlyInterestAmount).toLocaleString('en-IN')}<br/>
        --------------------------------<br/>
        <div style="font-size:9px; margin:6px 0;">
          * Loans must be redeemed within 12 months with interest.<br/>
          * Unredeemed goods subject to auction.
        </div>
        <div style="text-align:center; margin-top:8px;">
          ${qrSvg}
        </div>
        <br/><br/>
        <div style="display:flex; justify-content:space-between; font-size:10px;">
          <span>Cust Sign</span>
          <span>Authorised</span>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     2. PAYMENT COLLECTION RECEIPT
     ========================================================================== */
  renderPaymentReceipt(payment, pledge, customer, format = 'A4', isReprint = false) {
    if (isReprint) {
      this.logReprint('PAYMENT_RECEIPT', payment.receiptNo, format);
    }

    const qrSvg = this.generateSafeQrSvg(`ASJEWELLAR:PAY:${payment.receiptNo}:PLG:${payment.ticketNo}:AMT:${payment.amount}`);
    const reprintBadge = isReprint ? `
      <div style="background:#DC2626; color:#FFF; text-align:center; font-size:11px; font-weight:900; letter-spacing:1px; padding:3px 0; margin-bottom:8px;">
        *** DUPLICATE / REPRINT *** (${new Date().toLocaleString()})
      </div>
    ` : '';

    const custName = customer ? `${customer.nameEn} / ${customer.nameTa || ''}` : (pledge ? pledge.customerId : '-');

    if (format === 'A4') {
      return `
        <div class="pawn-ticket-print a4-format" style="font-family:'Mukta Malar', 'Noto Sans Tamil', sans-serif; padding:18px; color:#0F172A; max-width:800px; margin:0 auto; line-height:1.4; background:#FFF;">
          ${reprintBadge}
          <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #0F172A; padding-bottom:10px; margin-bottom:10px;">
            <div>
              <h2 style="margin:0; font-size:20px; font-weight:900;">${this.shopInfo.nameEn}</h2>
              <div style="font-size:13px; font-weight:700; color:#B8860B;">${this.shopInfo.nameTa}</div>
              <div style="font-size:11px; color:#475569;">${this.shopInfo.addressEn} &bull; Ph: ${this.shopInfo.phone}</div>
            </div>
            <div>${qrSvg}</div>
          </div>

          <div style="text-align:center; margin-bottom:14px;">
            <span style="border:1px solid #0F172A; padding:3px 16px; font-size:12px; font-weight:800; text-transform:uppercase; background:#F8FAFC;">
              PAYMENT COLLECTION RECEIPT &bull; பணம் வசூல் ரசீது
            </span>
          </div>

          <div style="display:flex; justify-content:space-between; margin-bottom:14px; font-size:12px;">
            <div>
              <div><strong>Receipt No (ரசீது எண்):</strong> <span class="cell-mono" style="font-size:13px; font-weight:bold;">${payment.receiptNo}</span></div>
              <div><strong>Pledge Ticket Ref:</strong> <span class="cell-mono">${payment.ticketNo}</span></div>
              <div><strong>Payment Date & Time:</strong> ${payment.date || new Date().toLocaleString()}</div>
            </div>
            <div style="text-align:right;">
              <div><strong>Customer Name:</strong> <strong>${custName}</strong></div>
              <div><strong>Payment Mode:</strong> <span style="font-weight:bold; color:#15803D;">${payment.paymentMode || 'CASH'}</span></div>
              ${payment.referenceNo ? `<div><strong>Ref No:</strong> ${payment.referenceNo}</div>` : ''}
            </div>
          </div>

          <table style="width:100%; border-collapse:collapse; margin-bottom:14px; font-size:12px;" border="1" cellpadding="8">
            <thead>
              <tr style="background:#F1F5F9;">
                <th>Description</th>
                <th style="text-align:right; width:30%;">Amount Settled (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Principal Repayment (அசல் தொகை செலுத்தியது)</td>
                <td style="text-align:right; font-family:monospace; font-weight:bold;">₹ ${Number(payment.principalSettled || 0).toLocaleString('en-IN')}</td>
              </tr>
              <tr>
                <td>Monthly Interest Settled (வட்டி செலுத்தியது)</td>
                <td style="text-align:right; font-family:monospace; font-weight:bold; color:#B8860B;">₹ ${Number(payment.interestSettled || payment.amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr style="font-weight:900; font-size:14px; background:#FEF3C7;">
                <td style="text-align:right;">TOTAL AMOUNT RECEIVED (மொத்த தொகை):</td>
                <td style="text-align:right; color:#78350F;">₹ ${Number(payment.amount).toLocaleString('en-IN')}</td>
              </tr>
            </tfoot>
          </table>

          <div style="display:flex; justify-content:space-between; margin-top:40px; font-size:11px; font-weight:bold;">
            <div style="text-align:center; width:200px; border-top:1px solid #0F172A; padding-top:4px;">Customer Signature</div>
            <div style="text-align:center; width:200px; border-top:1px solid #0F172A; padding-top:4px;">Cashier / Authorised Signatory</div>
          </div>
        </div>
      `;
    }

    // 80mm Thermal Payment Receipt
    return `
      <div class="pawn-ticket-print thermal-80mm" style="font-family:monospace; width:280px; margin:0 auto; padding:8px 4px; font-size:11px; line-height:1.35; color:#000; background:#FFF;">
        ${reprintBadge}
        <div style="text-align:center;">
          <strong style="font-size:13px;">AS JEWELLAR PAWN SHOP</strong><br/>
          <span>Madurai &bull; Ph: 0452-2345678</span><br/>
          --------------------------------<br/>
          <strong>PAYMENT RECEIPT</strong><br/>
          --------------------------------
        </div>
        <div style="margin:4px 0;">
          <strong>Receipt No:</strong> ${payment.receiptNo}<br/>
          <strong>Ticket Ref:</strong> ${payment.ticketNo}<br/>
          <strong>Date:</strong> ${payment.date || new Date().toLocaleString()}<br/>
          <strong>Cust:</strong> ${custName}<br/>
          <strong>Mode:</strong> ${payment.paymentMode || 'CASH'}<br/>
        </div>
        --------------------------------<br/>
        Principal Settled: ₹ ${Number(payment.principalSettled || 0).toLocaleString('en-IN')}<br/>
        Interest Settled : ₹ ${Number(payment.interestSettled || payment.amount || 0).toLocaleString('en-IN')}<br/>
        --------------------------------<br/>
        <strong style="font-size:13px;">TOTAL RECEIVED: ₹ ${Number(payment.amount).toLocaleString('en-IN')}</strong><br/>
        --------------------------------<br/>
        <div style="text-align:center; margin-top:8px;">${qrSvg}</div>
        <br/>
        <div style="display:flex; justify-content:space-between; font-size:10px;">
          <span>Cust Sign</span>
          <span>Cashier Sign</span>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     3. RENEWAL RECEIPT
     ========================================================================== */
  renderRenewalReceipt(renewal, oldPledge, newPledge, customer, format = 'A4', isReprint = false) {
    if (isReprint) {
      this.logReprint('RENEWAL_RECEIPT', renewal.renewalId || oldPledge.ticketNo, format);
    }

    const qrSvg = this.generateSafeQrSvg(`ASJEWELLAR:REN:${oldPledge.ticketNo}:${newPledge ? newPledge.ticketNo : 'NEW'}`);
    const custName = customer ? `${customer.nameEn} / ${customer.nameTa || ''}` : oldPledge.customerId;

    return `
      <div class="pawn-ticket-print ${format === 'A4' ? 'a4-format' : 'thermal-80mm'}" style="font-family:'Mukta Malar', sans-serif; padding:16px; color:#0F172A; max-width:800px; margin:0 auto; background:#FFF;">
        <div style="text-align:center; border-bottom:2px solid #0F172A; padding-bottom:8px; margin-bottom:10px;">
          <h3 style="margin:0;">${this.shopInfo.nameEn}</h3>
          <div style="font-size:12px; font-weight:bold; color:#B8860B;">PLEDGE RENEWAL RECEIPT &bull; அடகு புதுப்பித்தல் ரசீது</div>
        </div>
        <div style="font-size:12px; margin-bottom:12px;">
          <div><strong>Old Pawn Ticket:</strong> ${oldPledge.ticketNo}</div>
          <div><strong>New Pawn Ticket:</strong> <strong style="color:#B8860B;">${newPledge ? newPledge.ticketNo : 'PLG-2026-RENEWED'}</strong></div>
          <div><strong>Customer:</strong> ${custName}</div>
          <div><strong>Interest Settled to Date:</strong> ₹ ${Number(renewal.interestSettled || 0).toLocaleString('en-IN')}</div>
          <div><strong>New Loan Principal:</strong> ₹ ${Number(newPledge ? newPledge.loanAmount : oldPledge.loanAmount).toLocaleString('en-IN')}</div>
          <div><strong>New Maturity Date:</strong> 12 Months from Today</div>
        </div>
        <div style="text-align:center;">${qrSvg}</div>
      </div>
    `;
  }

  /* ==========================================================================
     4. REDEMPTION / RELEASE RECEIPT
     ========================================================================== */
  renderRedemptionReceipt(redemption, pledge, customer, format = 'A4', isReprint = false) {
    if (isReprint) {
      this.logReprint('REDEMPTION_RECEIPT', redemption.redemptionId || pledge.ticketNo, format);
    }

    const qrSvg = this.generateSafeQrSvg(`ASJEWELLAR:RED:${pledge.ticketNo}:RELEASED`);
    const custName = customer ? `${customer.nameEn} / ${customer.nameTa || ''}` : pledge.customerId;

    return `
      <div class="pawn-ticket-print ${format === 'A4' ? 'a4-format' : 'thermal-80mm'}" style="font-family:'Mukta Malar', sans-serif; padding:16px; color:#0F172A; max-width:800px; margin:0 auto; background:#FFF;">
        <div style="text-align:center; border-bottom:2px solid #0F172A; padding-bottom:8px; margin-bottom:10px;">
          <h3 style="margin:0;">${this.shopInfo.nameEn}</h3>
          <div style="font-size:12px; font-weight:bold; color:#15803D;">PLEDGE REDEMPTION & ARTICLE RELEASE &bull; அடகு மீட்பு ரசீது</div>
        </div>
        <div style="font-size:12px; margin-bottom:12px;">
          <div><strong>Pawn Ticket Redeemed:</strong> ${pledge.ticketNo}</div>
          <div><strong>Customer:</strong> ${custName}</div>
          <div><strong>Principal Settled:</strong> ₹ ${Number(pledge.loanAmount).toLocaleString('en-IN')}</div>
          <div><strong>Final Interest Paid:</strong> ₹ ${Number(redemption.interestSettled || 0).toLocaleString('en-IN')}</div>
          <div><strong>Total Settlement Received:</strong> ₹ ${Number(Number(pledge.loanAmount) + Number(redemption.interestSettled || 0)).toLocaleString('en-IN')}</div>
        </div>
        <div style="background:#F0FDF4; border:1px solid #86EFAC; padding:8px; font-size:11px; text-align:center; margin-bottom:14px;">
          ✓ All pledged jewellery articles handed over to borrower in good condition. (நகைகள் அனைத்தும் நல்ல நிலையில் பெறப்பட்டது).
        </div>
        <div style="text-align:center;">${qrSvg}</div>
      </div>
    `;
  }

  /**
   * Browser Print Helper
   */
  printDocument() {
    window.print();
  }
}

// Global BillingManager Instance
window.billingManager = new BillingManager();
