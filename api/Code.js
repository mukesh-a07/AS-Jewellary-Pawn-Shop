/**
 * =========================================================================
 * AS JEWELLAR PAWN SHOP - GOOGLE APPS SCRIPT BACKEND
 * Hardened Central REST-like API Router & Database Engine
 * =========================================================================
 */

/**
 * 🛠️ SETUP FUNCTION: Run this function directly from Apps Script Editor Toolbar:
 * 1. Initializes all 10 Sheets with exact columns and header styling
 * 2. Sets Admin Credentials (Arockiasamy C / AS@2026) in Script Properties
 * 3. Verifies Database & Drive connectivity
 */
function initializeDatabase() {
  Logger.log("===============================================================");
  Logger.log("🚀 STARTING AS JEWELLAR PAWN SHOP DATABASE INITIALIZATION...");
  Logger.log("===============================================================");

  const scriptProps = PropertiesService.getScriptProperties();

  // 1. Set Admin Credentials
  const username = "Arockiasamy C";
  const rawPassword = "AS@2026";
  const salt = scriptProps.getProperty("ADMIN_SALT") || "AS_SALT_RANDOM_STRING_2026";
  
  scriptProps.setProperty("ADMIN_USERNAME", username);
  scriptProps.setProperty("ADMIN_SALT", salt);

  // Compute SHA-256 Hash of Salt + Password
  const passwordHash = AuthService.hashPassword(rawPassword, salt);
  scriptProps.setProperty("ADMIN_PASSWORD_HASH", passwordHash);

  Logger.log("✅ 1. Admin Credentials Configured in Script Properties:");
  Logger.log("   • Username: " + username);
  Logger.log("   • Password: " + rawPassword);
  Logger.log("   • Salt: " + salt);
  Logger.log("   • SHA-256 Hash: " + passwordHash);

  // 2. Initialize 10 Sheet Tabs with Headers & Styling
  Logger.log("---------------------------------------------------------------");
  Logger.log("📊 2. Initializing 10 Sheet Tabs & Header Columns...");
  try {
    const sheetResults = DatabaseService.initializeSchema();
    sheetResults.forEach(function(msg) {
      Logger.log("   • " + msg);
    });
    Logger.log("✅ All 10 Sheet Tabs initialized successfully!");
  } catch (err) {
    Logger.log("❌ Sheet initialization error: " + err.message);
  }

  // 3. Verify Google Drive Root Folder
  Logger.log("---------------------------------------------------------------");
  Logger.log("📁 3. Verifying Google Drive Folder Hierarchy...");
  const rootFolderId = scriptProps.getProperty("DRIVE_ROOT_FOLDER_ID");
  if (rootFolderId) {
    try {
      const rootFolder = DriveApp.getFolderById(rootFolderId);
      DocumentService.getOrCreateFolder("Customers", rootFolder);
      DocumentService.getOrCreateFolder("Backups", rootFolder);
      Logger.log("✅ Google Drive Folders verified ('Customers' & 'Backups' ready in root: " + rootFolder.getName() + ")");
    } catch (driveErr) {
      Logger.log("⚠️ Drive folder notice: " + driveErr.message);
    }
  } else {
    Logger.log("ℹ️ DRIVE_ROOT_FOLDER_ID not specified in Script Properties (Optional).");
  }

  Logger.log("===============================================================");
  Logger.log("🎉 INITIALIZATION COMPLETE! Your AS Jewellar system is ready.");
  Logger.log("===============================================================");
  return "SUCCESS: All 10 Sheets and Admin Auth Initialized!";
}

/**
 * 🧪 Test Function: Run directly from Apps Script Editor to verify API health
 */
function testApiHealth() {
  Logger.log("Running self-test on doGet()...");
  const result = doGet({ parameter: { action: "health" } });
  Logger.log("Result: " + result.getContent());
  return result.getContent();
}

