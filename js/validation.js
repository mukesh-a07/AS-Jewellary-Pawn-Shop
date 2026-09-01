/**
 * AS JEWELLAR PAWN SHOP - VALIDATION & FORMATTING UTILITIES
 * Client-side validation for phone numbers, jewellery weights, loan figures, and currency.
 */

const Validation = {
  /**
   * Validate Indian 10-digit mobile number starting with 6, 7, 8, or 9
   */
  isValidMobile(mobile) {
    if (!mobile) return false;
    const clean = String(mobile).replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(clean);
  },

  /**
   * Validate Aadhaar last 4 digits
   */
  isValidAadhaarLast4(digits) {
    if (!digits) return false;
    return /^\d{4}$/.test(String(digits).trim());
  },

  /**
   * Validate PIN code (6 digits)
   */
  isValidPincode(pin) {
    if (!pin) return false;
    return /^[1-9]\d{5}$/.test(String(pin).trim());
  },

  /**
   * Validate Jewellery Weights
   */
  validateWeights(gross, stone) {
    const grossVal = parseFloat(gross) || 0;
    const stoneVal = parseFloat(stone) || 0;

    if (grossVal <= 0) {
      return { valid: false, message: 'Gross weight must be greater than 0g' };
    }
    if (stoneVal < 0) {
      return { valid: false, message: 'Stone weight cannot be negative' };
    }
    if (stoneVal >= grossVal) {
      return { valid: false, message: 'Stone weight cannot exceed or equal gross weight' };
    }

    const netVal = Number((grossVal - stoneVal).toFixed(3));
    return { valid: true, netWeight: netVal };
  },

  /**
   * Validate Loan Amount & Interest Rate
   */
  validateLoan(amount, interestRate) {
    const amt = parseFloat(amount) || 0;
    const rate = parseFloat(interestRate) || 0;

    if (amt <= 0) {
      return { valid: false, message: 'Loan amount must be greater than ₹0' };
    }
    if (rate < 0 || rate > 5) { // typical TN pawn rate bounds check
      return { valid: false, message: 'Interest rate must be between 0% and 5% per month' };
    }

    return { valid: true };
  },

  /**
   * Format Indian Rupee currency (e.g. ₹ 2,45,000)
   */
  formatINR(amount) {
    const num = parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    }).format(num);
  },

  /**
   * Format Weight in grams (e.g. 12.850 g)
   */
  formatWeight(grams) {
    const num = parseFloat(grams) || 0;
    return num.toFixed(3) + ' g';
  },

  /**
   * Format Date to standard Indian business format: 29-Aug-2026
   */
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  },

  /**
   * Defensive HTML Entity Encoder (XSS Prevention)
   */
  escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Google Sheets / CSV Formula Injection Neutralizer
   * Escapes strings starting with =, +, -, @, \t, \r
   */
  sanitizeFormula(str) {
    if (str === null || str === undefined) return '';
    const clean = String(str).trim();
    if (/^[=+\-@\t\r]/.test(clean)) {
      return `'${clean}`;
    }
    return clean;
  },

  /**
   * General Counter Input Sanitizer
   */
  sanitizeString(str, maxLength = 250) {
    if (!str) return '';
    return String(str).trim().slice(0, maxLength);
  }
};

window.Validation = Validation;

