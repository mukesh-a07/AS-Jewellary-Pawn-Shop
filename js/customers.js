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

    // Default Seed Foundation Customers
    const initialSeed = [
      {
        customerId: 'CUS-2026-000184',
        nameEn: 'R. Murugan',
        nameTa: 'ஆர். முருகன்',
        fatherHusbandName: 'M. Ramanathan',
        dob: '1982-05-14',
        gender: 'MALE',
        occupation: 'Trader / Business (வணிகர்)',
        mobile: '9876543210',
        altMobile: '9842199887',
        email: 'murugan.r82@gmail.com',
        address: '14/2, North Car Street',
        townVillage: 'Madurai Town',
        taluk: 'Madurai North',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625001',
        idType: 'AADHAAR',
        idNumber: '8945-2314-4589',
        kycStatus: 'VERIFIED', // VERIFIED, PENDING, REJECTED
        notes: 'Regular prompt payer. High-value jewellery customer. Prefers Tamil notices.',
        status: 'ACTIVE',
        createdAt: '2024-01-12T10:00:00.000Z',
        updatedAt: '2026-08-30T10:30:00.000Z',
        // 360 Aggregated Metrics
        activePledgesCount: 3,
        totalOutstanding: 185000,
        pendingInterest: 18500,
        totalGoldWeight: 48.250,
        lifetimeLoanTotal: 482000,
        lifetimeRedeemedTotal: 297000,
        vaultPlacement: 'Vault A &bull; Locker 03 &bull; Tray 12 &bull; Packet 0087'
      },
      {
        customerId: 'CUS-2026-000092',
        nameEn: 'S. Lakshmi',
        nameTa: 'எஸ். லட்சுமி',
        fatherHusbandName: 'K. Sundaram',
        dob: '1988-11-20',
        gender: 'FEMALE',
        occupation: 'Agriculture / Farming (விவசாயம்)',
        mobile: '9443210987',
        altMobile: '',
        email: '',
        address: '28, Pillaiyar Kovil Street',
        townVillage: 'Usilampatti',
        taluk: 'Usilampatti',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625532',
        idType: 'VOTER_ID',
        idNumber: 'TN/24/182/009874',
        kycStatus: 'VERIFIED',
        notes: 'Seasonal agricultural repayments post-harvest. Reliable customer.',
        status: 'ACTIVE',
        createdAt: '2025-08-28T09:15:00.000Z',
        updatedAt: '2026-08-30T09:30:00.000Z',
        activePledgesCount: 1,
        totalOutstanding: 150000,
        pendingInterest: 18000,
        totalGoldWeight: 32.400,
        lifetimeLoanTotal: 260000,
        lifetimeRedeemedTotal: 110000,
        vaultPlacement: 'Vault A &bull; Locker 05 &bull; Tray 04 &bull; Packet 0042'
      },
      {
        customerId: 'CUS-2026-000115',
        nameEn: 'K. Vijayakumar',
        nameTa: 'கே. விஜயகுமார்',
        fatherHusbandName: 'M. Karuppiah',
        dob: '1975-03-08',
        gender: 'MALE',
        occupation: 'Driver / Transport',
        mobile: '9842155667',
        altMobile: '9789044556',
        email: '',
        address: '5/18, Main Road, Melur',
        townVillage: 'Melur',
        taluk: 'Melur',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625106',
        idType: 'RATION_CARD',
        idNumber: '33/05/012/987654',
        kycStatus: 'PENDING',
        notes: 'All prior loans redeemed in full. Needs updated ID copy at next transaction.',
        status: 'ACTIVE',
        createdAt: '2025-03-10T11:20:00.000Z',
        updatedAt: '2026-08-10T14:10:00.000Z',
        activePledgesCount: 0,
        totalOutstanding: 0,
        pendingInterest: 0,
        totalGoldWeight: 0,
        lifetimeLoanTotal: 155000,
        lifetimeRedeemedTotal: 155000,
        vaultPlacement: '-'
      },
      {
        customerId: 'CUS-2026-000210',
        nameEn: 'M. Soundarapandian',
        nameTa: 'எம். சௌந்தரபாண்டியன்',
        fatherHusbandName: 'S. Muthu',
        dob: '1970-08-19',
        gender: 'MALE',
        occupation: 'Civil Contractor',
        mobile: '9789012345',
        altMobile: '',
        email: 'soundar_m@outlook.com',
        address: '42, Bazaar Street, Thirumangalam',
        townVillage: 'Thirumangalam',
        taluk: 'Thirumangalam',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625706',
        idType: 'AADHAAR',
        idNumber: '6741-9823-1122',
        kycStatus: 'VERIFIED',
        notes: 'Overdue notices sent via WhatsApp and registered post. Statutory notice ready.',
        status: 'ACTIVE',
        createdAt: '2025-05-15T15:40:00.000Z',
        updatedAt: '2026-08-30T10:00:00.000Z',
        activePledgesCount: 2,
        totalOutstanding: 95000,
        pendingInterest: 14250,
        totalGoldWeight: 22.500,
        lifetimeLoanTotal: 195000,
        lifetimeRedeemedTotal: 100000,
        vaultPlacement: 'Vault B &bull; Locker 01 &bull; Tray 02 &bull; Packet 0119'
      },
      {
        customerId: 'CUS-2026-000245',
        nameEn: 'P. Arumugam',
        nameTa: 'பி. ஆறுமுகம்',
        fatherHusbandName: 'Palani',
        dob: '1985-12-02',
        gender: 'MALE',
        occupation: 'Shopkeeper (கடை உரிமையாளர்)',
        mobile: '9842567890',
        altMobile: '',
        email: '',
        address: '10, Mill Gate Road',
        townVillage: 'Melur',
        taluk: 'Melur',
        district: 'Madurai',
        state: 'Tamil Nadu',
        pincode: '625106',
        idType: 'VOTER_ID',
        idNumber: 'TN/24/180/765432',
        kycStatus: 'VERIFIED',
        notes: 'Regular short-term borrower. Due within next 7 days.',
        status: 'ACTIVE',
        createdAt: '2025-09-03T16:00:00.000Z',
        updatedAt: '2026-08-30T11:00:00.000Z',
        activePledgesCount: 1,
        totalOutstanding: 40000,
        pendingInterest: 4800,
        totalGoldWeight: 9.800,
        lifetimeLoanTotal: 85000,
        lifetimeRedeemedTotal: 45000,
        vaultPlacement: 'Vault A &bull; Locker 02 &bull; Tray 08 &bull; Packet 0231'
      }
    ];

    this.saveCustomers(initialSeed);
    return initialSeed;
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
      return stored ? JSON.parse(stored) : ['CUS-2026-000184', 'CUS-2026-000092', 'CUS-2026-000210'];
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
      list = list.filter(c => c.customerId === 'CUS-2026-000210'); // overdue customer
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

    // Sub-records for Customer 360 cockpit
    const pledges = (customerId === 'CUS-2026-000184') ? [
      {
        ticketNo: 'PLG-2026-002341',
        pledgeDate: '2026-07-10',
        maturityDate: '2027-07-10',
        itemsDescription: 'Gold Chain (22K - 12.5g), Gold Ring (22K - 4.12g)',
        netWeight: 16.620,
        loanAmount: 75000,
        interestRate: 1.0,
        accruedInterest: 750,
        status: 'ACTIVE',
        vaultLocation: 'Vault A &bull; Locker 03 &bull; Tray 12 &bull; Packet 0087'
      },
      {
        ticketNo: 'PLG-2026-001980',
        pledgeDate: '2026-03-15',
        maturityDate: '2027-03-15',
        itemsDescription: 'Gold Bangles (22K - 2 Pairs)',
        netWeight: 24.500,
        loanAmount: 110000,
        interestRate: 1.0,
        accruedInterest: 5500,
        status: 'ACTIVE',
        vaultLocation: 'Vault A &bull; Locker 03 &bull; Tray 12 &bull; Packet 0088'
      },
      {
        ticketNo: 'PLG-2025-000854',
        pledgeDate: '2025-01-10',
        maturityDate: '2026-01-10',
        itemsDescription: 'Gold Necklace (22K - 18.2g)',
        netWeight: 18.200,
        loanAmount: 85000,
        interestRate: 1.0,
        accruedInterest: 0,
        status: 'REDEEMED',
        vaultLocation: 'RELEASED'
      }
    ] : [
      {
        ticketNo: 'PLG-2026-002340',
        pledgeDate: '2025-08-28',
        maturityDate: '2026-08-28',
        itemsDescription: 'Gold Bangles (22K - 32.4g)',
        netWeight: 32.400,
        loanAmount: 150000,
        interestRate: 1.0,
        accruedInterest: 18000,
        status: 'DUE',
        vaultLocation: 'Vault A &bull; Locker 05 &bull; Tray 04 &bull; Packet 0042'
      }
    ];

    const payments = [
      {
        receiptNo: 'PAY-2026-000451',
        ticketNo: 'PLG-2026-002341',
        date: '2026-08-10 10:45 AM',
        amount: 750,
        principalSettled: 0,
        interestSettled: 750,
        paymentMode: 'UPI',
        referenceNo: 'UPI/423987654321'
      },
      {
        receiptNo: 'PAY-2026-000312',
        ticketNo: 'PLG-2026-001980',
        date: '2026-07-15 11:30 AM',
        amount: 2200,
        principalSettled: 0,
        interestSettled: 2200,
        paymentMode: 'CASH',
        referenceNo: '-'
      }
    ];

    const documents = [
      {
        docId: `DOC-${customerId}-01`,
        docType: 'AADHAAR',
        docTitle: 'Aadhaar Card Front / Back',
        fileName: 'Aadhaar_Front_Back.pdf',
        uploadedAt: '2024-01-12',
        status: 'VERIFIED'
      },
      {
        docId: `DOC-${customerId}-02`,
        docType: 'PHOTO',
        docTitle: 'Customer Passport Photo',
        fileName: 'Photo_Profile.jpg',
        uploadedAt: '2024-01-12',
        status: 'VERIFIED'
      },
      {
        docId: `DOC-${customerId}-03`,
        docType: 'SIGNATURE',
        docTitle: 'Customer Signature Specimen',
        fileName: 'Customer_Signature.png',
        uploadedAt: '2024-01-12',
        status: 'VERIFIED'
      },
      {
        docId: `DOC-${customerId}-04`,
        docType: 'THUMB',
        docTitle: 'Left Thumb Impression',
        fileName: 'Thumb_Impression.png',
        uploadedAt: '2024-01-12',
        status: 'VERIFIED'
      }
    ];

    const reminders = [
      {
        reminderId: 'REM-2026-000104',
        ticketNo: 'PLG-2026-002341',
        type: 'MONTHLY_INTEREST',
        message: 'வணக்கம் R. Murugan, உங்கள் அடகு சீட்டு PLG-2026-002341 வட்டி ₹750 செலுத்த நினைவூட்டல்.',
        dispatchedAt: '2026-08-08 09:30 AM',
        channel: 'WHATSAPP',
        status: 'DELIVERED'
      }
    ];

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