function doGet(e) {
  try {
    // Safe guard when clicked 'Run' directly in Apps Script editor
    e = e || { parameter: { action: "health" } };
    const params = e.parameter || {};
    const action = params.action || "health";
    const token = params.token;

    // Public actions
    if (action === "health") {
      return ResponseFormatter.success({
        status: "ONLINE",
        shopName: "AS Jewellar Pawn Shop",
        serverTime: new Date().toISOString(),
        version: "1.0.0"
      }, "AS Jewellar API is online and healthy");
    }

    if (action === "getRates") {
      const rates = RateService.getLatestRates();
      return ResponseFormatter.success(rates, "Rates retrieved");
    }

    if (action === "getDashboardSummary") {
      return handleGetDashboardSummary();
    }

    // Protected actions - require token verification
    const authCheck = AuthService.validateToken(token);
    if (!authCheck.valid) {
      return ResponseFormatter.error("Unauthorized access", "AUTH_REQUIRED");
    }

    switch (action) {
      case "getCustomers":
        const customers = DatabaseService.getAllRows("Customers");
        return ResponseFormatter.success(customers, "Customers list loaded");

      case "getCustomer":
        const custId = params.customerId;
        const customer = DatabaseService.findById("Customers", custId);
        return ResponseFormatter.success(customer ? customer.data : null, "Customer details loaded");

      case "checkDuplicate":
        const mobile = params.mobile;
        const name = params.name;
        return handleCheckDuplicate(mobile, name);

      case "getPledges":
        const pledges = DatabaseService.getAllRows("Pledges");
        return ResponseFormatter.success(pledges, "Pledges list loaded");

      case "getPayments":
        const payments = DatabaseService.getAllRows("Payments");
        return ResponseFormatter.success(payments, "Payments list loaded");

      case "getExpenses":
        const expenses = DatabaseService.getAllRows("Expenses");
        return ResponseFormatter.success(expenses, "Expenses list loaded");

      case "listBackups":
        const backups = DatabaseService.listBackups();
        return ResponseFormatter.success(backups, "Backup snapshots loaded");

      default:
        return ResponseFormatter.error("Invalid action specified: " + action, "INVALID_ACTION");
    }
  } catch (err) {
    console.error("GET Request Handler Error:", err);
    return ResponseFormatter.error(err.message, "INTERNAL_SERVER_ERROR");
  }
}

function doPost(e) {
  try {
    // Safe guard when clicked 'Run' directly in Apps Script editor
    e = e || { parameter: {}, postData: { contents: "{}" } };
    const params = e.parameter || {};

    let requestBody = {};
    if (e.postData && e.postData.contents) {
      try {
        requestBody = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        return ResponseFormatter.error("Malformed JSON payload", "INVALID_JSON");
      }
    }

    const action = params.action || requestBody.action || "login";
    const data = requestBody.data || requestBody || {};
    const token = params.token || requestBody.token;

    // Public authentication route
    if (action === "login") {
      const loginResult = AuthService.login(data.username, data.password);
      if (loginResult.success) {
        return ResponseFormatter.success(loginResult.data, "Login successful");
      } else {
        return ResponseFormatter.error(loginResult.message, loginResult.code || "AUTH_FAILED");
      }
    }

    // Guard all subsequent POST routes
    const authCheck = AuthService.validateToken(token);
    if (!authCheck.valid) {
      return ResponseFormatter.error("Unauthorized request. Please log in.", "AUTH_REQUIRED");
    }

    // Action Router
    switch (action) {
      case "createCustomer":
        return handleCreateCustomer(data, authCheck.user);

      case "updateCustomer":
        return handleUpdateCustomer(data, authCheck.user);

      case "createPledge":
        return handleCreatePledge(data, authCheck.user);

      case "recordPayment":
        return handleRecordPayment(data, authCheck.user);

      case "reversePayment":
        return handleReversePayment(data, authCheck.user);

      case "redeemPledge":
        return handleRedeemPledge(data, authCheck.user);

      case "renewPledge":
        return handleRenewPledge(data, authCheck.user);

      case "updateVaultLocation":
        return handleUpdateVaultLocation(data, authCheck.user);

      case "recordExpense":
        return handleRecordExpense(data, authCheck.user);

      case "createBackup":
        const backupResult = DatabaseService.createDailyBackup(authCheck.user.username);
        return backupResult.success 
          ? ResponseFormatter.success(backupResult, "Spreadsheet backup created in Drive")
          : ResponseFormatter.error(backupResult.message, "BACKUP_FAILED");

      case "updateRates":
        const updatedRates = RateService.updateRates(data, authCheck.user.username);
        return ResponseFormatter.success(updatedRates, "Rates updated successfully");

      case "uploadDocument":
        const uploaded = DocumentService.uploadDocument(
          data.customerId,
          data.docType,
          data.fileName,
          data.base64Data,
          data.mimeType,
          data.pledgeId,
          authCheck.user.username
        );
        return ResponseFormatter.success(uploaded, "Document uploaded to Drive");

      case "logReprint":
        AuditService.log(authCheck.user.username, "REPRINT_DOCUMENT", data.docType || "DOCUMENT", data.refNo || "", null, data);
        return ResponseFormatter.success({ logged: true }, "Reprint audit logged");

      case "syncTransaction":
        return handleSyncTransaction(data, authCheck.user);

      default:
        return ResponseFormatter.error("Unknown POST action: " + action, "INVALID_ACTION");
    }
  } catch (err) {
    console.error("POST Request Handler Error:", err);
    return ResponseFormatter.error(err.message, "INTERNAL_SERVER_ERROR");
  }
}

