/**
 * AS JEWELLAR PAWN SHOP - VAULT & PACKET LOCATION MANAGEMENT
 * Physical inventory tracking, location hierarchy, immutable movement auditing, and printable QR tags.
 */

class VaultManager {
  constructor() {
    this.storageKeyAudit = 'as_jewellar_vault_audit_store';
    this.auditLogs = this.loadAuditLogs();
  }

  loadAuditLogs() {
    try {
      const stored = localStorage.getItem(this.storageKeyAudit);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load vault audit logs', e);
    }
    // ✅ PRODUCTION: No seed data. Vault logs are created as pledges are issued.
    this.saveAuditLogs([]);
    return [];
  }

  saveAuditLogs(list) {
    this.auditLogs = list;
    try {
      localStorage.setItem(this.storageKeyAudit, JSON.stringify(list));
    } catch (e) {
      console.warn('Failed to save vault audit logs', e);
    }
  }

  /**
   * Get Master Packets Directory
   */
  getPackets(filter = 'ALL') {
    const pledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const customers = (window.customerManager && window.customerManager.customers) || [];

    const packets = pledges.map(p => {
      const cust = customers.find(c => c.customerId === p.customerId);
      const parts = (p.lockerTray || '').split('•').map(s => s.trim());
      const locker = parts[0] || 'Locker 01';
      const tray = parts[1] || 'Tray 01';

      let packetStatus = p.packetStatus;
      if (!packetStatus) {
        packetStatus = (p.status === 'REDEEMED') ? 'RELEASED' : ((p.status === 'AUCTION_REVIEW') ? 'AUCTION_REVIEW' : 'IN_VAULT');
      }

      return {
        packetId: p.packetId || `PKT-${p.ticketNo.slice(-4)}`,
        ticketNo: p.ticketNo,
        customerId: p.customerId,
        customerName: cust ? cust.nameEn : p.customerId,
        customerNameTa: cust ? (cust.nameTa || '') : '',
        mobile: cust ? cust.mobile : '',
        vaultLocation: p.vaultLocation || 'Vault A',
        locker: locker,
        tray: tray,
        locationNote: p.locationNote || 'Standard pouch',
        grossWeight: p.totalGrossWeight || 0,
        netWeight: p.totalNetWeight || 0,
        loanAmount: p.loanAmount || 0,
        status: packetStatus,
        pledgeStatus: p.status,
        pledgeDate: p.pledgeDate,
        maturityDate: p.maturityDate
      };
    });

    if (filter === 'IN_VAULT') {
      return packets.filter(pk => pk.status === 'IN_VAULT');
    }
    if (filter === 'OUT_FOR_VERIFICATION') {
      return packets.filter(pk => pk.status === 'OUT_FOR_VERIFICATION');
    }
    if (filter === 'RELEASED') {
      return packets.filter(pk => pk.status === 'RELEASED');
    }
    if (filter === 'AUCTION_REVIEW') {
      return packets.filter(pk => pk.status === 'AUCTION_REVIEW');
    }

    return packets;
  }

  /**
   * Get Packet details by Ticket Number
   */
  getPacketByTicket(ticketNo) {
    const list = this.getPackets('ALL');
    return list.find(pk => pk.ticketNo === ticketNo) || null;
  }

