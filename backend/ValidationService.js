/**
 * AS JEWELLAR PAWN SHOP - GOOGLE APPS SCRIPT BACKEND
 * Validation & Payload Sanitization Service
 */

const ValidationService = {
  sanitizeString: function(str) {
    if (str === null || str === undefined) return "";
    return String(str).trim();
  },

  sanitizeNumber: function(val, fallback) {
    const num = parseFloat(val);
    return isNaN(num) ? (fallback !== undefined ? fallback : 0) : num;
  },

  isValidMobile: function(mobile) {
    if (!mobile) return false;
    const clean = String(mobile).replace(/\D/g, "");
    return /^[6-9]\d{9}$/.test(clean);
  },

  validateCustomerPayload: function(data) {
    if (!data) return { valid: false, message: "Payload missing" };
    
    const name = this.sanitizeString(data.nameEn || data.name);
    const mobile = this.sanitizeString(data.mobile);

    if (!name) return { valid: false, message: "Customer name is required" };
    if (!this.isValidMobile(mobile)) return { valid: false, message: "Valid 10-digit mobile number required" };

    return { valid: true };
  },

  validatePledgePayload: function(data) {
    if (!data) return { valid: false, message: "Pledge payload missing" };
    
    const customerId = this.sanitizeString(data.customerId);
    const loanAmount = this.sanitizeNumber(data.loanAmount, 0);
    const interestRate = this.sanitizeNumber(data.interestRate, 1.0);

    if (!customerId) return { valid: false, message: "Customer ID required" };
    if (loanAmount <= 0) return { valid: false, message: "Loan amount must be greater than 0" };
    if (interestRate < 0 || interestRate > 5.0) return { valid: false, message: "Interest rate out of allowable range" };

    return { valid: true };
  }
};