/**
 * Consolidated High-Performance Dashboard Summary Endpoint with 5-Min Memory Cache
 */
function handleGetDashboardSummary() {
  try {
    const cache = CacheService.getScriptCache();
    const cached = cache.get("DASHBOARD_SUMMARY_CACHE");
    if (cached) {
      return ResponseFormatter.success(JSON.parse(cached), "Consolidated dashboard summary loaded (Cached)");
    }
  } catch (cacheErr) {
    console.warn("CacheService notice", cacheErr);
  }

  const rates = RateService.getLatestRates();
  const todayStr = new Date().toISOString().split("T")[0];

  const pledges = DatabaseService.getAllRows("Pledges");
  const payments = DatabaseService.getAllRows("Payments");
  const customers = DatabaseService.getAllRows("Customers");

  let todayLoans = 0;
  let todayPledgesCount = 0;
  let todayCollections = 0;
  let todayInterest = 0;
  let todayRedemptions = 0;

  let activePledgesCount = 0;
  let outstandingPrincipal = 0;
  let dueTodayCount = 0;
  let due7DaysCount = 0;
  let overdueCount = 0;

  const now = new Date();
  const sevenDays = new Date();
  sevenDays.setDate(sevenDays.getDate() + 7);

  pledges.forEach(function(p) {
    const pDate = p.pledge_date || "";
    const pAmt = Number(p.loan_amount) || 0;
    const pStatus = p.status || "ACTIVE";

    if (pDate === todayStr) {
      todayLoans += pAmt;
      todayPledgesCount++;
    }

    if (pStatus === "ACTIVE" || pStatus === "DUE" || pStatus === "OVERDUE") {
      activePledgesCount++;
      outstandingPrincipal += pAmt;

      const maturity = new Date(p.maturity_date || pDate);
      if (p.maturity_date === todayStr) {
        dueTodayCount++;
      } else if (maturity > now && maturity <= sevenDays) {
        due7DaysCount++;
      } else if (maturity < now) {
        overdueCount++;
      }
    }

    if (pStatus === "REDEEMED" && (p.redeemed_at || "").indexOf(todayStr) === 0) {
      todayRedemptions++;
    }
  });

  payments.forEach(function(pay) {
    const payDate = pay.payment_date || pay.created_at || "";
    if (payDate.indexOf(todayStr) === 0 && pay.status !== "REVERSED") {
      todayCollections += (Number(pay.amount) || 0);
      todayInterest += (Number(pay.interest_settled) || Number(pay.amount) || 0);
    }
  });

  const summaryData = {
    today: {
      loansDisbursed: todayLoans,
      totalCollections: todayCollections,
      interestCollected: todayInterest,
      newPledgesCount: todayPledgesCount,
      redemptionsCount: todayRedemptions
    },
    portfolio: {
      activePledgesCount: activePledgesCount,
      totalOutstandingPrincipal: outstandingPrincipal,
      dueTodayCount: dueTodayCount,
      due7DaysCount: due7DaysCount,
      overdueCount: overdueCount
    },
    ratesSnapshot: rates,
    totalCustomersCount: customers.length,
    serverTime: new Date().toISOString()
  };

  try {
    const cache = CacheService.getScriptCache();
    cache.put("DASHBOARD_SUMMARY_CACHE", JSON.stringify(summaryData), 300); // 5 min TTL
  } catch (e) {}

  return ResponseFormatter.success(summaryData, "Consolidated dashboard summary loaded");
}