  /**
   * Update Physical Packet Location with Immutable Movement Audit Logging
   */
  async updatePacketLocation(packetId, newLocationData = {}, reason = '') {
    if (!reason || reason.trim().length === 0) {
      return { success: false, message: 'Admin reason for physical relocation is required.' };
    }

    const pledges = window.pledgePosManager.pledges;
    const pledge = pledges.find(p => p.packetId === packetId || p.ticketNo.endsWith(packetId.replace('PKT-', '')));
    if (!pledge) {
      return { success: false, message: 'Pledge packet not found in records.' };
    }

    const previousLocation = `${pledge.vaultLocation || 'Vault A'} • ${pledge.lockerTray || 'Locker 01 • Tray 01'}`;
    const previousStatus = pledge.packetStatus || ((pledge.status === 'REDEEMED') ? 'RELEASED' : 'IN_VAULT');

    const newVault = newLocationData.vaultLocation || pledge.vaultLocation || 'Vault A';
    const newLocker = newLocationData.locker || 'Locker 01';
    const newTray = newLocationData.tray || 'Tray 01';
    const newLockerTray = `${newLocker} • ${newTray}`;
    const newStatus = newLocationData.status || previousStatus;
    const newNote = newLocationData.locationNote !== undefined ? newLocationData.locationNote : (pledge.locationNote || '');

    // 1. Update Pledge
    pledge.vaultLocation = newVault;
    pledge.lockerTray = newLockerTray;
    pledge.packetStatus = newStatus;
    pledge.locationNote = newNote;
    pledge.updatedAt = new Date().toISOString();
    window.pledgePosManager.savePledges(pledges);

    // 2. Record Immutable Audit Log
    const year = new Date().getFullYear();
    const seq = (this.auditLogs.length + 1).toString().padStart(6, '0');
    const logId = `VAULT-LOG-${year}-${seq}`;
    const timestamp = new Date().toISOString();
    const adminUser = (window.auth && window.auth.getUser()?.username) || 'ADMIN';

    const newLocationFormatted = `${newVault} • ${newLockerTray}`;

    const auditEntry = {
      logId,
      packetId,
      ticketNo: pledge.ticketNo,
      previousLocation,
      newLocation: newLocationFormatted,
      previousStatus,
      newStatus,
      movedBy: adminUser,
      timestamp,
      reason: reason.trim()
    };

    this.auditLogs.unshift(auditEntry);
    this.saveAuditLogs(this.auditLogs);

    // 3. Sync to backend API
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('updateVaultLocation', {
        ticketNo: pledge.ticketNo,
        packetId,
        newLocation: newLocationFormatted,
        newStatus,
        auditEntry
      }).catch(e => console.warn(e));
    }

    return {
      success: true,
      updatedPledge: pledge,
      auditEntry
    };
  }

  /**
   * Get Chronological Movement History for a Packet
   */
  getPacketAuditHistory(packetId) {
    return this.auditLogs.filter(log => log.packetId === packetId || log.ticketNo === packetId);
  }

  /**
   * Calculate Vault Capacity & Inventory Metrics
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
   * Generate Printable Compact Packet QR Tag (80mm / Sticker Label)
   */
  generatePacketQrTag(packet) {
    const qrPayload = `ASJEWELLAR:PKT:${packet.packetId}:${packet.ticketNo}:WT${Number(packet.netWeight).toFixed(2)}`;
    const qrSvg = (window.billingManager && window.billingManager.generateSimpleQr)
      ? window.billingManager.generateSimpleQr(qrPayload)
      : `<div style="padding:10px; border:1px dashed #000; font-size:10px;">[ QR: ${qrPayload} ]</div>`;

    return `
      <div style="width:72mm; max-width:100%; border:2px dashed #0F172A; border-radius:6px; padding:10px; background:#FFF; font-family:monospace; color:#000; box-sizing:border-box;">
        <div style="text-align:center; border-bottom:1px solid #000; padding-bottom:4px; margin-bottom:6px;">
          <div style="font-size:12px; font-weight:900; letter-spacing:0.5px;">AS JEWELLAR PAWN SHOP</div>
          <div style="font-size:9px; font-weight:bold;">SAFE VAULT PACKET TAG</div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div>
            <div style="font-size:16px; font-weight:900; color:#000;">${packet.packetId}</div>
            <div style="font-size:11px; font-weight:bold;">Ticket: ${packet.ticketNo}</div>
          </div>
          <div style="width:48px; height:48px;">
            ${qrSvg}
          </div>
        </div>

        <div style="border-top:1px dashed #666; border-bottom:1px dashed #666; padding:4px 0; margin-bottom:6px; font-size:11px;">
          <div><strong>Cust:</strong> ${packet.customerName}</div>
          <div><strong>Loc:</strong> ${packet.vaultLocation} &bull; ${packet.locker} &bull; ${packet.tray}</div>
          <div><strong>Net Wt:</strong> ${Number(packet.netWeight).toFixed(3)} g &bull; <strong>Gross:</strong> ${Number(packet.grossWeight).toFixed(3)} g</div>
          <div><strong>Loan:</strong> ₹ ${Number(packet.loanAmount).toLocaleString('en-IN')}</div>
        </div>

        <div style="font-size:9px; text-align:center; font-weight:bold;">
          PLEDGE: ${packet.pledgeDate} &bull; STATUS: ${packet.status}
        </div>
      </div>
    `;
  }
}

// Global VaultManager Instance
window.vaultManager = new VaultManager();
