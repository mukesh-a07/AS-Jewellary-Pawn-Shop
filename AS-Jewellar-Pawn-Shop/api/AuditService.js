/**
 * AS JEWELLAR PAWN SHOP - GOOGLE APPS SCRIPT BACKEND
 * Audit Trail Service
 * 
 * Immutable logging of all financial, customer, rate, and administrative operations.
 */

const AuditService = {
  /**
   * Log an action to AuditLogs sheet
   */
  log: function(actorId, action, entityType, entityId, previousState, newState, deviceMeta) {
    try {
      const sheet = DatabaseService.getSheet("AuditLogs");
      if (!sheet) return;

      const auditId = DatabaseService.generateId("AUD");
      const timestamp = new Date().toISOString();

      sheet.appendRow([
        auditId,
        actorId || "ADMIN",
        action || "UNKNOWN_ACTION",
        entityType || "SYSTEM",
        typeof entityId === "object" ? JSON.stringify(entityId) : (entityId || ""),
        previousState ? JSON.stringify(previousState) : "",
        newState ? JSON.stringify(newState) : "",
        deviceMeta ? JSON.stringify(deviceMeta) : "Web PWA Client",
        timestamp
      ]);
    } catch (err) {
      console.error("Audit logging error:", err);
    }
  }
};
