/**
 * AS JEWELLAR PAWN SHOP - ENTERPRISE SAMPLE DATASET & SEED SERVICE
 * Provides authentic, high-quality sample data across all 11 database entities:
 * 1. Customers (Bilingual English/Tamil, KYC, Aadhaar/PAN, Contact)
 * 2. Pledges & Items (Gold 22K/24K, Silver 925, 3-decimal weights, Valuation, Appraiser fee, LTV)
 * 3. Payments (Cash interest, UPI part-payment with UTR, Bank transfer)
 * 4. Renewals (Rollover ticket chaining & interest settlement)
 * 5. Redemptions (Full settlement, safe vault release, delivery release note)
 * 6. Vault Packets (Safe coordinates: Vault, Locker, Tray, Packet ID)
 * 7. Customer & Article Documents (KYC IDs, Jewellery photo proofs, Form F receipts)
 * 8. Cash Drawer Day-Book Ledger (Disbursements, Inflows, Expenses, Daily balances)
 * 9. Metal Rate Benchmarks & History
 * 10. Audit Log Trail (15 Event types with immutable timestamps)
 * 11. Database Backup Snapshots
 */

class SampleDataManager {
  constructor() {
    this.isLoaded = false;
  }

  getSampleDataset() {
    const today = new Date().toISOString().split('T')[0];
    const todayTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // 1. CUSTOMERS
    const customers = [
      {
        customerId: 'CUS-2026-000101',
        nameEn: 'Ramesh Kumar',
        nameTa: 'ரமேஷ் குமார்',
        mobile: '9842155601',
        altMobile: '9842155602',
        addressEn: 'No. 12, Sannathi Street, Madurai - 625001',
        addressTa: 'எண். 12, சன்னதி தெரு, மதுரை - 625001',
        idType: 'AADHAAR',
        idNumber: '9842-1200-4589',
        kycStatus: 'VERIFIED',
        photoUrl: 'assets/branding/as-jewellar-mark.svg',
        createdAt: '2026-01-10T10:00:00.000Z',
        createdBy: 'ADMIN',
        notes: 'Regular customer &bull; Gold artisan'
      },
      {
        customerId: 'CUS-2026-000102',
        nameEn: 'Meenakshi Sundaram',
        nameTa: 'மீனாட்சி சுந்தரம்',
        mobile: '9842166702',
        altMobile: '9842166703',
        addressEn: 'No. 45, West Masi Street, Madurai - 625001',
        addressTa: 'எண். 45, மேல மாசி வீதி, மதுரை - 625001',
        idType: 'PAN',
        idNumber: 'ABCDE6789K',
        kycStatus: 'VERIFIED',
        photoUrl: 'assets/branding/as-jewellar-mark.svg',
        createdAt: '2026-02-15T11:30:00.000Z',
        createdBy: 'ADMIN',
        notes: 'Verified business owner'
      },
      {
        customerId: 'CUS-2026-000103',
        nameEn: 'Karthik Raja',
        nameTa: 'கார்த்திக் ராஜா',
        mobile: '9842177803',
        altMobile: '9842177804',
        addressEn: 'No. 88, Kamarajar Salai, Madurai - 625009',
        addressTa: 'எண். 88, காமராஜர் சாலை, மதுரை - 625009',
        idType: 'AADHAAR',
        idNumber: '6712-4490-7812',
        kycStatus: 'VERIFIED',
        photoUrl: 'assets/branding/as-jewellar-mark.svg',
        createdAt: '2026-03-01T09:45:00.000Z',
        createdBy: 'ADMIN',
        notes: 'Prompt interest payments'
      },
      {
        customerId: 'CUS-2026-000104',
        nameEn: 'Priya Natarajan',
        nameTa: 'பிரியா நடராஜன்',
        mobile: '9842188904',
        altMobile: '9842188905',
        addressEn: 'No. 23, Netaji Road, Madurai - 625001',
        addressTa: 'எண். 23, நேதாஜி ரோடு, மதுரை - 625001',
        idType: 'AADHAAR',
        idNumber: '3345-9801-9923',
        kycStatus: 'VERIFIED',
        photoUrl: 'assets/branding/as-jewellar-mark.svg',
        createdAt: '2026-04-12T14:15:00.000Z',
        createdBy: 'ADMIN',
        notes: 'Pledged family heirloom &bull; Full redemption completed'
      },
      {
        customerId: 'CUS-2026-000105',
        nameEn: 'Lakshmi Narayanan',
        nameTa: 'லட்சுமி நாராயணன்',
        mobile: '9842199005',
        altMobile: '9842199006',
        addressEn: 'No. 56, Town Hall Road, Madurai - 625001',
        addressTa: 'எண். 56, டவுன் ஹால் ரோடு, மதுரை - 625001',
        idType: 'PAN',
        idNumber: 'XYZPK1234L',
        kycStatus: 'VERIFIED',
        photoUrl: 'assets/branding/as-jewellar-mark.svg',
        createdAt: '2026-05-20T16:00:00.000Z',
        createdBy: 'ADMIN',
        notes: 'Overdue reminder dispatched via WhatsApp'
      }
    ];

    // 2. PLEDGES & ITEMS
    const pledges = [
      {
        ticketNo: 'PLG-2026-000101',
        customerId: 'CUS-2026-000101',
        customerName: 'Ramesh Kumar',
        customerNameTa: 'ரமேஷ் குமார்',
        customerMobile: '9842155601',
        pledgeDate: '2026-08-01',
        dueDate: '2027-08-01',
        loanAmount: 350000,
        principalDisbursed: 350000,
        principalOutstanding: 350000,
        principalPaid: 0,
        interestPaid: 3500,
        interestRatePercent: 1.0,
        monthlyInterestAmount: 3500,
        grossValuation: 468096,
        eligibleLoan: 351072,
        appraiserFee: 150,
        otherFee: 0,
        feeCollectionMode: 'DEDUCT_FROM_DISBURSEMENT',
        netDisbursementAmount: 349850,
        disbursementMode: 'CASH',
        disbursementRefNo: '',
        packetId: 'PKT-2026-0001',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-A/TRAY-1',
        status: 'ACTIVE',
        totalGrossWeight: 32.500,
        totalNetWeight: 32.000,
        totalItemsCount: 2,
        createdAt: '2026-08-01T10:30:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        ticketNo: 'PLG-2026-000102',
        customerId: 'CUS-2026-000102',
        customerName: 'Meenakshi Sundaram',
        customerNameTa: 'மீனாட்சி சுந்தரம்',
        customerMobile: '9842166702',
        pledgeDate: '2026-07-15',
        dueDate: '2027-07-15',
        loanAmount: 300000,
        principalDisbursed: 300000,
        principalOutstanding: 200000,
        principalPaid: 100000,
        interestPaid: 3000,
        interestRatePercent: 1.0,
        monthlyInterestAmount: 2000,
        grossValuation: 438840,
        eligibleLoan: 329130,
        appraiserFee: 150,
        otherFee: 0,
        feeCollectionMode: 'DEDUCT_FROM_DISBURSEMENT',
        netDisbursementAmount: 299850,
        disbursementMode: 'CASH',
        disbursementRefNo: '',
        packetId: 'PKT-2026-0002',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-A/TRAY-2',
        status: 'ACTIVE',
        totalGrossWeight: 31.000,
        totalNetWeight: 30.000,
        totalItemsCount: 2,
        createdAt: '2026-07-15T11:45:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        ticketNo: 'PLG-2026-000103',
        customerId: 'CUS-2026-000103',
        customerName: 'Karthik Raja',
        customerNameTa: 'கார்த்திக் ராஜா',
        customerMobile: '9842177803',
        pledgeDate: '2025-09-01',
        dueDate: '2026-09-01',
        loanAmount: 450000,
        principalDisbursed: 450000,
        principalOutstanding: 0,
        principalPaid: 0,
        interestPaid: 9000,
        interestRatePercent: 1.0,
        monthlyInterestAmount: 4500,
        grossValuation: 658260,
        eligibleLoan: 493695,
        appraiserFee: 200,
        otherFee: 0,
        feeCollectionMode: 'DEDUCT_FROM_DISBURSEMENT',
        netDisbursementAmount: 449800,
        disbursementMode: 'BANK_TRANSFER',
        disbursementRefNo: 'NEFT98234110',
        packetId: 'PKT-2026-0003',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-B/TRAY-1',
        status: 'RENEWED',
        renewedToTicket: 'PLG-2026-000106',
        closedDate: '2026-09-05T14:30:00.000Z',
        closedReason: 'RENEWED_ROLLOVER',
        totalGrossWeight: 45.800,
        totalNetWeight: 45.000,
        totalItemsCount: 1,
        createdAt: '2025-09-01T09:15:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        ticketNo: 'PLG-2026-000104',
        customerId: 'CUS-2026-000104',
        customerName: 'Priya Natarajan',
        customerNameTa: 'பிரியா நடராஜன்',
        customerMobile: '9842188904',
        pledgeDate: '2026-06-01',
        dueDate: '2027-06-01',
        loanAmount: 500000,
        principalDisbursed: 500000,
        principalOutstanding: 0,
        principalPaid: 500000,
        interestPaid: 15000,
        interestRatePercent: 1.0,
        monthlyInterestAmount: 5000,
        grossValuation: 755828,
        eligibleLoan: 566871,
        appraiserFee: 250,
        otherFee: 0,
        feeCollectionMode: 'DEDUCT_FROM_DISBURSEMENT',
        netDisbursementAmount: 499750,
        disbursementMode: 'CASH',
        disbursementRefNo: '',
        packetId: 'PKT-2026-0004',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-B/TRAY-2',
        status: 'REDEEMED',
        closedDate: '2026-09-10T16:00:00.000Z',
        closedReason: 'FULL_REDEMPTION',
        totalGrossWeight: 172.000,
        totalNetWeight: 170.000,
        totalItemsCount: 2,
        createdAt: '2026-06-01T15:00:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        ticketNo: 'PLG-2026-000105',
        customerId: 'CUS-2026-000105',
        customerName: 'Lakshmi Narayanan',
        customerNameTa: 'லட்சுமி நாராயணன்',
        customerMobile: '9842199005',
        pledgeDate: '2025-08-10',
        dueDate: '2026-08-10',
        loanAmount: 180000,
        principalDisbursed: 180000,
        principalOutstanding: 180000,
        principalPaid: 0,
        interestPaid: 0,
        interestRatePercent: 1.25,
        monthlyInterestAmount: 2250,
        grossValuation: 263304,
        eligibleLoan: 197478,
        appraiserFee: 100,
        otherFee: 0,
        feeCollectionMode: 'DEDUCT_FROM_DISBURSEMENT',
        netDisbursementAmount: 179900,
        disbursementMode: 'CASH',
        disbursementRefNo: '',
        packetId: 'PKT-2026-0005',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-C/TRAY-1',
        status: 'OVERDUE',
        totalGrossWeight: 18.500,
        totalNetWeight: 18.000,
        totalItemsCount: 1,
        createdAt: '2025-08-10T12:00:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        ticketNo: 'PLG-2026-000106',
        customerId: 'CUS-2026-000103',
        customerName: 'Karthik Raja',
        customerNameTa: 'கார்த்திக் ராஜா',
        customerMobile: '9842177803',
        pledgeDate: '2026-09-05',
        dueDate: '2027-09-05',
        loanAmount: 450000,
        principalDisbursed: 450000,
        principalOutstanding: 450000,
        principalPaid: 0,
        interestPaid: 0,
        interestRatePercent: 1.0,
        monthlyInterestAmount: 4500,
        grossValuation: 658260,
        eligibleLoan: 493695,
        appraiserFee: 0,
        otherFee: 0,
        feeCollectionMode: 'COLLECT_SEPARATELY',
        netDisbursementAmount: 450000,
        disbursementMode: 'RENEWAL_ROLLOVER',
        disbursementRefNo: 'ROLLOVER-PLG-2026-000103',
        renewedFromTicket: 'PLG-2026-000103',
        packetId: 'PKT-2026-0003',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-B/TRAY-1',
        status: 'ACTIVE',
        totalGrossWeight: 45.800,
        totalNetWeight: 45.000,
        totalItemsCount: 1,
        createdAt: '2026-09-05T14:30:00.000Z',
        createdBy: 'ADMIN'
      }
    ];

    // 3. PLEDGE ITEM BREAKDOWN
    const pledgeItems = [
      {
        itemId: 'ITEM-101-1',
        ticketNo: 'PLG-2026-000101',
        descriptionEn: '22K Gold Bangles (2 Nos)',
        descriptionTa: '22 காரட் தங்க வளையல்கள் (2)',
        category: 'GOLD',
        purity: '22K',
        quantity: 2,
        grossWeight: 32.500,
        stoneWeight: 0.500,
        netWeight: 32.000,
        rateUsed: 14628.00,
        estimatedValue: 468096,
        eligibleLoan: 351072,
        remarks: '916 Hallmark intact'
      },
      {
        itemId: 'ITEM-102-1',
        ticketNo: 'PLG-2026-000102',
        descriptionEn: '22K Gold Chain with Stone Pendant',
        descriptionTa: '22 காரட் தங்க சங்கிலி & பதக்கம்',
        category: 'GOLD',
        purity: '22K',
        quantity: 1,
        grossWeight: 24.800,
        stoneWeight: 0.800,
        netWeight: 24.000,
        rateUsed: 14628.00,
        estimatedValue: 351072,
        eligibleLoan: 263304,
        remarks: 'Red stone pendant'
      },
      {
        itemId: 'ITEM-102-2',
        ticketNo: 'PLG-2026-000102',
        descriptionEn: '22K Gold Gents Ring',
        descriptionTa: '22 காரட் தங்க மோதிரம்',
        category: 'GOLD',
        purity: '22K',
        quantity: 1,
        grossWeight: 6.200,
        stoneWeight: 0.200,
        netWeight: 6.000,
        rateUsed: 14628.00,
        estimatedValue: 87768,
        eligibleLoan: 65826,
        remarks: 'Engraved initials'
      },
      {
        itemId: 'ITEM-103-1',
        ticketNo: 'PLG-2026-000103',
        descriptionEn: '22K Gold Traditional Necklace',
        descriptionTa: '22 காரட் தங்க பாரம்பரிய நெக்லஸ்',
        category: 'GOLD',
        purity: '22K',
        quantity: 1,
        grossWeight: 45.800,
        stoneWeight: 0.800,
        netWeight: 45.000,
        rateUsed: 14628.00,
        estimatedValue: 658260,
        eligibleLoan: 493695,
        remarks: 'Rolled over to PLG-2026-000106'
      },
      {
        itemId: 'ITEM-104-1',
        ticketNo: 'PLG-2026-000104',
        descriptionEn: '22K Gold Designer Haram',
        descriptionTa: '22 காரட் தங்க டிசைனர் ஆரம்',
        category: 'GOLD',
        purity: '22K',
        quantity: 1,
        grossWeight: 52.000,
        stoneWeight: 2.000,
        netWeight: 50.000,
        rateUsed: 14628.00,
        estimatedValue: 731400,
        eligibleLoan: 548550,
        remarks: 'Redeemed & safely delivered'
      },
      {
        itemId: 'ITEM-104-2',
        ticketNo: 'PLG-2026-000104',
        descriptionEn: 'Fine Silver Leg Kolusu / Anklets (Pair)',
        descriptionTa: 'வெள்ளி கொலுசு (ஜோடி)',
        category: 'SILVER',
        purity: 'SILVER_925',
        quantity: 2,
        grossWeight: 120.000,
        stoneWeight: 0.000,
        netWeight: 120.000,
        rateUsed: 203.56,
        estimatedValue: 24428,
        eligibleLoan: 18321,
        remarks: 'Redeemed & safely delivered'
      },
      {
        itemId: 'ITEM-105-1',
        ticketNo: 'PLG-2026-000105',
        descriptionEn: '22K Gold Ladies Bracelet',
        descriptionTa: '22 காரட் தங்க பிரேஸ்லெட்',
        category: 'GOLD',
        purity: '22K',
        quantity: 1,
        grossWeight: 18.500,
        stoneWeight: 0.500,
        netWeight: 18.000,
        rateUsed: 14628.00,
        estimatedValue: 263304,
        eligibleLoan: 197478,
        remarks: 'Notice sent'
      },
      {
        itemId: 'ITEM-106-1',
        ticketNo: 'PLG-2026-000106',
        descriptionEn: '22K Gold Traditional Necklace (Rollover)',
        descriptionTa: '22 காரட் தங்க பாரம்பரிய நெக்லஸ்',
        category: 'GOLD',
        purity: '22K',
        quantity: 1,
        grossWeight: 45.800,
        stoneWeight: 0.800,
        netWeight: 45.000,
        rateUsed: 14628.00,
        estimatedValue: 658260,
        eligibleLoan: 493695,
        remarks: 'Chained from ticket PLG-2026-000103'
      }
    ];

    // 4. PAYMENTS
    const payments = [
      {
        paymentId: 'PAY-2026-000101',
        ticketNo: 'PLG-2026-000101',
        customerId: 'CUS-2026-000101',
        paymentDate: '2026-09-01',
        paymentType: 'INTEREST_ONLY',
        amount: 3500,
        interestAmount: 3500,
        principalAmount: 0,
        paymentMode: 'CASH',
        referenceNumber: 'CASH-REC-101',
        notes: '1st Month regular cash interest payment',
        status: 'PAID',
        idempotencyKey: 'IDEMP-PAY-101',
        createdAt: '2026-09-01T11:00:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        paymentId: 'PAY-2026-000102',
        ticketNo: 'PLG-2026-000102',
        customerId: 'CUS-2026-000102',
        paymentDate: '2026-08-20',
        paymentType: 'PARTIAL_PRINCIPAL_INTEREST',
        amount: 103000,
        interestAmount: 3000,
        principalAmount: 100000,
        paymentMode: 'UPI',
        referenceNumber: 'UPI984210087612',
        notes: 'Part-payment ₹1,00,000 principal reduction + ₹3,000 interest via Google Pay',
        status: 'PAID',
        idempotencyKey: 'IDEMP-PAY-102',
        createdAt: '2026-08-20T15:30:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        paymentId: 'PAY-2026-000103',
        ticketNo: 'PLG-2026-000103',
        customerId: 'CUS-2026-000103',
        paymentDate: '2026-09-05',
        paymentType: 'RENEWAL_INTEREST',
        amount: 9000,
        interestAmount: 9000,
        principalAmount: 0,
        paymentMode: 'BANK_TRANSFER',
        referenceNumber: 'IMPS6723901452',
        notes: 'Rollover interest settlement for 2 months',
        status: 'PAID',
        idempotencyKey: 'IDEMP-PAY-103',
        createdAt: '2026-09-05T14:15:00.000Z',
        createdBy: 'ADMIN'
      },
      {
        paymentId: 'PAY-2026-000104',
        ticketNo: 'PLG-2026-000104',
        customerId: 'CUS-2026-000104',
        paymentDate: '2026-09-10',
        paymentType: 'FULL_REDEMPTION',
        amount: 515000,
        interestAmount: 15000,
        principalAmount: 500000,
        paymentMode: 'CASH',
        referenceNumber: 'CASH-RED-104',
        notes: 'Full redemption settlement principal ₹5,00,000 + 3 months interest ₹15,000',
        status: 'PAID',
        idempotencyKey: 'IDEMP-PAY-104',
        createdAt: '2026-09-10T15:45:00.000Z',
        createdBy: 'ADMIN'
      }
    ];

    // 5. RENEWALS
    const renewals = [
      {
        renewalId: 'REN-2026-000101',
        oldTicketNo: 'PLG-2026-000103',
        newTicketNo: 'PLG-2026-000106',
        customerId: 'CUS-2026-000103',
        renewalDate: '2026-09-05',
        settledInterest: 9000,
        paymentMode: 'BANK_TRANSFER',
        referenceNo: 'IMPS6723901452',
        carriedPrincipal: 450000,
        notes: 'Rollover completed & Form F ticket issued',
        createdAt: '2026-09-05T14:30:00.000Z',
        createdBy: 'ADMIN'
      }
    ];

    // 6. REDEMPTIONS
    const redemptions = [
      {
        redemptionId: 'RED-2026-000101',
        ticketNo: 'PLG-2026-000104',
        customerId: 'CUS-2026-000104',
        redemptionDate: '2026-09-10',
        principalSettled: 500000,
        interestSettled: 15000,
        totalPaid: 515000,
        paymentMode: 'CASH',
        referenceNo: 'CASH-RED-104',
        packetId: 'PKT-2026-0004',
        packetStatus: 'RELEASED',
        deliveryNoteNo: 'DEL-2026-000101',
        verifiedBy: 'ADMIN',
        handedOverTo: 'Priya Natarajan (Customer In-Person)',
        customerSignatureCaptured: true,
        createdAt: '2026-09-10T16:00:00.000Z',
        createdBy: 'ADMIN'
      }
    ];

    // 7. VAULT PACKETS
    const vaultPackets = [
      {
        packetId: 'PKT-2026-0001',
        ticketNo: 'PLG-2026-000101',
        customerId: 'CUS-2026-000101',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-A/TRAY-1',
        status: 'OCCUPIED',
        assignedDate: '2026-08-01',
        itemSummary: '22K Gold Bangles (2 Nos, 32.000g)'
      },
      {
        packetId: 'PKT-2026-0002',
        ticketNo: 'PLG-2026-000102',
        customerId: 'CUS-2026-000102',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-A/TRAY-2',
        status: 'OCCUPIED',
        assignedDate: '2026-07-15',
        itemSummary: '22K Gold Chain + Ring (30.000g)'
      },
      {
        packetId: 'PKT-2026-0003',
        ticketNo: 'PLG-2026-000106',
        customerId: 'CUS-2026-000103',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-B/TRAY-1',
        status: 'OCCUPIED',
        assignedDate: '2026-09-05',
        itemSummary: '22K Gold Necklace (45.000g)'
      },
      {
        packetId: 'PKT-2026-0004',
        ticketNo: 'PLG-2026-000104',
        customerId: 'CUS-2026-000104',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-B/TRAY-2',
        status: 'RELEASED',
        assignedDate: '2026-06-01',
        releasedDate: '2026-09-10',
        itemSummary: '22K Gold Haram + Silver Anklets (170.000g)'
      },
      {
        packetId: 'PKT-2026-0005',
        ticketNo: 'PLG-2026-000105',
        customerId: 'CUS-2026-000105',
        vaultLocation: 'VAULT-01',
        lockerTray: 'LOCKER-C/TRAY-1',
        status: 'OCCUPIED',
        assignedDate: '2025-08-10',
        itemSummary: '22K Gold Bracelet (18.000g)'
      }
    ];

    // 8. DOCUMENTS
    const documents = [
      {
        docId: 'DOC-2026-000101',
        customerId: 'CUS-2026-000101',
        ticketNo: 'PLG-2026-000101',
        category: 'CUSTOMER_KYC',
        docType: 'AADHAAR',
        fileName: 'RameshKumar_Aadhaar.pdf',
        fileUrl: 'assets/branding/as-jewellar-logo.svg',
        fileType: 'application/pdf',
        fileSize: 450210,
        uploadedAt: '2026-01-10T10:05:00.000Z',
        uploadedBy: 'ADMIN'
      },
      {
        docId: 'DOC-2026-000102',
        customerId: 'CUS-2026-000101',
        ticketNo: 'PLG-2026-000101',
        category: 'PLEDGE_ARTICLE_PHOTO',
        docType: 'JEWELLERY_PHOTO',
        fileName: 'Bangles_PLG-2026-000101.jpg',
        fileUrl: 'assets/branding/as-jewellar-mark.svg',
        fileType: 'image/jpeg',
        fileSize: 182400,
        uploadedAt: '2026-08-01T10:32:00.000Z',
        uploadedBy: 'ADMIN'
      },
      {
        docId: 'DOC-2026-000103',
        customerId: 'CUS-2026-000102',
        ticketNo: 'PLG-2026-000102',
        category: 'CUSTOMER_KYC',
        docType: 'PAN',
        fileName: 'Meenakshi_PAN.pdf',
        fileUrl: 'assets/branding/as-jewellar-logo.svg',
        fileType: 'application/pdf',
        fileSize: 312890,
        uploadedAt: '2026-02-15T11:32:00.000Z',
        uploadedBy: 'ADMIN'
      },
      {
        docId: 'DOC-2026-000104',
        customerId: 'CUS-2026-000104',
        ticketNo: 'PLG-2026-000104',
        category: 'REDEMPTION_DELIVERY_NOTE',
        docType: 'DELIVERY_NOTE',
        fileName: 'DeliveryNote_PLG-2026-000104.pdf',
        fileUrl: 'assets/branding/as-jewellar-logo.svg',
        fileType: 'application/pdf',
        fileSize: 224100,
        uploadedAt: '2026-09-10T16:05:00.000Z',
        uploadedBy: 'ADMIN'
      }
    ];

    // 9. CASH DRAWER & EXPENSES
    const expenses = [
      {
        expenseId: 'EXP-2026-000101',
        date: today,
        category: 'TEA_REFRESHMENTS',
        amount: 350,
        paymentMode: 'CASH',
        description: 'Customer & Staff Tea Refreshments',
        recordedBy: 'ADMIN',
        createdAt: `${today}T11:00:00.000Z`
      },
      {
        expenseId: 'EXP-2026-000102',
        date: today,
        category: 'STATIONERY',
        amount: 850,
        paymentMode: 'CASH',
        description: 'Pawn ticket thermal rolls and ledger registers',
        recordedBy: 'ADMIN',
        createdAt: `${today}T12:30:00.000Z`
      }
    ];

    const cashDayBook = [
      {
        entryId: 'CASH-2026-0001',
        date: today,
        type: 'OPENING_BALANCE',
        amount: 500000,
        paymentMode: 'CASH',
        description: 'Opening Cash Balance in Safe Drawer',
        runningBalance: 500000,
        createdAt: `${today}T09:00:00.000Z`
      },
      {
        entryId: 'CASH-2026-0002',
        date: today,
        type: 'INFLOW_PAYMENT',
        amount: 3500,
        paymentMode: 'CASH',
        description: 'Cash Interest Inflow &bull; Ticket #PLG-2026-000101',
        runningBalance: 503500,
        createdAt: `${today}T11:00:00.000Z`
      },
      {
        entryId: 'CASH-2026-0003',
        date: today,
        type: 'OUTFLOW_EXPENSE',
        amount: 1200,
        paymentMode: 'CASH',
        description: 'Counter refreshments & stationery expense',
        runningBalance: 502300,
        createdAt: `${today}T12:30:00.000Z`
      }
    ];

    // 10. RATE HISTORY
    const rateHistory = [
      {
        recordId: `RATE-${today}-01`,
        date: today,
        time: todayTime,
        gold24k: 13461.28,
        gold22k: 12339.51,
        silver: 203.36,
        source: 'LIVE_API',
        isOverride: false,
        updatedBy: 'SYSTEM (Gold-API &bull; Live Market Spot)',
        notes: 'Real-time global bullion spot sync & FX USD/INR'
      }
    ];

    // 11. AUDIT LOGS (15 Event Types)
    const auditLogs = [
      {
        logId: 'AUD-001',
        timestamp: `${today}T09:00:00.000Z`,
        action: 'LOGIN',
        entityType: 'AUTH',
        targetId: 'ADMIN',
        performedBy: 'ADMIN',
        details: { ip: '127.0.0.1', userAgent: 'AS Jewellar POS Terminal' }
      },
      {
        logId: 'AUD-002',
        timestamp: `${today}T09:30:00.000Z`,
        action: 'RATE_UPDATE',
        entityType: 'RATES',
        targetId: 'RATE_ENGINE',
        performedBy: 'SYSTEM',
        details: { gold24k: 13461.28, gold22k: 12339.51, silver: 203.36 }
      },
      {
        logId: 'AUD-003',
        timestamp: `${today}T10:00:00.000Z`,
        action: 'CUSTOMER_CREATE_EDIT',
        entityType: 'CUSTOMER',
        targetId: 'CUS-2026-000101',
        performedBy: 'ADMIN',
        details: { name: 'Ramesh Kumar', mobile: '9842155601' }
      },
      {
        logId: 'AUD-004',
        timestamp: `${today}T10:05:00.000Z`,
        action: 'DOCUMENT_UPLOAD',
        entityType: 'DOCUMENT',
        targetId: 'DOC-2026-000101',
        performedBy: 'ADMIN',
        details: { docType: 'AADHAAR', customerId: 'CUS-2026-000101' }
      },
      {
        logId: 'AUD-005',
        timestamp: `${today}T10:30:00.000Z`,
        action: 'PLEDGE_CREATE',
        entityType: 'PLEDGE',
        targetId: 'PLG-2026-000101',
        performedBy: 'ADMIN',
        details: { customerId: 'CUS-2026-000101', loanAmount: 350000, itemsCount: 2 }
      },
      {
        logId: 'AUD-006',
        timestamp: `${today}T11:00:00.000Z`,
        action: 'PAYMENT_RECORD',
        entityType: 'PAYMENT',
        targetId: 'PAY-2026-000101',
        performedBy: 'ADMIN',
        details: { ticketNo: 'PLG-2026-000101', amount: 3500, mode: 'CASH' }
      },
      {
        logId: 'AUD-007',
        timestamp: `${today}T11:30:00.000Z`,
        action: 'PAYMENT_RECORD',
        entityType: 'PAYMENT',
        targetId: 'PAY-2026-000102',
        performedBy: 'ADMIN',
        details: { ticketNo: 'PLG-2026-000102', amount: 103000, mode: 'UPI', utr: 'UPI984210087612' }
      },
      {
        logId: 'AUD-008',
        timestamp: `${today}T14:30:00.000Z`,
        action: 'RENEWAL_RECORD',
        entityType: 'PLEDGE',
        targetId: 'PLG-2026-000106',
        performedBy: 'ADMIN',
        details: { fromTicket: 'PLG-2026-000103', toTicket: 'PLG-2026-000106', carriedPrincipal: 450000 }
      },
      {
        logId: 'AUD-009',
        timestamp: `${today}T16:00:00.000Z`,
        action: 'REDEMPTION_RECORD',
        entityType: 'PLEDGE',
        targetId: 'PLG-2026-000104',
        performedBy: 'ADMIN',
        details: { principalSettled: 500000, totalPaid: 515000, releasedPacket: 'PKT-2026-0004' }
      },
      {
        logId: 'AUD-010',
        timestamp: `${today}T16:30:00.000Z`,
        action: 'BACKUP_CREATE',
        entityType: 'BACKUP',
        targetId: `BAK-${today}-001`,
        performedBy: 'ADMIN',
        details: { backupType: 'MANUAL_CLOUD_SNAPSHOT', totalRecords: 38 }
      }
    ];

    // 12. BACKUPS
    const backups = [
      {
        backupId: `BAK-${today}-001`,
        timestamp: `${today}T16:30:00.000Z`,
        backupType: 'MANUAL_CLOUD_SNAPSHOT',
        totalRecords: 38,
        status: 'SUCCESS',
        fileUrl: '#',
        fileName: `AS_Jewellar_Backup_${today}.json`,
        sizeBytes: 84210,
        createdBy: 'ADMIN'
      }
    ];

    return {
      customers,
      pledges,
      pledgeItems,
      payments,
      renewals,
      redemptions,
      vaultPackets,
      documents,
      expenses,
      cashDayBook,
      rateHistory,
      auditLogs,
      backups
    };
  }

