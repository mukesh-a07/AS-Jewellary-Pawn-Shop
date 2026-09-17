/**
 * AS JEWELLAR PAWN SHOP - DATA RELIABILITY & HEALTH SERVICE
 * Orchestrates database backup triggers, anomaly detection, transaction integrity scans,
 * audit log querying, and Admin-confirmed non-destructive repairs.
 */

class DataHealthService {
  constructor() {
    this.latestScanResult = null;
    this.latestBackupStatus = null;
  }

  /**
   * Runs cloud database integrity scan
   */
  async runCloudIntegrityScan() {
    if (!navigator.onLine || !window.api || !window.api.isConfigured()) {
      return {
        success: false,
        message: 'Cloud API unavailable (Offline mode). Run local scan instead.'
      };
    }
    try {
      const res = await window.api.get('checkDataIntegrity');
      if (res && res.success) {
        return res.data;
      }
      return { success: false, message: res ? res.message : 'Scan failed' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Runs local client-side integrity scan on IndexedDB & localStorage
   */
  async runLocalIntegrityScan() {
    const localAnomalies = [];
    let anomalyCount = 1;

    // 1. Inspect Offline Queue
    if (window.offlineQueue) {
      const queue = await window.offlineQueue.getAllQueue();
      const conflicts = queue.filter(q => q.syncStatus === 'CONFLICT' || q.syncStatus === 'FAILED');
      conflicts.forEach(item => {
        localAnomalies.push({
          anomalyId: `LOCAL-ANOM-${Date.now()}-${anomalyCount++}`,
          type: 'UNRESOLVED_SYNC_CONFLICT',
          entityType: 'SYNC_QUEUE',
          entityId: item.localTxId,
          severity: item.syncStatus === 'CONFLICT' ? 'CRITICAL' : 'WARNING',
          description: `Offline transaction ${item.localTxId} (${item.type}) has unresolved ${item.syncStatus} state: ${item.errorMessage || 'Unknown error'}.`,
          details: item,
          detectedAt: new Date().toISOString(),
          suggestedRepair: 'RETRY_SYNC_OR_RESOLVE',
          resolvable: true
        });
      });
    }

    // 2. Check Local Storage Customer Cache
    try {
      const customersStr = localStorage.getItem('as_jewellar_cached_customers');
      if (customersStr) {
        const cached = JSON.parse(customersStr);
        const seenIds = new Set();
        cached.forEach(c => {
          if (seenIds.has(c.customerId)) {
            localAnomalies.push({
              anomalyId: `LOCAL-ANOM-${Date.now()}-${anomalyCount++}`,
              type: 'DUPLICATE_LOCAL_CUSTOMER_ID',
              entityType: 'CUSTOMER',
              entityId: c.customerId,
              severity: 'WARNING',
              description: `Duplicate customer ID ${c.customerId} in local offline cache.`,
              details: c,
              detectedAt: new Date().toISOString(),
              suggestedRepair: 'CLEAR_LOCAL_CUSTOMER_CACHE',
              resolvable: true
            });
          }
          seenIds.add(c.customerId);
        });
      }
    } catch (e) {}

    return {
      totalLocalAnomalies: localAnomalies.length,
      anomalies: localAnomalies
    };
  }

  /**
   * Combines cloud and local integrity checks
   */
  async runFullIntegrityScan() {
    const localRes = await this.runLocalIntegrityScan();
    let cloudRes = null;

    if (navigator.onLine && window.api && window.api.isConfigured()) {
      cloudRes = await this.runCloudIntegrityScan();
    }

    let allAnomalies = [...localRes.anomalies];
    let totalRecords = 0;
    let recordCounts = {};
    let cloudScore = 100;

    if (cloudRes && cloudRes.anomalies) {
      allAnomalies = allAnomalies.concat(cloudRes.anomalies);
      totalRecords = cloudRes.totalRecords || 0;
      recordCounts = cloudRes.recordCounts || {};
      cloudScore = cloudRes.healthScore || 100;
    }

    // Calculate Combined Health Score
    const criticalCount = allAnomalies.filter(a => a.severity === 'CRITICAL').length;
    const warningCount = allAnomalies.filter(a => a.severity === 'WARNING').length;
    const infoCount = allAnomalies.filter(a => a.severity === 'INFO').length;

    const penalty = (criticalCount * 15) + (warningCount * 5) + (infoCount * 1);
    const healthScore = Math.max(0, 100 - penalty);

    this.latestScanResult = {
      healthScore,
      healthGrade: healthScore >= 95 ? 'OPTIMAL' : (healthScore >= 80 ? 'GOOD' : (healthScore >= 60 ? 'FAIR' : 'ACTION_REQUIRED')),
      totalRecords,
      recordCounts,
      totalAnomalies: allAnomalies.length,
      severityCounts: {
        critical: criticalCount,
        warning: warningCount,
        info: infoCount
      },
      anomalies: allAnomalies,
      scanTimestamp: new Date().toISOString(),
      isCloudConnected: Boolean(cloudRes && cloudRes.anomalies)
    };

    window.dispatchEvent(new CustomEvent('integrityScanCompleted', { detail: this.latestScanResult }));
    return this.latestScanResult;
  }

  /**
   * Creates a cloud database backup snapshot
   */
  async createCloudBackup(type = 'MANUAL') {
    const isApiReady = window.api && (typeof window.api.isConfigured === 'function' ? window.api.isConfigured() : Boolean(window.api.endpoint));
    if (!navigator.onLine || !isApiReady) {
      throw new Error('Cloud backup requires an active internet connection and configured API endpoint');
    }

    const res = await window.api.post('createBackup', { type });
    if (res && res.success) {
      if (window.auditLogger) {
        window.auditLogger.log('BACKUP_CREATE', 'BACKUP', res.data.backup ? res.data.backup.backupId : 'CLOUD-BKP', { type });
      }
      return res.data;
    }
    throw new Error(res ? res.message : 'Backup creation failed');
  }

  /**
   * Retrieves backup status and history
   */
  async getBackupStatus() {
    const isApiReady = window.api && (typeof window.api.isConfigured === 'function' ? window.api.isConfigured() : Boolean(window.api.endpoint));
    if (!navigator.onLine || !isApiReady) {
      // Fallback local status
      return {
        status: 'OFFLINE_CACHED',
        lastSuccessfulBackup: null,
        lastFailure: null,
        totalBackupsCount: 0,
        recentBackups: [],
        isAutomatedTriggerActive: false
      };
    }

    try {
      const res = await window.api.get('getBackupStatus');
      if (res && res.success) {
        this.latestBackupStatus = res.data;
        return res.data;
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Sets up automated daily backup trigger
   */
  async setupDailyBackupTrigger() {
    const res = await window.api.post('setupDailyBackupTrigger', {});
    if (res && res.success) {
      if (window.auditLogger) {
        window.auditLogger.log('SETTINGS_CHANGE', 'BACKUP_TRIGGER', 'DAILY_2300_IST', { action: 'SETUP_DAILY_TRIGGER' });
      }
      return res.data;
    }
    throw new Error(res ? res.message : 'Trigger setup failed');
  }

  /**
   * Exports full client-side JSON snapshot
   */
  exportLocalBackupJson() {
    const backupData = {
      timestamp: new Date().toISOString(),
      shop: 'AS Jewellar Pawn Shop',
      storage: { ...localStorage },
      userAgent: navigator.userAgent
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AS_Jewellar_Local_Backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (window.auditLogger) {
      window.auditLogger.log('BACKUP_CREATE', 'LOCAL_BACKUP', 'CLIENT_JSON_EXPORT', { sizeBytes: blob.size });
    }
  }

  /**
   * Exports full cloud database JSON snapshot and triggers browser download
   */
  async exportCloudBackupJson() {
    const res = await window.api.get('exportDatabaseJson');
    if (!res || !res.success) {
      throw new Error(res ? res.message : 'Cloud export failed');
    }

    const dump = res.data.dump || res.data;
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AS_Jewellar_Cloud_Database_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return res.data;
  }

  /**
   * Retrieves audit trail with filtering
   */
  async getAuditLogs(params = {}) {
    if (navigator.onLine && window.api && window.api.isConfigured()) {
      try {
        const res = await window.api.get('getAuditLogs', params);
        if (res && res.success) {
          return res.data;
        }
      } catch (e) {}
    }

    // Fallback to local logs
    const local = window.auditLogger ? window.auditLogger.getLocalAuditLogs() : [];
    return {
      totalCount: local.length,
      limit: params.limit || 100,
      offset: 0,
      logs: local.reverse()
    };
  }

  /**
   * Executes Admin-confirmed non-destructive repair
   */
  async repairAnomaly(anomalyId, action, adminNotes, extraData = {}) {
    const user = window.auth ? window.auth.getUser() : null;
    if (!user || user.role !== 'ADMIN') {
      throw new Error('Only Shop Administrators are authorized to execute data integrity repairs');
    }

    const payload = {
      anomalyId,
      action,
      adminNotes,
      adminConfirmation: true,
      ...extraData
    };

    const res = await window.api.post('repairAnomaly', payload);
    if (res && res.success) {
      if (window.auditLogger) {
        window.auditLogger.log('REPAIR_ANOMALY', 'INTEGRITY', anomalyId, { action, adminNotes });
      }
      return res.data;
    }
    throw new Error(res ? res.message : 'Repair execution failed');
  }
}

const dataHealthService = new DataHealthService();
if (typeof window !== 'undefined') {
  window.dataHealthService = dataHealthService;
  window.DataHealthService = DataHealthService;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DataHealthService, dataHealthService };
}
