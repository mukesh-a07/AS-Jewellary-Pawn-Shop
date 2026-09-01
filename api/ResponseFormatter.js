/**
 * AS JEWELLAR PAWN SHOP - GOOGLE APPS SCRIPT BACKEND
 * Uniform Response Formatter
 * 
 * Enforces standard API response structure:
 * {
 *   success: Boolean,
 *   message: String,
 *   data: Object | Array | null,
 *   errorCode: String
 * }
 */

const ResponseFormatter = {
  success: function(data, message) {
    const payload = {
      success: true,
      message: message || "Operation completed successfully",
      data: data !== undefined ? data : null,
      errorCode: ""
    };
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  },

  error: function(message, errorCode, data) {
    const payload = {
      success: false,
      message: message || "An unexpected error occurred",
      data: data !== undefined ? data : null,
      errorCode: errorCode || "UNKNOWN_ERROR"
    };
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  }
};