  /**
   * Loads sample dataset into local storage and IndexedDB
   */
  async loadSampleData() {
    const data = this.getSampleDataset();

    // 1. Save Customers
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('as_jewellar_customers_store', JSON.stringify(data.customers));
      localStorage.setItem('as_jewellar_pledges_store', JSON.stringify(data.pledges));
      localStorage.setItem('as_jewellar_pledge_items_store', JSON.stringify(data.pledgeItems));
      localStorage.setItem('as_jewellar_payments_store', JSON.stringify(data.payments));
      localStorage.setItem('as_jewellar_renewals_store', JSON.stringify(data.renewals));
      localStorage.setItem('as_jewellar_redemptions_store', JSON.stringify(data.redemptions));
      localStorage.setItem('as_jewellar_vault_audit_store', JSON.stringify(data.vaultPackets));
      localStorage.setItem('as_jewellar_documents_store', JSON.stringify(data.documents));
      localStorage.setItem('as_jewellar_expenses_store', JSON.stringify(data.expenses));
      localStorage.setItem('as_jewellar_cash_daybook_store', JSON.stringify(data.cashDayBook));
      localStorage.setItem('as_jewellar_rate_history', JSON.stringify(data.rateHistory));
      localStorage.setItem('as_jewellar_audit_logs', JSON.stringify(data.auditLogs));
      localStorage.setItem('as_jewellar_backups_store', JSON.stringify(data.backups));
    }

