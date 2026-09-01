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
  }

  /**
   * Debounce Helper for High-Speed Counter Inputs (250ms)
   */
  debounce(func, wait = 250) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }


  loadInitialCustomers() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not parse stored customers', e);
    }

    // ✅ PRODUCTION: No seed data. Start with empty customer list.
    // Admin registers customers at the counter as they arrive.
    const emptyStart = [];
    this.saveCustomers(emptyStart);
    return emptyStart;
  }

  saveCustomers(customersList) {
    this.customers = customersList;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(customersList));
    } catch (e) {
      console.warn('Failed to persist customers to localStorage', e);
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

  /**
   * Get Customer 360° Profile bundle (with simulated / live sub-records)
   */
  getCustomer360(customerId) {
    const cust = this.getCustomerById(customerId);
    if (!cust) return null;

    // Sub-records for Customer 360 cockpit — dynamically pulled from stores
    const allPledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
    const pledges = allPledges.filter(p => p.customerId === customerId);

    const allPayments = (window.paymentManager && window.paymentManager.payments) || [];
    const payments = allPayments.filter(p => p.customerId === customerId);

    const allDocs = (window.documentManager && window.documentManager.documents) || [];
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
  async createCustomer(customerData) {
    const year = new Date().getFullYear();
    const seq = (this.customers.length + 1).toString().padStart(6, '0');
    const newId = `CUS-${year}-${seq}`;

    const newCustomer = {
      customerId: newId,
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

    // Sync with remote API if online
    if (window.api && typeof window.api.post === 'function') {
      window.api.post('createCustomer', newCustomer).catch(e => console.warn('API background save', e));
    }

    return { success: true, customer: newCustomer };
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

    if (window.api && typeof window.api.post === 'function') {
      window.api.post('updateCustomer', { customerId, ...updatedFields }).catch(e => console.warn(e));
    }

    return { success: true, customer: this.customers[index] };
  }
}

// Global CustomerManager Instance
window.customerManager = new CustomerManager();