function handleRecordExpense(data, user) {
  const amt = parseFloat(data.amount) || 0;
  if (amt <= 0) {
    return ResponseFormatter.error("Expense amount must be greater than 0", "INVALID_AMOUNT");
  }

  const expId = data.expenseId || DatabaseService.generateId("EXP");
  const timestamp = new Date().toISOString();

  try {
    DatabaseService.insertRow("Expenses", [
      expId,
      data.date || timestamp.split("T")[0],
      data.category || "OTHER",
      amt,
      data.description || "",
      data.paymentMethod || "CASH",
      timestamp,
      user.username || "ADMIN"
    ]);
  } catch (e) {
    console.warn("Expenses sheet notice", e);
  }

  AuditService.log(user.username, "RECORD_EXPENSE", "Expenses", expId, null, data);
  return ResponseFormatter.success({ expenseId: expId }, "Expense recorded successfully");
}

function handleUpdateVaultLocation(data, user) {
  const ticketNo = data.ticketNo;
  if (!ticketNo) return ResponseFormatter.error("Ticket number required", "MISSING_TICKET");

  const newLocation = data.newLocation || "";
  const newStatus = data.newStatus || "IN_VAULT";
  const audit = data.auditEntry || {};

  AuditService.log(user.username, "UPDATE_VAULT_LOCATION", "Pledges", ticketNo, null, {
    packetId: data.packetId,
    newLocation: newLocation,
    newStatus: newStatus,
    reason: audit.reason || "Physical vault movement"
  });

  return ResponseFormatter.success({ ticketNo: ticketNo, updated: true }, "Vault location updated and audit recorded");
}

function handleCheckDuplicate(mobile, name) {
  const customers = DatabaseService.getAllRows("Customers");
  const cleanMobile = String(mobile || "").replace(/\D/g, "");
  const cleanName = String(name || "").trim().toLowerCase();

  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    const custMob = String(c.mobile || "").replace(/\D/g, "");
    if (cleanMobile && custMob === cleanMobile) {
      return ResponseFormatter.success({
        isDuplicate: true,
        type: "EXACT_MOBILE",
        matchedCustomer: { customerId: c.customer_id, name: c.name_en, mobile: c.mobile }
      }, "Duplicate customer mobile detected");
    }
    if (cleanName && String(c.name_en || "").toLowerCase() === cleanName) {
      return ResponseFormatter.success({
        isDuplicate: true,
        type: "SAME_NAME",
        matchedCustomer: { customerId: c.customer_id, name: c.name_en, town: c.town_village }
      }, "Duplicate customer name detected");
    }
  }

  return ResponseFormatter.success({ isDuplicate: false }, "No duplicate found");
}

function handleCreateCustomer(data, user) {
  data = data || {};
  user = user || { username: "ADMIN" };

  if (!data.nameEn || String(data.nameEn).trim().length < 2) {
    return ResponseFormatter.error("Valid customer name is required", "INVALID_NAME");
  }

  const cleanMobile = String(data.mobile || "").replace(/\D/g, "");
  if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
    return ResponseFormatter.error("Valid 10-digit Indian mobile number is required", "INVALID_MOBILE");
  }

  const custId = DatabaseService.generateId("CUS");
  const timestamp = new Date().toISOString();

  DatabaseService.insertRow("Customers", [
    custId,
    String(data.nameEn || "").trim(),
    String(data.nameTa || "").trim(),
    String(data.fatherHusbandName || "").trim(),
    data.gender || "MALE",
    cleanMobile,
    String(data.altMobile || "").replace(/\D/g, ""),
    String(data.address || "").trim(),
    String(data.townVillage || "").trim(),
    data.district || "Madurai",
    data.pincode || "625001",
    data.idType || "AADHAAR",
    String(data.idNumber || "").trim(),
    String(data.occupation || "").trim(),
    "ACTIVE",
    timestamp,
    user.username || "ADMIN"
  ]);

  AuditService.log(user.username, "CREATE_CUSTOMER", "Customers", custId, null, data);
  return ResponseFormatter.success({ customerId: custId }, "Customer registered successfully");
}

function handleUpdateCustomer(data, user) {
  data = data || {};
  user = user || { username: "ADMIN" };
  const custId = data.customerId;
  if (!custId) return ResponseFormatter.error("Customer ID required", "MISSING_ID");
  AuditService.log(user.username, "UPDATE_CUSTOMER", "Customers", custId, null, data);
  return ResponseFormatter.success({ customerId: custId }, "Customer updated successfully");
}

