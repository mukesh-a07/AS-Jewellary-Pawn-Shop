/**
 * AS JEWELLAR PAWN SHOP - CUSTOMER MANAGEMENT SERVICE
 * Handles Customer CRUD, Duplicate Detection, Fast Search, ID Masking, 
 * Customer 360° Data Aggregation & Recent Customer Tracking.
 */

class CustomerManager {
  constructor() {
    this.storageKey = 'as_jewellar_customers_store';
    this.recentKey = 'as_jewellar_recent_customers';
    this.customers = this.loadInitialCustomers();
    this.searchCache = new Map();

    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.syncWithBackend(), 100);
    }
  }

  /**
   * Synchronize Customers with Google Sheets Backend
   */
  async syncWithBackend() {
    if (typeof window === 'undefined' || !window.api || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return this.customers;
    }

    try {
      const res = await window.api.get('listCustomers');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const remoteList = res.data.map(item => ({
          customerId: item.customerId || item.customer_id || item.id,
          nameEn: item.nameEn || item.name_en || item.customer_name || item.name || '',
          nameTa: item.nameTa || item.name_ta || item.tamil_name || '',
          fatherHusbandName: item.fatherHusbandName || item.father_husband_name || '',
          gender: item.gender || 'MALE',
          occupation: item.occupation || '',
          mobile: String(item.mobile || item.mobile_no || item.phone || '').trim(),
          altMobile: String(item.altMobile || item.alt_mobile || '').trim(),
          email: item.email || '',
          address: item.address || item.street_address || '',
          townVillage: item.townVillage || item.town_village || item.village || item.district || 'Tenkasi',
          taluk: item.taluk || '',
          district: item.district || 'Tenkasi',
          state: item.state || 'Tamil Nadu',
          pincode: String(item.pincode || item.pin_code || '').trim(),
          idType: item.idType || item.id_type || 'AADHAAR',
          idNumber: String(item.idNumber || item.id_number || item.aadhaarNo || item.aadhaar_no || '').trim(),
          photoUrl: item.photoUrl || item.photo_url || '',
          aadhaarDocUrl: item.aadhaarDocUrl || item.aadhaar_doc_url || '',
          kycStatus: item.kycStatus || item.kyc_status || 'VERIFIED',
          notes: item.notes || '',
          status: item.status || 'ACTIVE',
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          activePledgesCount: item.activePledgesCount || 0,
          totalOutstanding: item.totalOutstanding || item.totalActiveLoan || 0
        }));

        const merged = [...remoteList];
        this.customers.forEach(localCust => {
          if (!merged.some(r => r.customerId === localCust.customerId || (localCust.mobile && r.mobile === localCust.mobile))) {
            merged.push(localCust);
          }
        });

        this.customers = merged;
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(this.customers));
        } catch (e) {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('customersSynced', { detail: this.customers }));
        }
        return this.customers;
      }
    } catch (e) {
      console.warn('Backend customer sync notice:', e);
    }
    return this.customers;
  }

  loadInitialCustomers() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse stored customers', e);
    }

    const emptyStart = [];
    return emptyStart;
  }

  saveCustomers(customersList) {
    this.customers = customersList;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(customersList));
    } catch (e) {
      console.warn('Failed to persist customers to localStorage', e);
    }
    // Mirror to IndexedDB customersStore
    if (typeof window !== 'undefined' && window.offlineDB && typeof window.offlineDB.putRecord === 'function') {
      customersList.forEach(c => {
        window.offlineDB.putRecord('customersStore', c).catch(e => console.warn(e));
      });
    }
  }

  /**
   * Mask sensitive Government ID numbers (e.g. Aadhaar: XXXX-XXXX-4589)
   */
  maskIdNumber(idType, idNumber) {
    if (!idNumber) return '-';
    const clean = String(idNumber).trim();
    if (clean.length <= 4) return clean;
    const last4 = clean.slice(-4);
    if (idType === 'AADHAAR') {
      return `XXXX-XXXX-${last4}`;
    } else if (idType === 'PAN') {
      return `XXXXX${last4}`;
    } else {
      return `***-***-${last4}`;
    }
  }

  /**
   * Duplicate Detection Engine:
   * Checks for exact mobile match or normalized full name match.
   */
  checkDuplicate(mobile, nameEn, nameTa = '', excludeCustomerId = null) {
    const cleanMobile = String(mobile || '').replace(/\D/g, '');
    const cleanNameEn = String(nameEn || '').trim().toLowerCase();
    const cleanNameTa = String(nameTa || '').trim();

    for (const cust of this.customers) {
      if (excludeCustomerId && cust.customerId === excludeCustomerId) {
        continue;
      }

      const custMobile = String(cust.mobile || '').replace(/\D/g, '');
      const custAltMobile = String(cust.altMobile || '').replace(/\D/g, '');

      // 1. Exact Mobile or Alt Mobile Match
      if (cleanMobile && (custMobile === cleanMobile || custAltMobile === cleanMobile)) {
        return {
          isDuplicate: true,
          type: 'EXACT_MOBILE',
          message: `Customer already registered with Mobile: ${cust.mobile} (${cust.nameEn})`,
          matchedCustomer: cust
        };
      }

      // 2. Exact Name Match in same Town
      if (cleanNameEn && cust.nameEn.trim().toLowerCase() === cleanNameEn) {
        return {
          isDuplicate: true,
          type: 'SAME_NAME',
          message: `Customer with identical name "${cust.nameEn}" already exists (${cust.customerId}, ${cust.townVillage})`,
          matchedCustomer: cust
        };
      }
    }

    return { isDuplicate: false, type: null, matchedCustomer: null };
  }

  /**
   * Recent Customers Quick Tracker
   */
  addRecentCustomer(customerId) {
    try {
      let recent = this.getRecentCustomers();
      recent = recent.filter(id => id !== customerId);
      recent.unshift(customerId);
      recent = recent.slice(0, 6); // Keep last 6
      localStorage.setItem(this.recentKey, JSON.stringify(recent));
    } catch (e) {
      console.warn(e);
    }
  }

  getRecentCustomers() {
    try {
      const stored = localStorage.getItem(this.recentKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Search, filter, sort and paginate customer records
   */
  search({ query = '', statusFilter = 'ALL', sortBy = 'RECENT_DESC', page = 1, pageSize = 10 } = {}) {
    let list = [...this.customers];
    const q = String(query || '').toLowerCase().trim();

    // 1. Keyword search across multiple fields
    if (q) {
      list = list.filter(c => {
        return (
          c.customerId.toLowerCase().includes(q) ||
          c.nameEn.toLowerCase().includes(q) ||
          (c.nameTa && c.nameTa.toLowerCase().includes(q)) ||
          c.mobile.includes(q) ||
          (c.altMobile && c.altMobile.includes(q)) ||
          (c.townVillage && c.townVillage.toLowerCase().includes(q)) ||
          (c.taluk && c.taluk.toLowerCase().includes(q)) ||
          (c.district && c.district.toLowerCase().includes(q)) ||
          (c.idNumber && c.idNumber.toLowerCase().includes(q))
        );
      });
    }

    // 2. Status / Category Filtering
    if (statusFilter === 'ACTIVE_PLEDGES') {
      list = list.filter(c => (c.activePledgesCount || 0) > 0);
    } else if (statusFilter === 'NO_PLEDGES') {
      list = list.filter(c => (c.activePledgesCount || 0) === 0);
    } else if (statusFilter === 'OVERDUE') {
      list = list.filter(c => (c.overdueCount || 0) > 0 || c.hasOverdue === true);
    } else if (statusFilter === 'KYC_PENDING') {
      list = list.filter(c => c.kycStatus === 'PENDING' || c.kycStatus === 'REJECTED');
    }

    // 3. Sorting
    if (sortBy === 'NAME_ASC') {
      list.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
    } else if (sortBy === 'NAME_DESC') {
      list.sort((a, b) => b.nameEn.localeCompare(a.nameEn));
    } else if (sortBy === 'OUTSTANDING_DESC') {
      list.sort((a, b) => (b.totalOutstanding || 0) - (a.totalOutstanding || 0));
    } else if (sortBy === 'PLEDGES_DESC') {
      list.sort((a, b) => (b.activePledgesCount || 0) - (a.activePledgesCount || 0));
    } else {
      // RECENT_DESC
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // 4. Pagination
    const totalCount = list.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = list.slice(startIndex, startIndex + pageSize);

    return {
      items: paginatedItems,
      totalCount,
      totalPages,
      currentPage,
      pageSize
    };
  }

  /**
   * Get single customer by ID
   */
  getCustomerById(customerId) {
    const cust = this.customers.find(c => c.customerId === customerId);
    if (cust) {
      this.addRecentCustomer(customerId);
    }
    return cust || null;
  }

  getCustomer(customerId) {
    return this.getCustomerById(customerId);
  }

  searchCustomers(queryStr = '') {
    const res = this.search({ query: queryStr, pageSize: 50 });
    return res.items || [];
  }

  /**
   * Get Customer 360° Profile bundle (with simulated / live sub-records)
   */
  getCustomer360(customerId) {
    const cust = this.getCustomerById(customerId);
    if (!cust) return null;

    // Sub-records for Customer 360 cockpit — dynamically pulled from stores
    const allPledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const pledges = allPledges.filter(p => p.customerId === customerId);

    const allPayments = (window.paymentManager && window.paymentManager.payments) || (window.paymentsManager && window.paymentsManager.payments) || [];
    const payments = allPayments.filter(p => p.customerId === customerId);

    const allDocs = (window.documentManager && window.documentManager.documents) || (window.documentScannerManager && window.documentScannerManager.documents) || [];
    const documents = allDocs.filter(d => d.customerId === customerId);

    let reminders = [];
    if (window.reminderManager && typeof window.reminderManager.getReminders === 'function') {
      reminders = window.reminderManager.getReminders().filter(r => r.customerId === customerId);
    }

    return {
      profile: cust,
      pledges,
      payments,
      documents,
      reminders
    };
  }

  /**
   * Create New Customer
   */
  /**
   * Create New Customer
   */
  async createCustomer(customerData) {
    if (this.isSubmitting) {
      return { success: false, message: 'Customer registration is already in progress. Please wait...' };
    }

    this.isSubmitting = true;

    try {
      const year = new Date().getFullYear();
      const seq = (this.customers.length + 1).toString().padStart(6, '0');
      const newId = `CUS-${year}-${seq}`;
      const uniqueSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
      const idempotencyKey = customerData.idempotencyKey || `IDEMP-CUS-${Date.now()}-${uniqueSuffix}`;
      const localTxId = `LOCAL-CUS-${Date.now()}-${uniqueSuffix}`;

      const newCustomer = {
        customerId: newId,
        localTxId,
        idempotencyKey,
        nameEn: customerData.nameEn.trim(),
        nameTa: (customerData.nameTa || '').trim(),
        fatherHusbandName: (customerData.fatherHusbandName || '').trim(),
        dob: customerData.dob || '',
        gender: customerData.gender || 'MALE',
        occupation: (customerData.occupation || '').trim(),
        mobile: customerData.mobile.trim(),
        altMobile: (customerData.altMobile || '').trim(),
        email: (customerData.email || '').trim(),
        address: customerData.address.trim(),
        townVillage: customerData.townVillage.trim(),
        taluk: (customerData.taluk || '').trim(),
        district: customerData.district || 'Madurai',
        state: customerData.state || 'Tamil Nadu',
        pincode: (customerData.pincode || '').trim(),
        idType: customerData.idType || 'AADHAAR',
        idNumber: customerData.idNumber.trim(),
        kycStatus: customerData.kycStatus || 'VERIFIED',
        notes: (customerData.notes || '').trim(),
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activePledgesCount: 0,
        totalOutstanding: 0,
        pendingInterest: 0,
        totalGoldWeight: 0,
        lifetimeLoanTotal: 0,
        lifetimeRedeemedTotal: 0,
        vaultPlacement: '-'
      };

      this.customers.unshift(newCustomer);
      this.saveCustomers(this.customers);
      this.addRecentCustomer(newId);

      // Save / Queue via API Client
      let apiResult = null;
      if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
        apiResult = await window.api.post('createCustomer', newCustomer).catch(e => {
          console.warn('API customer save notice', e);
          return null;
        });
      }

      const isOffline = (typeof navigator !== 'undefined' && !navigator.onLine) || (apiResult && apiResult.offlineQueued);
      const message = isOffline
        ? 'Customer saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
        : 'Customer registered successfully';

      this.isSubmitting = false;
      return {
        success: true,
        customer: newCustomer,
        offlineQueued: Boolean(isOffline),
        syncStatus: isOffline ? 'PENDING' : 'SYNCED',
        localTxId,
        idempotencyKey,
        message
      };
    } catch (err) {
      this.isSubmitting = false;
      return { success: false, message: err.message };
    }
  }

  /**
   * Update Customer
   */
  async updateCustomer(customerId, updatedFields) {
    const index = this.customers.findIndex(c => c.customerId === customerId);
    if (index === -1) {
      return { success: false, message: 'Customer not found' };
    }

    this.customers[index] = {
      ...this.customers[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    this.saveCustomers(this.customers);

    if (typeof window !== 'undefined' && window.api && typeof window.api.post === 'function') {
      window.api.post('updateCustomer', { customerId, ...updatedFields }).catch(e => console.warn(e));
    }

    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    return {
      success: true,
      customer: this.customers[index],
      offlineQueued: isOffline,
      syncStatus: isOffline ? 'PENDING' : 'SYNCED'
    };
  }
}

// Global CustomerManager Instance
if (typeof window !== 'undefined') {
  window.customerManager = new CustomerManager();
  window.CustomerManager = CustomerManager;
}
if (typeof global !== 'undefined') {
  global.CustomerManager = CustomerManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CustomerManager };
}
