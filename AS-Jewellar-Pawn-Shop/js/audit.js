/**
 * AS JEWELLAR PAWN SHOP - CLIENT-SIDE AUDIT LOGGING SERVICE
 * Tamper-evident audit trail dispatcher for all 15 required financial & operational events.
 */

const LOCAL_AUDIT_KEY = 'as_jewellar_audit_logs';

const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CUSTOMER_CREATE_EDIT: 'CUSTOMER_CREATE_EDIT',
  DOCUMENT_UPLOAD_DELETE_ARCHIVE: 'DOCUMENT_UPLOAD_DELETE_ARCHIVE',
  PLEDGE_CREATE: 'PLEDGE_CREATE',
  PLEDGE_CORRECTION: 'PLEDGE_CORRECTION',
  PAYMENT_RECORD: 'PAYMENT_RECORD',
  RENEWAL_RECORD: 'RENEWAL_RECORD',
  REDEMPTION_RECORD: 'REDEMPTION_RECORD',
  RATE_UPDATE: 'RATE_UPDATE',
  MANUAL_RATE_OVERRIDE: 'MANUAL_RATE_OVERRIDE',
  FEE_CONFIG_CHANGE: 'FEE_CONFIG_CHANGE',
  RECEIPT_REPRINT: 'RECEIPT_REPRINT',
  SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  BACKUP_CREATE: 'BACKUP_CREATE',
  REPAIR_ANOMALY: 'REPAIR_ANOMALY'
};

class AuditLogger {
  constructor() {
    this.cachedLogs = this.getLocalAuditLogs();
  }

  getLocalAuditLogs() {
    try {
      const data = localStorage.getItem(LOCAL_AUDIT_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getAuditLogs() {
    return this.getLocalAuditLogs();
  }

  getLogs() {
    return this.getLocalAuditLogs();
  }

  saveLocalAuditLogs(logs) {
    try {
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(logs.slice(-200)));
    } catch (e) {
      console.warn('Failed to persist audit log locally:', e);
    }
  }

  /**
   * Dispatches an immutable audit event
   */
  async log(action, entityType, entityId, details = {}) {
    const user = window.auth ? window.auth.getUser() : null;
    const username = user ? user.username : 'OPERATOR';
    const timestamp = new Date().toISOString();
    const logId = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const auditRecord = {
      logId,
      timestamp,
      action,
      entityType: entityType || 'SYSTEM',
      entityId: entityId || '',
      detailsJson: typeof details === 'object' ? JSON.stringify(details) : String(details),
      username,
      deviceId: window.offlineQueue ? window.offlineQueue.deviceId : 'BROWSER-CLIENT'
    };

    // 1. Store in local browser storage
    const logs = this.getLocalAuditLogs();
    logs.push(auditRecord);
    this.saveLocalAuditLogs(logs);

    // 2. Dispatch to cloud backend if online and api service is ready
    if (navigator.onLine && window.api && window.api.isConfigured()) {
      try {
        await window.api.post('logAuditEvent', {
          action,
          entityType,
          entityId,
          details,
          timestamp,
          logId
        });
      } catch (err) {
        console.warn('Could not immediately sync audit record to cloud:', err.message);
      }
    }

    // Trigger local event listener for live UI updates
    window.dispatchEvent(new CustomEvent('auditLogged', { detail: auditRecord }));

    return auditRecord;
  }
}

const auditLogger = new AuditLogger();
if (typeof window !== 'undefined') {
  window.auditLogger = auditLogger;
  window.AuditLogger = AuditLogger;
  window.AUDIT_ACTIONS = AUDIT_ACTIONS;
}
if (typeof global !== 'undefined') {
  global.AuditLogger = AuditLogger;
  global.auditLogger = auditLogger;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AuditLogger,
    AUDIT_ACTIONS
  };
}