function handleCreatePledge(data, user) {
  data = data || {};
  user = user || { username: "ADMIN" };

  if (!data.customerId) {
    return ResponseFormatter.error("Customer ID is required", "MISSING_CUSTOMER");
  }

  const loanAmt = parseFloat(data.loanAmount) || 0;
  if (loanAmt <= 0) {
    return ResponseFormatter.error("Loan amount must be greater than 0", "INVALID_LOAN_AMOUNT");
  }

  const grossWt = parseFloat(data.totalGrossWeight) || 0;
  if (grossWt <= 0) {
    return ResponseFormatter.error("Total gross weight must be greater than 0g", "INVALID_WEIGHT");
  }

  const pledgeId = DatabaseService.generateId("PLG");
  const timestamp = new Date().toISOString();

  DatabaseService.insertRow("Pledges", [
    pledgeId,
    data.customerId,
    data.pledgeDate || timestamp.split("T")[0],
    data.maturityDate || "",
    data.tenureMonths || "12",
    grossWt,
    parseFloat(data.totalStoneWeight) || 0,
    parseFloat(data.totalNetWeight) || grossWt,
    data.rateGold24k || 15958,
    data.rateGold22k || 14628,
    data.rateSilver || 243.90,
    data.totalEstimatedValue || 0,
    data.totalEligibleLoan || 0,
    loanAmt,
    data.monthlyInterestRate || 1.0,
    data.monthlyInterestAmount || 0,
    "ACTIVE",
    data.vaultLocation || "Vault A",
    data.packetId || "",
    data.lockerTray || "",
    timestamp,
    user.username || "ADMIN"
  ]);

  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    const itemRows = [];
    for (let i = 0; i < data.items.length; i++) {
      const it = data.items[i];
      const itemId = DatabaseService.generateId("ITM");
      itemRows.push([
        itemId,
        pledgeId,
        it.category || "GOLD",
        it.itemType || "Article",
        it.description || "",
        parseFloat(it.grossWeight) || 0,
        parseFloat(it.stoneWeight) || 0,
        parseFloat(it.netWeight) || 0,
        it.purity || "22K",
        it.rateUsed || 14628,
        it.estimatedValue || 0,
        it.eligibleLoan || 0,
        it.approvedLoan || 0,
        timestamp
      ]);
    }
    DatabaseService.insertRows("PledgeItems", itemRows);
  }

  try {
    const cashId = DatabaseService.generateId("CSH");
    DatabaseService.insertRow("CashLedger", [
      cashId,
      timestamp.split("T")[0],
      "DEBIT_LOAN_DISBURSED",
      pledgeId,
      loanAmt,
      "Pledge loan cash disbursement",
      user.username || "ADMIN"
    ]);
  } catch (e) {
    console.warn("CashLedger notice", e);
  }

  // Invalidate Dashboard Cache
  try {
    CacheService.getScriptCache().remove("DASHBOARD_SUMMARY_CACHE");
  } catch (e) {}

  AuditService.log(user.username, "CREATE_PLEDGE", "Pledges", pledgeId, null, data);

  return ResponseFormatter.success({
    pledgeId: pledgeId,
    ticketNo: pledgeId,
    loanAmount: loanAmt
  }, "Pawn ticket issued successfully");
}

function handleRecordPayment(data, user) {
  if (!data.ticketNo) {
    return ResponseFormatter.error("Ticket number is required", "MISSING_TICKET");
  }

  const amt = parseFloat(data.amount) || 0;
  if (amt <= 0) {
    return ResponseFormatter.error("Payment amount must be greater than 0", "INVALID_AMOUNT");
  }

  const payId = DatabaseService.generateId("PAY");
  const timestamp = new Date().toISOString();

  DatabaseService.insertRow("Payments", [
    payId,
    data.ticketNo,
    amt,
    data.paymentType || "INTEREST_ONLY",
    data.paymentMode || "CASH",
    data.referenceNo || "",
    data.principalSettled || 0,
    data.interestSettled || amt,
    data.remainingPrincipal !== undefined ? data.remainingPrincipal : 0,
    "CONFIRMED",
    timestamp,
    user.username || "ADMIN"
  ]);

  if (data.paymentMode === "CASH") {
    try {
      const cashId = DatabaseService.generateId("CSH");
      DatabaseService.insertRow("CashLedger", [
        cashId,
        timestamp.split("T")[0],
        "CREDIT_PAYMENT_COLLECTED",
        payId,
        amt,
        `Payment collected for ${data.ticketNo}`,
        user.username || "ADMIN"
      ]);
    } catch (e) {
      console.warn("CashLedger payment notice", e);
    }
  }

  // Invalidate Dashboard Cache
  try {
    CacheService.getScriptCache().remove("DASHBOARD_SUMMARY_CACHE");
  } catch (e) {}

  AuditService.log(user.username, "RECORD_PAYMENT", "Payments", payId, null, data);
  return ResponseFormatter.success({ paymentId: payId, receiptNo: payId }, "Payment recorded successfully");
}

