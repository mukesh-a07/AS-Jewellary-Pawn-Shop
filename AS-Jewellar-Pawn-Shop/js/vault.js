/**
 * AS JEWELLAR PAWN SHOP - VAULT & PHYSICAL PACKET TRACKING ENGINE
 * Physical collateral safekeeping, location hierarchy (Vault • Locker • Tray • Packet • Note),
 * Privacy-safe QR code generation, scan resolution, movement auditing, and status lifecycle.
 */

// ==========================================================================
// PURE JAVASCRIPT QR CODE SVG GENERATOR (Zero External Dependencies)
// ==========================================================================
class SimpleQrGenerator {
  /**
   * Deterministic matrix generator for compact QR-like 2D visual code tags
   * Supports standard ASCII alphanumeric payloads
   */
  static generateSvg(text, size = 120) {
    if (!text) text = 'ASJEWELLAR';
    
    // Hash-based deterministic 21x21 matrix generation (QR Version 1 standard layout)
    const N = 21;
    const matrix = Array(N).fill(null).map(() => Array(N).fill(false));

    // Helper: Add Finder Pattern at (r, c)
    const addFinder = (r, c) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (
            i === 0 || i === 6 || j === 0 || j === 6 ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          ) {
            matrix[r + i][c + j] = true;
          } else {
            matrix[r + i][c + j] = false;
          }
        }
      }
    };

    // 1. Position Finder Patterns (Top-Left, Top-Right, Bottom-Left)
    addFinder(0, 0);
    addFinder(0, N - 7);
    addFinder(N - 7, 0);

    // 2. Timing Patterns
    for (let i = 8; i < N - 8; i++) {
      matrix[6][i] = (i % 2 === 0);
      matrix[i][6] = (i % 2 === 0);
    }

    // 3. Dark Module
    matrix[N - 8][8] = true;

    // 4. Encode Payload data into remaining cells
    let charIdx = 0;
    let bitIdx = 0;
    for (let col = N - 1; col > 0; col -= 2) {
      if (col === 6) col--; // Skip timing pattern column
      for (let count = 0; count < N; count++) {
        const row = ((col + 1) & 2) === 0 ? (N - 1 - count) : count;
        for (let cOffset = 0; cOffset < 2; cOffset++) {
          const c = col - cOffset;
          // Avoid reserved finder areas
          const isTopLeft = (row < 9 && c < 9);
          const isTopRight = (row < 9 && c >= N - 8);
          const isBottomLeft = (row >= N - 8 && c < 9);
          const isTiming = (row === 6 || c === 6);

          if (!isTopLeft && !isTopRight && !isBottomLeft && !isTiming) {
            const charCode = text.charCodeAt(charIdx % text.length);
            const bit = (charCode >> (bitIdx % 8)) & 1;
            // Apply simple standard mask: (row + col) % 2 === 0
            const mask = (row + c) % 2 === 0;
            matrix[row][c] = (bit === 1) ? !mask : mask;

            bitIdx++;
            if (bitIdx % 8 === 0) charIdx++;
          }
        }
      }
    }

    // 5. Render SVG Rectangles
    const cellSize = (size / N).toFixed(2);
    let rects = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (matrix[r][c]) {
          rects += `<rect x="${(c * cellSize).toFixed(2)}" y="${(r * cellSize).toFixed(2)}" width="${cellSize}" height="${cellSize}" fill="#0F172A"/>`;
        }
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="background:#FFFFFF; border-radius:4px;">${rects}</svg>`;
  }
}

// ==========================================================================
// VAULT & PLEDGE PACKET MANAGER
// ==========================================================================
class VaultManager {
  constructor() {
    this.storageKeyAudit = 'as_jewellar_vault_audit_store';
    this.auditLogs = this.loadAuditLogs();
    this.allowedStatuses = ['IN_VAULT', 'OUT_FOR_VERIFICATION', 'RELEASED', 'AUCTION_REVIEW'];
    this.remotePackets = [];

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.syncWithBackend(), 200);
    }
  }

  loadAuditLogs() {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(this.storageKeyAudit);
        if (stored) {
          return JSON.parse(stored);
        }
      }
    } catch (e) {
      console.warn('Failed to load vault audit logs', e);
    }
    return [];
  }

  saveAuditLogs(list) {
    this.auditLogs = list;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKeyAudit, JSON.stringify(list));
      }
    } catch (e) {
      console.warn('Failed to save vault audit logs', e);
    }
  }

  normalizeLocker(lockerStr) {
    if (!lockerStr) return 'Locker 01';
    const str = String(lockerStr).trim();
    // Handle "LOCKER-A", "Locker A", "LOCKER_A"
    const letterMatch = str.match(/LOCKER[-_\s]?([A-Z])/i);
    if (letterMatch) {
      const charCode = letterMatch[1].toUpperCase().charCodeAt(0);
      const num = charCode - 65 + 1; // A->1, B->2, etc.
      if (num >= 1 && num <= 20) {
        return `Locker ${num.toString().padStart(2, '0')}`;
      }
    }
    // Handle "LOCKER-01", "Locker 1", "01"
    const numMatch = str.match(/(?:LOCKER[-_\s]?)?0*([1-9]\d*)/i);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      return `Locker ${num.toString().padStart(2, '0')}`;
    }
    return 'Locker 01';
  }

  normalizeVault(vaultStr) {
    if (!vaultStr) return 'Vault A';
    const str = String(vaultStr).trim().toUpperCase();
    if (str === 'VAULT-01' || str === 'VAULT-1' || str === 'VAULT 1' || str === 'VAULT_01' || str === 'VAULT_A' || str === 'VAULT A' || str === 'MAIN') {
      return 'Vault A';
    }
    if (str === 'VAULT-02' || str === 'VAULT-2' || str === 'VAULT 2' || str === 'VAULT_02' || str === 'VAULT_B' || str === 'VAULT B') {
      return 'Vault B';
    }
    if (str.startsWith('VAULT')) {
      const lastChar = str.slice(-1);
      if (/[A-D]/.test(lastChar)) return `Vault ${lastChar}`;
      if (/[1-4]/.test(lastChar)) {
        const letters = ['A', 'B', 'C', 'D'];
        return `Vault ${letters[parseInt(lastChar, 10) - 1] || 'A'}`;
      }
    }
    return 'Vault A';
  }

  normalizeTray(trayStr) {
    if (!trayStr) return 'Tray 01';
    const str = String(trayStr).trim();
    const match = str.match(/(?:TRAY[-_\s]?)?0*([1-9]\d*|[A-Z])/i);
    if (match) {
      const val = match[1];
      if (/^\d+$/.test(val)) {
        return `Tray ${parseInt(val, 10).toString().padStart(2, '0')}`;
      }
      return `Tray ${val.toUpperCase()}`;
    }
    return 'Tray 01';
  }

  normalizeStatus(statusStr) {
    if (!statusStr) return 'IN_VAULT';
    const clean = String(statusStr).trim().toUpperCase().replace(/[\s-]/g, '_');
    if (clean === 'IN_VAULT' || clean === 'STORED' || clean === 'VAULT' || clean === 'SAFE') return 'IN_VAULT';
    if (clean === 'OUT_FOR_VERIFICATION' || clean === 'VERIFICATION' || clean === 'OUT') return 'OUT_FOR_VERIFICATION';
    if (clean === 'RELEASED' || clean === 'REDEEMED' || clean === 'CLOSED' || clean === 'CLOSED_REDEEMED') return 'RELEASED';
    if (clean === 'AUCTION_REVIEW' || clean === 'AUCTION') return 'AUCTION_REVIEW';
    return 'IN_VAULT';
  }

  /**
   * Synchronize Vault Inventory & Packet States with Google Sheets
   */
  async syncWithBackend() {
    try {
      if (typeof window !== 'undefined') {
        if (window.customerManager && typeof window.customerManager.syncWithBackend === 'function') {
          await window.customerManager.syncWithBackend();
        }
        if (window.pledgePosManager && typeof window.pledgePosManager.syncWithBackend === 'function') {
          await window.pledgePosManager.syncWithBackend();
        }
      }
    } catch (e) {
      console.warn('Dependent sync notice in vaultManager:', e);
    }

    if (typeof window === 'undefined' || !window.api || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return this.getPackets('ALL');
    }

    try {
      const res = await window.api.get('getVaultInventory');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        this.remotePackets = res.data;

        // Merge remote packet coordinates into local pledges
        if (window.pledgePosManager && Array.isArray(window.pledgePosManager.pledges)) {
          let updated = false;
          res.data.forEach(rp => {
            const ticketNo = rp.ticketNo || rp.ticket_no;
            const packetId = rp.packetId || rp.packet_id;
            const pledge = window.pledgePosManager.pledges.find(p => 
              (ticketNo && p.ticketNo === ticketNo) || 
              (packetId && p.packetId === packetId)
            );
            if (pledge) {
              if (rp.vaultLocation) pledge.vaultLocation = this.normalizeVault(rp.vaultLocation);
              if (rp.lockerTray) {
                pledge.lockerTray = rp.lockerTray;
                const parts = rp.lockerTray.split(/[•/]/).map(s => s.trim());
                pledge.locker = this.normalizeLocker(parts[0]);
                if (parts[1]) pledge.tray = this.normalizeTray(parts[1]);
              }
              if (rp.packetId) pledge.packetId = rp.packetId;
              if (rp.notes) pledge.locationNote = rp.notes;
              if (rp.status) pledge.packetStatus = this.normalizeStatus(rp.status);
              updated = true;
            }
          });

          if (updated && typeof window.pledgePosManager.savePledges === 'function') {
            window.pledgePosManager.savePledges(window.pledgePosManager.pledges);
          }
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('vaultSynced', { detail: this.getPackets('ALL') }));
        }
      }
    } catch (err) {
      console.warn('Backend vault sync notice:', err);
    }

    return this.getPackets('ALL');
  }

  /**
   * Get Master Packets Directory with Current Inventory State
   */
  getPackets(filter = 'ALL') {
    const pledges = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const customers = (typeof window !== 'undefined' && window.customerManager && window.customerManager.customers) || [];

    const packets = pledges.map(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      const rawLockerTray = p.lockerTray || '';
      const parts = rawLockerTray.split(/[•/]/).map(s => s.trim());
      const rawLocker = p.locker || parts[0] || 'Locker 01';
      const rawTray = p.tray || parts[1] || 'Tray 01';

      const locker = this.normalizeLocker(rawLocker);
      const tray = this.normalizeTray(rawTray);
      const vaultLocation = this.normalizeVault(p.vaultLocation || 'Vault A');

      let packetStatus = p.packetStatus;
      if (!packetStatus) {
        packetStatus = (p.status === 'REDEEMED' || p.status === 'CLOSED_REDEEMED') ? 'RELEASED' : ((p.status === 'AUCTION_REVIEW') ? 'AUCTION_REVIEW' : 'IN_VAULT');
      }
      packetStatus = this.normalizeStatus(packetStatus);

      return {
        packetId: p.packetId || `PKT-${(p.ticketNo || '').slice(-4)}`,
        ticketNo: p.ticketNo,
        customerId: p.customerId,
        customerName: cust ? cust.nameEn : (p.customerName || p.customerId),
        customerNameTa: cust ? (cust.nameTa || '') : (p.customerNameTa || ''),
        mobile: cust ? cust.mobile : (p.mobile || ''),
        vaultLocation: vaultLocation,
        locker: locker,
        tray: tray,
        locationNote: p.locationNote || 'Standard pouch',
        grossWeight: parseFloat(p.totalGrossWeight || p.grossWeight) || 0,
        netWeight: parseFloat(p.totalNetWeight || p.netWeight) || 0,
        loanAmount: parseFloat(p.loanAmount || p.approvedLoan) || 0,
        status: packetStatus,
        pledgeStatus: p.status,
        pledgeDate: p.pledgeDate,
        maturityDate: p.maturityDate,
        items: p.items || []
      };
    });

    // Also include any standalone remote packets not matched in pledges
    if (Array.isArray(this.remotePackets) && this.remotePackets.length > 0) {
      this.remotePackets.forEach(rp => {
        if (!packets.some(pk => pk.ticketNo === rp.ticketNo || pk.packetId === rp.packetId)) {
          const cust = customers.find(c => c.customerId === rp.customerId);
          packets.push({
            packetId: rp.packetId || `PKT-${(rp.ticketNo || '').slice(-4)}`,
            ticketNo: rp.ticketNo || '',
            customerId: rp.customerId || '',
            customerName: cust ? cust.nameEn : (rp.customerName || rp.customerId || 'Customer'),
            customerNameTa: cust ? cust.nameTa : '',
            mobile: cust ? cust.mobile : '',
            vaultLocation: this.normalizeVault(rp.vaultLocation),
            locker: this.normalizeLocker(rp.lockerTray || rp.locker),
            tray: this.normalizeTray(rp.tray),
            locationNote: rp.notes || rp.locationNote || 'Standard pouch',
            grossWeight: parseFloat(rp.grossWeight || rp.totalGrossWeight) || 0,
            netWeight: parseFloat(rp.netWeight || rp.totalNetWeight) || 0,
            loanAmount: parseFloat(rp.loanAmount || rp.approvedLoan) || 0,
            status: rp.status || 'IN_VAULT',
            pledgeStatus: 'ACTIVE',
            pledgeDate: rp.lastVerifiedDate || '',
            maturityDate: '',
            items: []
          });
        }
      });
    }

    if (filter === 'ALL') return packets;
    return packets.filter(pk => pk.status === filter);
  }

  /**
   * Get Packet Details by Ticket Number or Packet ID
   */
  getPacketByTicket(ticketNo) {
    const list = this.getPackets('ALL');
    return list.find(pk => pk.ticketNo === ticketNo || pk.packetId === ticketNo) || null;
  }

  /**
   * 1. Privacy-Safe QR Code Generation
   * Encodes ONLY a safe transaction reference, NO sensitive customer data.
   */
  generateSafePledgeQrPayload(ticketNo, packetId) {
    if (!ticketNo) return 'ASJEW:TKT:UNKNOWN:PKT:UNKNOWN';
    const pkt = packetId || `PKT-${ticketNo.slice(-4)}`;
    return `ASJEW:TKT:${ticketNo}:PKT:${pkt}`;
  }

  generateQrSvg(text, size = 120) {
    return SimpleQrGenerator.generateSvg(text, size);
  }

  /**
   * 2. Scan & Resolution Engine
   * Opens: Pledge number, Customer name, Item summary, Status, Packet location, Outstanding amount, Due date
   */
  resolveScannedQr(qrText) {
    if (!qrText || typeof qrText !== 'string') {
      return { success: false, message: 'Invalid or empty QR scan payload' };
    }

    const raw = qrText.trim();
    let ticketNo = '';
    let packetId = '';

    // Handle standard ASJEW:TKT:<ticket>:PKT:<packet> format
    if (raw.startsWith('ASJEW:TKT:')) {
      const match = raw.match(/ASJEW:TKT:([^:]+):PKT:([^:]+)/);
      if (match) {
        ticketNo = match[1];
        packetId = match[2];
      }
    } else if (raw.startsWith('PLG-')) {
      ticketNo = raw;
    } else if (raw.startsWith('PKT-')) {
      packetId = raw;
    } else {
      ticketNo = raw;
    }

    const pledges = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const customers = (typeof window !== 'undefined' && window.customerManager && window.customerManager.customers) || [];
    const payments = (typeof window !== 'undefined' && window.paymentManager && window.paymentManager.payments) || [];

    const pledge = pledges.find(p => 
      (ticketNo && p.ticketNo === ticketNo) ||
      (packetId && p.packetId === packetId) ||
      p.ticketNo.endsWith(ticketNo)
    );

    if (!pledge) {
      return {
        success: false,
        message: `No active pawn contract found matching reference "${raw}"`,
        rawScanned: raw
      };
    }

    const cust = customers.find(c => c.customerId === pledge.customerId);
    const parts = (pledge.lockerTray || '').split('•').map(s => s.trim());
    const locker = pledge.locker || parts[0] || 'Locker 01';
    const tray = pledge.tray || parts[1] || 'Tray 01';
    const pktId = pledge.packetId || `PKT-${pledge.ticketNo.slice(-4)}`;
    const locNote = pledge.locationNote || 'Standard pouch';

    // Item Summary
    const items = pledge.items || [];
    const itemSummaryList = items.map((it, idx) => 
      `${idx + 1}. ${it.purity || '22K'} ${it.itemType || 'Gold Item'} (Gross: ${Number(it.grossWeight || 0).toFixed(3)}g, Net: ${Number(it.netWeight || 0).toFixed(3)}g)`
    );
    const itemSummaryText = itemSummaryList.length > 0 
      ? itemSummaryList.join(' | ') 
      : `${Number(pledge.totalNetWeight || 0).toFixed(3)}g Gold Collateral`;

    // Outstanding Calculation
    let principalDue = Number(pledge.loanAmount || pledge.approvedLoan) || 0;
    let interestDue = 0;

    if (pledge.status === 'REDEEMED') {
      principalDue = 0;
      interestDue = 0;
    } else {
      if (typeof FinancialCalculator !== 'undefined' && typeof FinancialCalculator.calculateInterestAccrual === 'function') {
        const acc = FinancialCalculator.calculateInterestAccrual(pledge, new Date(), payments);
        interestDue = acc.netInterestDue || 0;
        principalDue = (acc.remainingPrincipal !== undefined) ? acc.remainingPrincipal : principalDue;
      } else if (typeof window !== 'undefined' && window.paymentManager) {
        const acc = window.paymentManager.calculateInterestAccrual(pledge);
        interestDue = acc.netInterestDue || 0;
      }
    }

    const totalOutstandingAmount = Math.round(principalDue + interestDue);

    // Due Date & Days Calculation
    const pledgeDt = new Date(pledge.pledgeDate || pledge.createdAt);
    const maturityDt = new Date(pledge.maturityDate || new Date(pledgeDt).setFullYear(pledgeDt.getFullYear() + 1));
    const today = new Date();
    const diffTime = maturityDt.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isOverdue = diffDays < 0;

    const packetStatus = pledge.packetStatus || ((pledge.status === 'REDEEMED') ? 'RELEASED' : ((pledge.status === 'AUCTION_REVIEW') ? 'AUCTION_REVIEW' : 'IN_VAULT'));

    return {
      success: true,
      ticketNo: pledge.ticketNo,
      packetId: pktId,
      customerId: pledge.customerId,
      customerName: cust ? cust.nameEn : (pledge.customerName || pledge.customerId),
      customerNameTa: cust ? (cust.nameTa || '') : '',
      mobile: cust ? cust.mobile : '',
      itemSummary: itemSummaryText,
      itemsCount: items.length,
      grossWeight: Number(pledge.totalGrossWeight || 0).toFixed(3),
      netWeight: Number(pledge.totalNetWeight || 0).toFixed(3),
      status: packetStatus,
      pledgeStatus: pledge.status,
      packetLocation: {
        vaultLocation: pledge.vaultLocation || 'Vault A',
        locker: locker,
        tray: tray,
        packetId: pktId,
        locationNote: locNote,
        formattedLocation: `${pledge.vaultLocation || 'Vault A'} • ${locker} • ${tray} • ${pktId}`
      },
      outstandingAmount: {
        principal: principalDue,
        accruedInterest: interestDue,
        totalDue: totalOutstandingAmount,
        formatted: `₹ ${totalOutstandingAmount.toLocaleString('en-IN')}`
      },
      dueDate: {
        maturityDate: pledge.maturityDate || maturityDt.toISOString().split('T')[0],
        pledgeDate: pledge.pledgeDate,
        daysRemaining: diffDays,
        isOverdue: isOverdue,
        statusText: isOverdue ? `Overdue by ${Math.abs(diffDays)} Days` : `${diffDays} Days Remaining`
      },
      rawPledge: pledge,
      rawCustomer: cust || null
    };
  }

  /**
   * 3. Update Physical Packet Location with Immutable Movement Audit Logging
   */
  async updatePacketLocation(packetId, newLocationData = {}, reason = '', movedBy = null) {
    if (!reason || reason.trim().length === 0) {
      return { success: false, message: 'Admin reason for physical relocation is required.' };
    }

    const pledges = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const pledge = pledges.find(p => p.packetId === packetId || p.ticketNo.endsWith(packetId.replace('PKT-', '')) || p.ticketNo === packetId);
    if (!pledge) {
      return { success: false, message: 'Pledge packet not found in store.' };
    }

    const previousLocation = `${pledge.vaultLocation || 'Vault A'} • ${pledge.locker || 'Locker 01'} • ${pledge.tray || 'Tray 01'} • ${pledge.packetId || packetId}`;
    const previousStatus = pledge.packetStatus || ((pledge.status === 'REDEEMED') ? 'RELEASED' : 'IN_VAULT');

    const newVault = newLocationData.vaultLocation || pledge.vaultLocation || 'Vault A';
    const newLocker = newLocationData.locker || pledge.locker || 'Locker 01';
    const newTray = newLocationData.tray || pledge.tray || 'Tray 01';
    const newLockerTray = `${newLocker} • ${newTray}`;
    const newStatus = newLocationData.status || previousStatus;
    const newNote = newLocationData.locationNote !== undefined ? newLocationData.locationNote : (pledge.locationNote || '');

    // Validate Status
    if (newStatus && !this.allowedStatuses.includes(newStatus)) {
      return { success: false, message: `Invalid packet status: ${newStatus}. Allowed: ${this.allowedStatuses.join(', ')}` };
    }

    // 1. Update Pledge properties
    pledge.vaultLocation = newVault;
    pledge.locker = newLocker;
    pledge.tray = newTray;
    pledge.lockerTray = newLockerTray;
    pledge.packetStatus = newStatus;
    pledge.locationNote = newNote;
    pledge.updatedAt = new Date().toISOString();

    if (typeof window !== 'undefined' && window.pledgePosManager && typeof window.pledgePosManager.savePledges === 'function') {
      window.pledgePosManager.savePledges(pledges);
    }

    // 2. Record Immutable Audit Log
    const year = new Date().getFullYear();
    const seq = (this.auditLogs.length + 1).toString().padStart(6, '0');
    const logId = `VAULT-LOG-${year}-${seq}`;
    const timestamp = new Date().toISOString();
    const adminUser = movedBy || ((typeof window !== 'undefined' && window.auth && window.auth.getUser()?.username) || 'ADMIN');

    const newLocationFormatted = `${newVault} • ${newLocker} • ${newTray} • ${pledge.packetId || packetId}`;

    const auditEntry = {
      logId,
      packetId: pledge.packetId || packetId,
      ticketNo: pledge.ticketNo,
      previousLocation,
      newLocation: newLocationFormatted,
      previousStatus,
      newStatus,
      locationNote: newNote,
      movedBy: adminUser,
      timestamp,
      reason: reason.trim()
    };

    this.auditLogs.unshift(auditEntry);
    this.saveAuditLogs(this.auditLogs);

    // 3. Sync to backend API if available
    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('updateVaultLocation', {
        ticketNo: pledge.ticketNo,
        packetId: pledge.packetId || packetId,
        newLocation: newLocationFormatted,
        newStatus,
        locationNote: newNote,
        auditEntry
      }).catch(e => console.warn('Vault remote sync notice:', e));
    }

    return {
      success: true,
      updatedPledge: pledge,
      auditEntry
    };
  }

  /**
   * Update Packet Status (e.g. OUT_FOR_VERIFICATION, IN_VAULT, AUCTION_REVIEW)
   */
  async updatePacketStatus(packetId, newStatus, reason = '', movedBy = null) {
    if (!this.allowedStatuses.includes(newStatus)) {
      return { success: false, message: `Status must be one of: ${this.allowedStatuses.join(', ')}` };
    }
    return this.updatePacketLocation(packetId, { status: newStatus }, reason || `Status updated to ${newStatus}`, movedBy);
  }

  /**
   * 4. Initial Packet Assignment upon Pledge Booking
   */
  assignPacket(ticketNo, packetData = {}, movedBy = 'SYSTEM') {
    const pledges = (typeof window !== 'undefined' && window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const pledge = pledges.find(p => p.ticketNo === ticketNo);
    if (!pledge) return null;

    const vault = packetData.vaultLocation || pledge.vaultLocation || 'Vault A';
    const locker = packetData.locker || 'Locker 01';
    const tray = packetData.tray || 'Tray 01';
    const packetId = packetData.packetId || pledge.packetId || `PKT-${ticketNo.slice(-4)}`;
    const note = packetData.locationNote || pledge.locationNote || 'Standard pouch';

    pledge.vaultLocation = vault;
    pledge.locker = locker;
    pledge.tray = tray;
    pledge.lockerTray = `${locker} • ${tray}`;
    pledge.packetId = packetId;
    pledge.locationNote = note;
    pledge.packetStatus = 'IN_VAULT';

    const logEntry = {
      logId: `VAULT-LOG-${new Date().getFullYear()}-${(this.auditLogs.length + 1).toString().padStart(6, '0')}`,
      packetId,
      ticketNo,
      previousLocation: 'UNASSIGNED',
      newLocation: `${vault} • ${locker} • ${tray} • ${packetId}`,
      previousStatus: 'NEW',
      newStatus: 'IN_VAULT',
      locationNote: note,
      movedBy,
      timestamp: new Date().toISOString(),
      reason: 'Initial safe vault allocation upon pledge booking'
    };

    this.auditLogs.unshift(logEntry);
    this.saveAuditLogs(this.auditLogs);
    return logEntry;
  }

  /**
   * 5. Release Physical Packet upon Pledge Redemption
   */
  releasePacket(packetId, ticketNo, user = 'ADMIN', notes = 'Redemption article handover') {
    const timestamp = new Date().toISOString();
    const seq = (this.auditLogs.length + 1).toString().padStart(6, '0');
    const auditEntry = {
      logId: `VAULT-LOG-${new Date().getFullYear()}-${seq}`,
      packetId: packetId,
      ticketNo: ticketNo,
      previousLocation: 'IN_VAULT',
      newLocation: 'RELEASED_TO_BORROWER',
      previousStatus: 'IN_VAULT',
      newStatus: 'RELEASED',
      statusAfter: 'RELEASED',
      reason: notes,
      timestamp: timestamp,
      movedBy: user,
      performedBy: user
    };

    this.auditLogs.unshift(auditEntry);
    this.saveAuditLogs(this.auditLogs);

    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('updateVaultLocation', {
        packetId,
        ticketNo,
        newLocation: 'RELEASED_TO_BORROWER',
        newStatus: 'RELEASED',
        reason: notes,
        auditEntry
      }).catch(e => console.warn('Vault release remote sync notice:', e));
    }

    return auditEntry;
  }

  /**
   * Get Chronological Movement History for a Packet
   */
  getPacketAuditHistory(packetId) {
    if (!packetId) return [];
    return this.auditLogs.filter(log => 
      log.packetId === packetId || 
      log.ticketNo === packetId ||
      log.ticketNo.endsWith(packetId.replace('PKT-', ''))
    );
  }

  /**
   * Vault Capacity & Inventory Metrics
   */
  getVaultStats() {
    const list = this.getPackets('ALL');

    const inVault = list.filter(p => p.status === 'IN_VAULT');
    const outForVerif = list.filter(p => p.status === 'OUT_FOR_VERIFICATION');
    const released = list.filter(p => p.status === 'RELEASED');
    const auctionRev = list.filter(p => p.status === 'AUCTION_REVIEW');

    const totalGoldWeight = inVault.reduce((sum, p) => sum + (Number(p.netWeight) || 0), 0);
    const totalCapitalStored = inVault.reduce((sum, p) => sum + (Number(p.loanAmount) || 0), 0);

    return {
      totalPacketsInVault: inVault.length,
      outForVerificationCount: outForVerif.length,
      releasedCount: released.length,
      auctionReviewCount: auctionRev.length,
      totalGoldWeightInSafe: totalGoldWeight,
      totalCapitalStoredInSafe: totalCapitalStored
    };
  }

  /**
   * Generate Printable Compact Packet QR Tag (72mm / 80mm Sticker Label)
   */
  generatePacketQrTag(packet) {
    const qrPayload = this.generateSafePledgeQrPayload(packet.ticketNo, packet.packetId);
    const qrSvg = this.generateQrSvg(qrPayload, 80);

    return `
      <div style="width:74mm; max-width:100%; border:2px dashed #0F172A; border-radius:8px; padding:12px; background:#FFF; font-family:var(--font-family-base, sans-serif); color:#000; box-sizing:border-box;">
        <div style="text-align:center; border-bottom:1.5px solid #0F172A; padding-bottom:4px; margin-bottom:8px;">
          <div style="font-size:13px; font-weight:900; letter-spacing:0.5px;">AS JEWELLAR PAWN SHOP</div>
          <div style="font-size:9px; font-weight:800; color:#475569; text-transform:uppercase;">SAFE VAULT PACKET TAG (பெட்டக உறை)</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; gap:8px;">
          <div>
            <div style="font-size:17px; font-weight:900; color:#0F172A; letter-spacing:-0.5px;">${packet.packetId}</div>
            <div style="font-size:11.5px; font-weight:800; color:#1E40AF;">Ticket: ${packet.ticketNo}</div>
            <div style="font-size:10px; color:#64748B;">Date: ${packet.pledgeDate || 'Today'}</div>
          </div>
          <div style="flex-shrink:0;">
            ${qrSvg}
          </div>
        </div>

        <div style="border-top:1px dashed #94A3B8; border-bottom:1px dashed #94A3B8; padding:6px 0; margin-bottom:8px; font-size:11px; display:flex; flex-direction:column; gap:2px;">
          <div><strong>Customer:</strong> ${packet.customerName}</div>
          <div><strong>Location:</strong> <span style="font-weight:800; color:#0F172A;">${packet.vaultLocation} &bull; ${packet.locker} &bull; ${packet.tray}</span></div>
          <div><strong>Note:</strong> ${packet.locationNote || 'Standard pouch'}</div>
          <div style="margin-top:2px;"><strong>Net Wt:</strong> <span style="font-weight:800; color:#B45309;">${Number(packet.netWeight).toFixed(3)} g</span> &bull; <strong>Gross:</strong> ${Number(packet.grossWeight).toFixed(3)} g</div>
          <div><strong>Loan Principal:</strong> <span style="font-weight:800; color:#15803D;">₹ ${Number(packet.loanAmount).toLocaleString('en-IN')}</span></div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:9.5px; font-weight:800;">
          <span>STATUS: ${packet.status}</span>
          <span>MATURITY: ${packet.maturityDate || '-'}</span>
        </div>
      </div>
    `;
  }
}

// Global VaultManager Instance
if (typeof window !== 'undefined') {
  window.vaultManager = new VaultManager();
  window.SimpleQrGenerator = SimpleQrGenerator;
}

// Export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VaultManager, SimpleQrGenerator };
}