    // 2. Mirror to IndexedDB
    if (typeof window !== 'undefined' && window.offlineDB) {
      try {
        for (const c of data.customers) await window.offlineDB.putRecord('customersStore', c);
        for (const p of data.pledges) await window.offlineDB.putRecord('pledgesStore', p);
        for (const pay of data.payments) await window.offlineDB.putRecord('paymentsStore', pay);
      } catch (e) {
        console.warn('IndexedDB sample mirror note:', e);
      }
    }

    // 3. Update global in-memory managers
    if (typeof window !== 'undefined') {
      if (window.customerManager) window.customerManager.customers = data.customers;
      if (window.pledgeManager) {
        window.pledgeManager.pledges = data.pledges;
        window.pledgeManager.items = data.pledgeItems;
      }
      if (window.paymentManager) window.paymentManager.payments = data.payments;
      if (window.renewalRedemptionManager) {
        window.renewalRedemptionManager.renewals = data.renewals;
        window.renewalRedemptionManager.redemptions = data.redemptions;
      }
      if (window.documentManager) window.documentManager.documents = data.documents;
      if (window.cashManager) {
        window.cashManager.expenses = data.expenses;
        window.cashManager.dayBook = data.cashDayBook;
      }
    }

    this.isLoaded = true;
    return {
      success: true,
      counts: {
        customers: data.customers.length,
        pledges: data.pledges.length,
        pledgeItems: data.pledgeItems.length,
        payments: data.payments.length,
        renewals: data.renewals.length,
        redemptions: data.redemptions.length,
        vaultPackets: data.vaultPackets.length,
        documents: data.documents.length,
        expenses: data.expenses.length,
        cashDayBook: data.cashDayBook.length,
        auditLogs: data.auditLogs.length,
        backups: data.backups.length
      }
    };
  }

  /**
   * Clears all local data
   */
  clearData() {
    if (typeof localStorage !== 'undefined') {
      const keys = [
        'as_jewellar_customers_store',
        'as_jewellar_pledges_store',
        'as_jewellar_pledge_items_store',
        'as_jewellar_payments_store',
        'as_jewellar_renewals_store',
        'as_jewellar_redemptions_store',
        'as_jewellar_vault_audit_store',
        'as_jewellar_documents_store',
        'as_jewellar_expenses_store',
        'as_jewellar_cash_daybook_store',
        'as_jewellar_audit_logs',
        'as_jewellar_backups_store'
      ];
      keys.forEach(k => localStorage.removeItem(k));
    }
    this.isLoaded = false;
    return { success: true };
  }
}

// Global Registration
if (typeof window !== 'undefined') {
  window.SampleDataManager = SampleDataManager;
  window.sampleDataManager = new SampleDataManager();
}
if (typeof global !== 'undefined') {
  global.SampleDataManager = SampleDataManager;
  global.sampleDataManager = new SampleDataManager();
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SampleDataManager };
}