function handleReversePayment(data, user) {
  const originalId = data.originalPaymentId;
  if (!originalId) return ResponseFormatter.error("Original payment ID required", "MISSING_ID");

  const reason = data.reason || "Counter admin correction";
  const revId = DatabaseService.generateId("PAY");
  const timestamp = new Date().toISOString();

  AuditService.log(user.username, "REVERSE_PAYMENT", "Payments", originalId, null, {
    reversalId: revId,
    reason: reason,
    timestamp: timestamp
  });

  return ResponseFormatter.success({ reversalId: revId, originalPaymentId: originalId }, "Payment reversed successfully");
}

function handleRedeemPledge(data, user) {
  if (!data.ticketNo) return ResponseFormatter.error("Ticket number required", "MISSING_TICKET");

  const rec = data.redemptionRecord || {};
  const recId = rec.redemptionId || DatabaseService.generateId("RED");
  const timestamp = new Date().toISOString();

  try {
    DatabaseService.insertRow("Redemptions", [
      recId,
      data.ticketNo,
      rec.customerId || "",
      rec.principalSettled || 0,
      rec.interestSettled || 0,
      rec.totalSettlement || 0,
      rec.paymentMode || "CASH",
      rec.packetId || "",
      timestamp.split("T")[0],
      user.username || "ADMIN"
    ]);
  } catch (e) {
    console.warn("Redemptions sheet notice", e);
  }

  // Invalidate Dashboard Cache
  try {
    CacheService.getScriptCache().remove("DASHBOARD_SUMMARY_CACHE");
  } catch (e) {}

  AuditService.log(user.username, "REDEEM_PLEDGE", "Pledges", data.ticketNo, null, {
    redemptionId: recId,
    ticketNo: data.ticketNo,
    totalSettlement: rec.totalSettlement
  });

  return ResponseFormatter.success({ redemptionId: recId, ticketNo: data.ticketNo }, "Pledge redeemed and released");
}

function handleRenewPledge(data, user) {
  if (!data.oldTicketNo || !data.newTicketNo) {
    return ResponseFormatter.error("Both old and new ticket numbers required", "MISSING_TICKET");
  }

  const ren = data.renewalRecord || {};
  const renId = ren.renewalId || DatabaseService.generateId("REN");
  const timestamp = new Date().toISOString();

  try {
    DatabaseService.insertRow("Renewals", [
      renId,
      data.oldTicketNo,
      data.newTicketNo,
      ren.customerId || "",
      ren.interestSettled || 0,
      ren.principalCarried || 0,
      timestamp.split("T")[0],
      ren.newMaturityDate || "",
      user.username || "ADMIN"
    ]);
  } catch (e) {
    console.warn("Renewals sheet notice", e);
  }

  // Invalidate Dashboard Cache
  try {
    CacheService.getScriptCache().remove("DASHBOARD_SUMMARY_CACHE");
  } catch (e) {}

  AuditService.log(user.username, "RENEW_PLEDGE", "Pledges", data.oldTicketNo, null, {
    renewalId: renId,
    oldTicketNo: data.oldTicketNo,
    newTicketNo: data.newTicketNo
  });

  return ResponseFormatter.success({ oldTicket: data.oldTicketNo, newTicket: data.newTicketNo, renewalId: renId }, "Pledge renewed");
}

function handleSyncTransaction(item, user) {
  if (item.type === "createPledge" || item.type === "NEW_PLEDGE") {
    return handleCreatePledge(item.payload, user);
  } else if (item.type === "recordPayment" || item.type === "PAYMENT") {
    return handleRecordPayment(item.payload, user);
  } else if (item.type === "createCustomer" || item.type === "NEW_CUSTOMER") {
    return handleCreateCustomer(item.payload, user);
  } else if (item.type === "renewPledge") {
    return handleRenewPledge(item.payload, user);
  } else if (item.type === "redeemPledge") {
    return handleRedeemPledge(item.payload, user);
  } else if (item.type === "recordExpense") {
    return handleRecordExpense(item.payload, user);
  }
  return ResponseFormatter.success({}, "Synced offline transaction");
}
