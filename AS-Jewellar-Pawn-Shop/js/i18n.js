/**
 * AS JEWELLAR PAWN SHOP - BILINGUAL i18n ENGINE
 * English & தமிழ் (Tamil) Localization System
 * Handles dynamic key replacement, placeholders, attribute translation & persistence.
 */

const I18N_STORAGE_KEY = 'as_jewellar_lang';
const DEFAULT_LANG = 'en';

const translations = {
  en: {
    // Brand & Header
    shop_name: 'AS Jewellar',
    shop_tagline: 'Pawn Shop & Jewellery',
    admin_portal: 'Admin Portal',
    dashboard: 'Dashboard',
    customers: 'Customers',
    customer: 'Customer 360°',
    pledges: 'Pledges',
    new_pledge: 'New Pledge POS',
    payments: 'Payments',
    redemption: 'Redemption',
    renewal: 'Renewal',
    reminders: 'Reminders',
    rates: 'Gold & Silver Rates',
    reports: 'Reports & Day-Book',
    documents: 'Documents',
    vault: 'Vault & Packet Management',
    settings: 'Settings',
    logout: 'Logout',
    online: 'Online',
    offline: 'Offline Mode',
    search_placeholder: 'Search customer, mobile, ticket...',
    global_search: 'Global Search',
    quick_actions: 'Quick Actions',
    today_overview: "Today's Operational Overview",
    alerts: 'Operational Alerts & Warnings',
    live_rates: 'Live Metal Rates',

    // Reports & Cash Terms
    rep_daily_daybook: 'Daily Day-Book Report',
    rep_cash_management: 'Cash Day-Book & Expenses',
    rep_outstanding: 'Outstanding Portfolio',
    rep_cust_statement: 'Customer 360° Statement',
    rep_metal_inventory: 'Gold & Silver Purity Inventory',
    rep_monthly_summary: 'Monthly Summary Report',
    opening_balance: 'Opening Cash Balance',
    cash_collections: 'Cash Collections (+)',
    cash_loans_given: 'Loans Disbursed (-)',
    cash_expenses: 'Shop Expenses (-)',
    expected_closing_cash: 'Expected Closing Cash',
    actual_drawer_cash: 'Actual Cash in Drawer',
    cash_variance: 'Cash Drawer Variance',
    expenses_title: 'Shop Expenses Tracker',
    add_expense_btn: '+ Add Shop Expense',
    expense_category: 'Expense Category',
    expense_amount: 'Amount (₹)',
    expense_desc: 'Expense Description',
    cat_tea_snacks: 'Tea & Refreshments',
    cat_rent: 'Shop Rent',
    cat_electricity: 'EB / Electricity Bill',
    cat_stationery: 'Stationery & Printing',
    cat_office: 'Office Supplies / Cleaning',
    cat_maintenance: 'Shop Maintenance',
    cat_salary: 'Staff Salary / Wages',
    cat_other: 'Other Expense',
    export_csv: 'Export CSV',
    print_report: 'Print Official Report',
    date_range_label: 'Date Filter Range',
    range_today: 'Today',
    range_yesterday: 'Yesterday',
    range_this_week: 'This Week',
    range_this_month: 'This Month',
    range_last_month: 'Last Month',
    range_custom: 'Custom Range',
    from_date: 'From Date',
    to_date: 'To Date',
    apply_filter: 'Apply Filter',

    // Vault & Packet Terms
    vault_title: 'Vault & Packet Location Management',
    vault_room: 'Vault Room',
    locker_number: 'Locker Number',
    tray_number: 'Tray Number',
    packet_id: 'Packet Tag ID',
    location_note: 'Physical Location Note',
    status_in_vault: 'IN VAULT',
    status_out_verif: 'OUT FOR VERIFICATION',
    status_released: 'RELEASED',
    status_auction_rev: 'AUCTION REVIEW',
    move_packet_btn: 'Move / Relocate Packet',
    print_packet_tag: 'Print Packet QR Tag',
    movement_history: 'Movement Audit Ledger',
    total_packets_safe: 'Packets in Vault',
    total_weight_safe: 'Total Gold Weight in Safe',
    total_capital_safe: 'Loan Capital Stored',
    vacant_packets: 'Released / Vacant',
    out_for_verif_count: 'Out for Verification',
    reason_for_move: 'Reason for Relocation *',
    relocation_success: 'Packet location updated and audit entry recorded!',

    // Dashboard KPIs
    kpi_today_loans: "Today's Loans Disbursed",
    kpi_today_collections: "Today's Total Collections",
    kpi_today_interest: "Today's Interest Collected",
    kpi_today_pledges: "New Pledges Today",
    kpi_today_redemptions: "Redemptions Today",
    kpi_active_pledges: 'Total Active Pledges',
    kpi_outstanding_principal: 'Total Outstanding Principal',
    kpi_interest_pending: 'Estimated Interest Pending',
    kpi_due_today: 'Pledges Due Today',
    kpi_due_7days: 'Due in Next 7 Days',
    kpi_overdue: 'Overdue Loans (>12 Mo)',
    recent_transactions: 'Recent Activity Feed',
    no_recent_activity: 'No transactions recorded today',

    // Alerts
    alert_due_today_title: 'Pledges Due Today',
    alert_due_7d_title: 'Upcoming Maturity (7 Days)',
    alert_overdue_title: 'Overdue Loans (> 12 Months)',
    alert_missing_kyc_title: 'Borrowers with Missing KYC Proofs',
    alert_sync_pending_title: 'Offline Transactions Queued for Sync',
    alert_rate_stale_title: 'Metal Rates Stale (> 24 Hours)',
    alert_backup_title: 'Database Backup Due',

    // Reminders
    reminder_title: 'Maturity & Follow-up Reminders',
    filter_all: 'All Reminders',
    filter_today: 'Due Today',
    filter_tomorrow: 'Tomorrow',
    filter_7days: 'Next 7 Days',
    filter_overdue: 'Overdue',
    filter_missing_docs: 'Missing KYC',
    filter_completed: 'Completed / Contacted',
    action_whatsapp: 'Send WhatsApp',
    action_call: 'Call Borrower',
    action_mark_contacted: 'Mark as Contacted',
    action_mark_completed: 'Mark Done',
    reminder_type: 'Reminder Type',
    due_date: 'Due Date',

    // Customer Fields
    customer_name: 'Customer Name',
    tamil_name: 'Tamil Name',
    customer_id: 'Customer ID',
    father_husband_name: 'Father / Husband Name',
    dob: 'Date of Birth',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    occupation: 'Occupation',
    mobile_number: 'Mobile Number',
    alt_mobile: 'Alternate Mobile',
    email: 'Email Address',
    address: 'Address / Street',
    town_village: 'Town / Village',
    taluk: 'Taluk',
    district: 'District',
    state: 'State',
    pincode: 'PIN Code',
    id_type: 'KYC ID Proof Type',
    id_number: 'ID Proof Number',
    aadhaar_card: 'Aadhaar Card',
    voter_id: 'Voter ID Card',
    ration_card: 'Smart Ration Card',
    driving_licence: 'Driving Licence',
    pan_card: 'PAN Card',
    kyc_status: 'KYC Status',
    kyc_verified: 'KYC Verified',
    kyc_pending: 'KYC Pending',
    customer_photo: 'Customer Photo',
    signature: 'Customer Signature',
    thumb_impression: 'Thumb Impression',
    notes: 'Internal Notes',
    recent_customers: 'Recently Accessed Customers',
    duplicate_warning_title: 'Possible Duplicate Customer Detected!',
    duplicate_warning_desc: 'A customer with this mobile number or name already exists in the system.',
    view_existing: 'View Existing Profile',
    add_customer: '+ New Customer',
    edit_customer: 'Edit Customer Profile',
    update_customer: 'Update Customer',
    save_customer: 'Save Customer Profile',
    total_customers: 'Total Registered Customers',
    active_pledges_count: 'Active Pledges',
    outstanding_balance: 'Outstanding Balance',
    lifetime_history: 'Lifetime Loan History',

    // Renewal & Redemption Terms
    renewal_title: 'Pledge Renewal & Tenure Extension',
    redemption_title: 'Pledge Redemption & Jewellery Release',
    renew_pledge_btn: 'Renew Pledge & Issue New Ticket',
    redeem_pledge_btn: 'Confirm Release & Complete Redemption',
    old_ticket_ref: 'Original Ticket Reference',
    new_ticket_gen: 'New Renewed Ticket Number',
    interest_to_settle: 'Accrued Interest to Settle (₹)',
    new_loan_principal: 'New Loan Principal (₹)',
    new_maturity_date: 'New Maturity Date (12 Months)',
    cust_verification_check: 'Borrower KYC & Identity Verified',
    item_release_checklist: 'Physical Jewellery Inspection & Handover Checklist',
    item_handover_cert: 'I certify that all pledged articles have been inspected and delivered to the borrower in good condition.',
    vault_freed_notice: 'Vault packet location marked as VACANT and ready for reuse.',
    redemption_success_msg: 'Pledge redeemed, jewellery released, and receipt generated successfully!',
    renewal_success_msg: 'Pledge renewed successfully. New pawn ticket issued!',

    // Payment & Interest Terms
    payment_collection: 'Payment & Interest Collection',
    accrued_interest: 'Accrued Interest',
    principal_balance: 'Principal Balance',
    total_amount_due: 'Total Amount Due',
    amount_to_pay: 'Payment Amount (₹)',
    interest_only: 'Interest Only Payment',
    partial_principal: 'Partial Principal Repayment',
    full_payoff: 'Full Settlement & Payoff',
    payment_mode: 'Payment Mode',
    mode_cash: 'Cash (ரொக்கம்)',
    mode_upi: 'UPI (GPay / PhonePe / Paytm)',
    mode_bank: 'Bank Transfer (IMPS / NEFT)',
    mode_other: 'Other Method',
    utr_ref_number: 'UPI UTR / Bank Reference No',
    collect_payment_btn: 'Collect Payment & Issue Receipt',
    payment_history_ledger: 'Payment & Settlement Ledger',
    interest_settled: 'Interest Settled (₹)',
    principal_settled: 'Principal Settled (₹)',
    remaining_principal: 'Remaining Principal (₹)',
    reversed_badge: 'REVERSED',
    reverse_payment: 'Reverse Payment',
    reversal_confirm_msg: 'Are you sure you want to reverse this payment? An offsetting audit entry will be created.',
    payment_recorded_success: 'Payment recorded and receipt generated successfully!',

    // Billing & Document Terms
    pawn_ticket_doc: 'Pawn Ticket (Form F)',
    payment_receipt_doc: 'Payment Collection Receipt',
    renewal_receipt_doc: 'Pledge Renewal Receipt',
    redemption_receipt_doc: 'Pledge Redemption & Release Receipt',
    format_a4: '📄 Standard A4 Full Page',
    format_thermal: '🧾 80mm Thermal Receipt Slip',
    reprint_watermark: 'DUPLICATE / REPRINT',
    reprint_action: 'Reprint Document',
    reprint_logged: 'Reprint audit log recorded successfully',
    receipt_no: 'Receipt Number',
    ticket_no: 'Ticket Number',
    pledge_ref: 'Pledge Reference',
    amount_paid: 'Amount Paid (₹)',
    next_due_date: 'Next Due Date',
    items_released: 'Pledged Articles Handed Over in Good Condition',
    customer_sign: 'Customer Signature',
    authorised_sign: 'Authorised Signatory',
    terms_conditions: 'Terms & Conditions',

    // Rate Management Terms
    gold_24k: 'Gold 24K (Pure Gold)',
    gold_22k: 'Gold 22K (916 Hallmark)',
    silver_rate_1g: 'Silver (1g)',
    silver_rate_1kg: 'Silver (1kg)',
    rate_source: 'Rate Source',
    live_api: 'Live Market API',
    manual_override: 'Manual Admin Override',
    cached_offline: 'Cached (Offline/Fallback)',
    last_updated: 'Last Updated',
    fetch_latest_rates: 'Fetch Latest Rates',
    override_rates: 'Override Rates Manually',
    rate_history_ledger: 'Historical Rates Audit Ledger',

    // New Pledge POS & Jewellery Items
    select_customer: 'Select Customer',
    search_cust_help: 'Type customer name, mobile, or ID...',
    quick_register: '+ Quick Register New Customer',
    jewellery_items: 'Pledged Jewellery Items',
    add_jewellery_item: '+ Add Jewellery Item',
    item_type: 'Item Type',
    purity_karat: 'Purity / Karat',
    gross_weight: 'Gross Weight (g)',
    stone_weight: 'Stone Weight (g)',
    net_weight: 'Net Weight (g)',
    estimated_value: 'Market Valuation (₹)',
    eligible_loan: 'Eligible Loan (75%)',
    approved_loan: 'Approved Loan Amount (₹)',
    monthly_interest_rate: 'Interest Rate (% / month)',
    monthly_interest_amount: 'Monthly Interest (₹)',
    tenure_months: 'Tenure (Months)',
    vault_packet_allocation: 'Vault & Packet Allocation',
    vault_location: 'Vault Location',
    locker_tray: 'Locker & Tray',
    packet_number: 'Packet Number',
    item_photos: 'Pledged Item Photos',
    pawn_ticket: 'Pawn Ticket',
    generate_ticket: 'Approve & Issue Pawn Ticket',
    saving_state: 'Saving Transaction...',
    saved_state: 'Saved to Database...',
    ticket_generated: 'Pawn Ticket Generated Successfully!',
    item_chain: 'Chain',
    item_ring: 'Ring',
    item_bangle: 'Bangle',
    item_necklace: 'Necklace',
    item_earrings: 'Earrings',
    item_bracelet: 'Bracelet',
    item_thali: 'Thali / Mangalsutra',
    item_coin: 'Gold Coin',
    item_nosestud: 'Nose Stud',
    item_anklet: 'Anklet (Silver/Gold)',
    item_silver_article: 'Silver Article / Vessel',
    item_other: 'Other Item',
    print_ticket: 'Print Pawn Ticket',
    print_receipt: 'Print Receipt',
    collect_payment: 'Collect Payment',
    redeem_pledge: 'Redeem Pledge',
    renew_pledge: 'Renew Pledge',

    // Statuses
    status: 'Status',
    active: 'Active',
    due: 'Due',
    overdue: 'Overdue',
    renewed: 'Renewed',
    redemption_pending: 'Redemption Pending',
    redeemed: 'Redeemed',
    auction_review: 'Auction Review',
    closed: 'Closed',
    pending: 'Pending',
    synced: 'Synced',
    failed: 'Failed',

    // Action Buttons
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    search: 'Search',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    refresh: 'Refresh',

    // Common Messages
    no_records_found: 'No records found',
    loading: 'Loading data...',
    confirm_action: 'Are you sure you want to proceed?',
    success_saved: 'Saved successfully',
    error_occurred: 'An error occurred. Please try again.',
  },

  ta: {
    // Brand & Header
    shop_name: 'ஏ.எஸ் ஜூவல்லர்ஸ்',
    shop_tagline: 'அடகு கடை & நகை மாளிகை',
    admin_portal: 'நிர்வாக தளம்',
    dashboard: 'முகப்பு பலகை',
    customers: 'வாடிக்கையாளர்கள்',
    customer: 'வாடிக்கையாளர் விவரம்',
    pledges: 'அடகுகள்',
    new_pledge: 'புதிய அடகு பதிவு (POS)',
    payments: 'பணம் செலுத்துதல்',
    redemption: 'அடகு மீட்பு',
    renewal: 'அடகு புதுப்பித்தல்',
    reminders: 'நினைவூட்டல்கள்',
    rates: 'தங்கம் & வெள்ளி விலை',
    reports: 'அறிக்கைகள் & பேரேடு',
    documents: 'ஆவணங்கள்',
    vault: 'பெட்டகம் & பாக்கெட் இருப்பிடம்',
    settings: 'அமைப்புகள்',
    logout: 'வெளியேறு',
    online: 'இணையத்தில் உள்ளது',
    offline: 'ஆஃப்லைன் பயன்முறை',
    search_placeholder: 'வாடிக்கையாளர் பெயர், எண், சீட்டு எண் தேடுக...',
    global_search: 'முழு தேடல்',
    quick_actions: 'விரைவு செயல்பாடுகள்',
    today_overview: 'இன்றைய செயல்பாட்டு சுருக்கம்',
    alerts: 'முக்கிய எச்சரிக்கைகள்',
    live_rates: 'இன்றைய சந்தை விலை',

    // Reports & Cash Terms
    rep_daily_daybook: 'தினசரி நாள் பேரேடு (Day-Book)',
    rep_cash_management: 'ரொக்க பெட்டி & செலவு கணக்கு',
    rep_outstanding: 'நிலுவை கடன் இருப்பு அறிக்கை',
    rep_cust_statement: 'வாடிக்கையாளர் முழு அறிக்கை',
    rep_metal_inventory: 'தங்கம் & வெள்ளி இருப்பு விவரம்',
    rep_monthly_summary: 'மாதாந்திர வரவு செலவு சுருக்கம்',
    opening_balance: 'ஆரம்ப ரொக்க இருப்பு (Opening)',
    cash_collections: 'ரொக்க வசூல் (+)',
    cash_loans_given: 'வழங்கிய ரொக்க கடன் (-)',
    cash_expenses: 'கடை ரொக்க செலவுகள் (-)',
    expected_closing_cash: 'இருக்க வேண்டிய ரொக்க இருப்பு',
    actual_drawer_cash: 'பெட்டியில் உள்ள நேரடி ரொக்கம்',
    cash_variance: 'ரொக்க வித்தியாசம்',
    expenses_title: 'கடை செலவு பதிவேடு',
    add_expense_btn: '+ கடை செலவு பதிவு செய்',
    expense_category: 'செலவு வகை',
    expense_amount: 'செலவு தொகை (₹)',
    expense_desc: 'செலவு விவரம்',
    cat_tea_snacks: 'தேநீர் & சிற்றுண்டி',
    cat_rent: 'கடை வாடகை',
    cat_electricity: 'மின்சார கட்டணம் (EB)',
    cat_stationery: 'ஸ்டேஷனரி & அச்சு செலவு',
    cat_office: 'அலுவலக பொருட்கள் / சுத்தம்',
    cat_maintenance: 'கடை பராமரிப்பு செலவு',
    cat_salary: 'பணியாளர் சம்பளம் / கூலி',
    cat_other: 'இதர செலவு',
    export_csv: 'CSV பதிவிறக்கம்',
    print_report: 'அறிக்கை அச்சிடு (A4)',
    date_range_label: 'தேதி வரம்பு',
    range_today: 'இன்று',
    range_yesterday: 'நேற்று',
    range_this_week: 'இந்த வாரம்',
    range_this_month: 'இந்த மாதம்',
    range_last_month: 'கடந்த மாதம்',
    range_custom: 'குறிப்பிட்ட தேதி',
    from_date: 'தொடக்க தேதி',
    to_date: 'முடிவு தேதி',
    apply_filter: 'தேதியை பொருத்து',

    // Vault & Packet Terms
    vault_title: 'பெட்டகம் & பாக்கெட் இருப்பிட மேலாண்மை',
    vault_room: 'பெட்டக அறை (Vault)',
    locker_number: 'லாக்கர் எண்',
    tray_number: 'தட்டு எண் (Tray)',
    packet_id: 'பாக்கெட் குறியீடு',
    location_note: 'இருப்பிட குறிப்பு',
    status_in_vault: 'பெட்டகத்தில் உள்ளது (IN VAULT)',
    status_out_verif: 'சரிபார்ப்புக்கு எடுக்கப்பட்டது',
    status_released: 'மீட்கப்பட்டு விடுவிக்கப்பட்டது',
    status_auction_rev: 'ஏல பரிசீலனையில்',
    move_packet_btn: 'பாக்கெட் இருப்பிடம் மாற்று',
    print_packet_tag: 'பாக்கெட் QR குறியீடு அச்சிடு',
    movement_history: 'இருப்பிட மாற்ற தணிக்கை பதிவேடு',
    total_packets_safe: 'பெட்டகத்தில் உள்ள பாக்கெட்டுகள்',
    total_weight_safe: 'பாதுகாப்பில் உள்ள மொத்த தங்கம்',
    total_capital_safe: 'பாதுகாப்பில் உள்ள கடன் மதிப்பு',
    vacant_packets: 'காலியான பாக்கெட்டுகள்',
    out_for_verif_count: 'சரிபார்ப்பில் உள்ளவை',
    reason_for_move: 'இருப்பிடம் மாற்றுவதற்கான காரணம் *',
    relocation_success: 'பாக்கெட் இருப்பிடம் புதுப்பிக்கப்பட்டு தணிக்கை பதிவு செய்யப்பட்டது!',

    // Dashboard KPIs
    kpi_today_loans: 'இன்று வழங்கிய கடன்',
    kpi_today_collections: 'இன்றைய மொத்த வசூல்',
    kpi_today_interest: 'இன்று வசூலான வட்டி',
    kpi_today_pledges: 'இன்றைய புதிய அடகுகள்',
    kpi_today_redemptions: 'இன்றைய மீட்புகள்',
    kpi_active_pledges: 'செயலில் உள்ள அடகுகள்',
    kpi_outstanding_principal: 'மொத்த நிலுவை அசல் கடன்',
    kpi_interest_pending: 'நிலுவை வட்டி மதிப்பு',
    kpi_due_today: 'இன்று கெடு முடிந்தவை',
    kpi_due_7days: 'அடுத்த 7 நாட்களில் கெடு',
    kpi_overdue: 'காலாவதியானவை (>12 மாதங்கள்)',
    recent_transactions: 'சமீபத்திய பரிவர்த்தனை பட்டியல்',
    no_recent_activity: 'இன்று பரிவர்த்தனைகள் எதுவும் இல்லை',

    // Alerts
    alert_due_today_title: 'இன்று கெடு முடியும் அடகுகள்',
    alert_due_7d_title: 'அடுத்த 7 நாட்களில் கெடு முடியும் அடகுகள்',
    alert_overdue_title: 'காலாவதியான அடகுகள் (> 12 மாதங்கள்)',
    alert_missing_kyc_title: 'ஆவணங்கள் விடுபட்ட வாடிக்கையாளர்கள்',
    alert_sync_pending_title: 'பதிவேற்றப்பட வேண்டிய ஆஃப்லைன் தரவுகள்',
    alert_rate_stale_title: 'விலை புதுப்பிக்கப்படவில்லை (> 24 மணி நேரம்)',
    alert_backup_title: 'தரவு காப்பு பிரதி எடுக்க வேண்டும்',

    // Reminders
    reminder_title: 'கெடு தேதி & நினைவூட்டல் மேலாண்மை',
    filter_all: 'அனைத்து நினைவூட்டல்கள்',
    filter_today: 'இன்றைய கெடு',
    filter_tomorrow: 'நாளை',
    filter_7days: 'அடுத்த 7 நாட்கள்',
    filter_overdue: 'காலாவதியானவை',
    filter_missing_docs: 'ஆவணங்கள் விடுபட்டவை',
    filter_completed: 'தொடர்பு கொள்ளப்பட்டவை',
    action_whatsapp: 'வாட்ஸ்அப் தகவல் அனுப்பு',
    action_call: 'அழைப்பு செய்',
    action_mark_contacted: 'தொடர்பு கொண்டதாக குறி',
    action_mark_completed: 'முடிந்தது',
    reminder_type: 'நினைவூட்டல் வகை',
    due_date: 'கெடு தேதி',

    // Customer Fields
    customer_name: 'வாடிக்கையாளர் பெயர்',
    tamil_name: 'தமிழ் பெயர்',
    customer_id: 'வாடிக்கையாளர் எண்',
    father_husband_name: 'தந்தை / கணவர் பெயர்',
    dob: 'பிறந்த தேதி',
    gender: 'பாலினம்',
    male: 'ஆண்',
    female: 'பெண்',
    other: 'மற்றவை',
    occupation: 'தொழில்',
    mobile_number: 'கைபேசி எண்',
    alt_mobile: 'மாற்று கைபேசி எண்',
    email: 'மின்னஞ்சல்',
    address: 'முகவரி / தெரு',
    town_village: 'ஊர் / கிராமம்',
    taluk: 'வட்டம்',
    district: 'மாவட்டம்',
    state: 'மாநிலம்',
    pincode: 'அஞ்சல் குறியீடு',
    id_type: 'அடையாள சான்று வகை',
    id_number: 'சான்று எண்',
    aadhaar_card: 'ஆதார் அட்டை',
    voter_id: 'வாக்காளர் அடையாள அட்டை',
    ration_card: 'ஸ்மார்ட் குடும்ப அட்டை',
    driving_licence: 'ஓட்டுநர் உரிமம்',
    pan_card: 'பான் அட்டை',
    kyc_status: 'ஆவண சரிபார்ப்பு',
    kyc_verified: 'சரிபார்க்கப்பட்டது',
    kyc_pending: 'சரிபார்ப்பு நிலுவையில்',
    customer_photo: 'வாடிக்கையாளர் புகைப்படம்',
    signature: 'கையொப்பம்',
    thumb_impression: 'கைரேகை',
    notes: 'உள் குறிப்புகள்',
    recent_customers: 'சமீபத்திய வாடிக்கையாளர்கள்',
    duplicate_warning_title: 'ஏற்கனவே உள்ள வாடிக்கையாளர் எச்சரிக்கை!',
    duplicate_warning_desc: 'இந்த கைபேசி எண் அல்லது பெயரில் ஏற்கனவே வாடிக்கையாளர் பதிவு செய்யப்பட்டுள்ளார்.',
    view_existing: 'உள்ள வாடிக்கையாளரைப் பார்',
    add_customer: '+ புதிய வாடிக்கையாளர்',
    edit_customer: 'வாடிக்கையாளர் விவரம் மாற்று',
    update_customer: 'புதுப்பி',
    save_customer: 'விவரங்களை சேமி',
    total_customers: 'மொத்த வாடிக்கையாளர்கள்',
    active_pledges_count: 'செயலில் உள்ள அடகுகள்',
    outstanding_balance: 'நிலுவை கடன் தொகை',
    lifetime_history: 'மொத்த கடன் வரலாறு',

    // Renewal & Redemption Terms
    renewal_title: 'அடகு புதுப்பித்தல் & கால நீட்டிப்பு',
    redemption_title: 'அடகு மீட்பு & நகைகள் ஒப்படைப்பு',
    renew_pledge_btn: 'அடகை புதுப்பித்து புதிய சீட்டு உருவாக்கு',
    redeem_pledge_btn: 'நகைகளை ஒப்படைத்து மீட்பை உறுதி செய்',
    old_ticket_ref: 'பழைய அடகு சீட்டு எண்',
    new_ticket_gen: 'புதிய அடகு சீட்டு எண்',
    interest_to_settle: 'செலுத்த வேண்டிய வட்டி (₹)',
    new_loan_principal: 'புதிய கடன் அசல் (₹)',
    new_maturity_date: 'புதிய கெடு தேதி (12 மாதங்கள்)',
    cust_verification_check: 'வாடிக்கையாளர் ஆவணங்கள் சரிபார்க்கப்பட்டது',
    item_release_checklist: 'நகைகள் சரிபார்ப்பு & ஒப்படைப்பு விவரம்',
    item_handover_cert: 'அடகு வைக்கப்பட்ட அனைத்து நகைகளும் நல்ல நிலையில் வாடிக்கையாளரிடம் ஒப்படைக்கப்பட்டது என்பதை உறுதி செய்கிறேன்.',
    vault_freed_notice: 'பெட்டக அறை பாக்கெட் காலியாக்கப்பட்டு பயன்பாட்டிற்கு தயாராக உள்ளது.',
    redemption_success_msg: 'அடகு மீட்கப்பட்டு, நகைகள் ஒப்படைக்கப்பட்டு ரசீது உருவாக்கப்பட்டது!',
    renewal_success_msg: 'அடகு வெற்றிகரமாக புதுப்பிக்கப்பட்டு புதிய சீட்டு வழங்கப்பட்டது!',

    // Payment & Interest Terms
    payment_collection: 'பணம் & வட்டி வசூல்',
    accrued_interest: 'வட்டி நிலுவை (₹)',
    principal_balance: 'அசல் கடன் நிலுவை (₹)',
    total_amount_due: 'மொத்த செலுத்த வேண்டிய தொகை (₹)',
    amount_to_pay: 'செலுத்தும் தொகை (₹)',
    interest_only: 'வட்டி மட்டும் செலுத்துதல்',
    partial_principal: 'பகுதி அசல் செலுத்துதல்',
    full_payoff: 'முழு கடன் தீர்வு & மீட்பு',
    payment_mode: 'பணம் செலுத்தும் முறை',
    mode_cash: 'ரொக்கம் (Cash)',
    mode_upi: 'யுபிஐ (GPay / PhonePe / Paytm)',
    mode_bank: 'வங்கி பரிவர்த்தனை (IMPS / NEFT)',
    mode_other: 'இதர முறை',
    utr_ref_number: 'யுபிஐ / வங்கி பரிவர்த்தனை குறிப்பு எண்',
    collect_payment_btn: 'பணம் வசூலித்து ரசீது அச்சிடு',
    payment_history_ledger: 'கட்டண வசூல் பதிவேடு',
    interest_settled: 'செலுத்திய வட்டி (₹)',
    principal_settled: 'செலுத்திய அசல் (₹)',
    remaining_principal: 'மீதமுள்ள அசல் கடன் (₹)',
    reversed_badge: 'ரத்து செய்யப்பட்டது',
    reverse_payment: 'கட்டணத்தை ரத்து செய்',
    reversal_confirm_msg: 'நிச்சயமாக இந்த கட்டண பதிவை ரத்து செய்ய விரும்புகிறீர்களா?',
    payment_recorded_success: 'கட்டணம் வெற்றிகரமாக பதிவு செய்யப்பட்டு ரசீது உருவாக்கப்பட்டது!',

    // Billing & Document Terms
    pawn_ticket_doc: 'அடகு சீட்டு (படிவம் F)',
    payment_receipt_doc: 'கட்டண ரசீது',
    renewal_receipt_doc: 'அடகு புதுப்பித்தல் ரசீது',
    redemption_receipt_doc: 'அடகு மீட்பு ரசீது',
    format_a4: '📄 நிலையான A4 தாள் வடிவம்',
    format_thermal: '🧾 80 மிமீ தெர்மல் ரசீது',
    reprint_watermark: 'நகல் / மறு அச்சு (DUPLICATE)',
    reprint_action: 'மறு அச்சிடு',
    reprint_logged: 'மறு அச்சு தணிக்கை பதிவு செய்யப்பட்டது',
    receipt_no: 'ரசீது எண்',
    ticket_no: 'சீட்டு எண்',
    pledge_ref: 'அடகு குறிப்பு',
    amount_paid: 'செலுத்திய தொகை (₹)',
    next_due_date: 'அடுத்த கெடு தேதி',
    items_released: 'அடகு வைக்கப்பட்ட நகைகள் அனைத்தும் நல்ல நிலையில் பெறப்பட்டது',
    customer_sign: 'வாடிக்கையாளர் கையொப்பம்',
    authorised_sign: 'நிர்வாகி கையொப்பம்',
    terms_conditions: 'விதிமுறைகள்',

    // Rate Management Terms
    gold_24k: 'தங்கம் 24K (சுத்த தங்கம்)',
    gold_22k: 'தங்கம் 22K (916 ஹால்மார்க்)',
    silver_rate_1g: 'வெள்ளி (1 கிராம்)',
    silver_rate_1kg: 'வெள்ளி (1 கிலோ)',
    rate_source: 'விலை ஆதாரம்',
    live_api: 'நேரடி சந்தை விலை (API)',
    manual_override: 'நிர்வாக விலை மாற்றம்',
    cached_offline: 'சேமிக்கப்பட்ட விலை (ஆஃப்லைன்)',
    last_updated: 'கடைசி புதுப்பிப்பு',
    fetch_latest_rates: 'சந்தை விலையை புதுப்பி',
    override_rates: 'கடை விலையை மாற்று',
    rate_history_ledger: 'விலை வரலாற்று பதிவேடு',

    // New Pledge POS & Jewellery Items
    select_customer: 'வாடிக்கையாளரைத் தேர்வு செய்',
    search_cust_help: 'வாடிக்கையாளர் பெயர், எண் அல்லது அடையாள எண் தேடுக...',
    quick_register: '+ புதிய வாடிக்கையாளர் உடனடி பதிவு',
    jewellery_items: 'அடகு வைக்கப்படும் நகைகள்',
    add_jewellery_item: '+ நகை பொருள் சேர்',
    item_type: 'பொருள் வகை',
    purity_karat: 'தரம் / கேரட்',
    gross_weight: 'மொத்த எடை (கி)',
    stone_weight: 'கல் எடை (கி)',
    net_weight: 'நிகர எடை (கி)',
    estimated_value: 'சந்தை மதிப்பு (₹)',
    eligible_loan: 'தகுதியான கடன் (75%)',
    approved_loan: 'வழங்கப்படும் கடன் தொகை (₹)',
    monthly_interest_rate: 'மாத வட்டி விகிதம் (%)',
    monthly_interest_amount: 'மாத வட்டி தொகை (₹)',
    tenure_months: 'கால அளவு (மாதங்கள்)',
    vault_packet_allocation: 'பெட்டகம் & பாக்கெட் விவரம்',
    vault_location: 'பெட்டக அறை (Vault)',
    locker_tray: 'லாக்கர் & தட்டு',
    packet_number: 'பாக்கெட் எண்',
    item_photos: 'நகை புகைப்படங்கள்',
    pawn_ticket: 'அடகு சீட்டு',
    generate_ticket: 'அடகு சீட்டு உருவாக்கு (அனுமதி)',
    saving_state: 'பதிவேற்றப்படுகிறது...',
    saved_state: 'தரவுத்தளத்தில் சேமிக்கப்பட்டது...',
    ticket_generated: 'அடகு சீட்டு வெற்றிகரமாக உருவாக்கப்பட்டது!',
    item_chain: 'சங்கிலி (Chain)',
    item_ring: 'மோதிரம் (Ring)',
    item_bangle: 'வளையல் (Bangle)',
    item_necklace: 'ஆரம் / நெக்லஸ்',
    item_earrings: 'கம்மல் / தோடு',
    item_bracelet: 'காப்பு / பிரேஸ்லெட்',
    item_thali: 'தாலி / மாங்கல்யம்',
    item_coin: 'தங்கக் காசு (Coin)',
    item_nosestud: 'மூக்குத்தி (Nose Stud)',
    item_anklet: 'கொலுசு (Anklet)',
    item_silver_article: 'வெள்ளிப் பொருள் / பாத்திரம்',
    item_other: 'இதர நகை பொருள்',
    print_ticket: 'அடகு சீட்டு அச்சிடு',
    print_receipt: 'ரசீது அச்சிடு',
    collect_payment: 'பணம் வசூலி',
    redeem_pledge: 'அடகு மீட்பு செய்',
    renew_pledge: 'அடகை புதுப்பி',

    // Statuses
    status: 'நிலை',
    active: 'செயலில் உள்ளது',
    due: 'கெடு தேதி',
    overdue: 'காலாவதி',
    renewed: 'புதுப்பிக்கப்பட்டது',
    redemption_pending: 'மீட்பு நிலுவையில்',
    redeemed: 'மீட்கப்பட்டது',
    auction_review: 'ஏல பரிசீலனை',
    closed: 'முடிக்கப்பட்டது',
    pending: 'காத்திருக்கிறது',
    synced: 'பதிவேற்றப்பட்டது',
    failed: 'தோல்வி',

    // Action Buttons
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    submit: 'சமர்ப்பி',
    search: 'தேடு',
    view: 'பார்',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    refresh: 'புதுப்பி',

    // Common Messages
    no_records_found: 'விவரங்கள் எதுவும் கிடைக்கவில்லை',
    loading: 'விவரங்கள் ஏற்றப்படுகின்றன...',
    confirm_action: 'நிச்சயமாக தொடர விரும்புகிறீர்களா?',
    success_saved: 'வெற்றிகரமாக சேமிக்கப்பட்டது',
    error_occurred: 'பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.',
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem(I18N_STORAGE_KEY) || DEFAULT_LANG;
  }

  init() {
    this.applyLanguage(this.currentLang);
    this.bindEvents();
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (!translations[lang]) return;
    this.currentLang = lang;
    localStorage.setItem(I18N_STORAGE_KEY, lang);
    this.applyLanguage(lang);
    
    // Dispatch event for components to react to language change
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  }

  t(key, fallback = '') {
    const langDict = translations[this.currentLang] || translations.en;
    return langDict[key] || translations.en[key] || fallback || key;
  }

  applyLanguage(lang) {
    document.documentElement.lang = lang;
    
    // Translate text content for elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    // Translate placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) {
        el.setAttribute('placeholder', translation);
      }
    });

    // Translate title attributes
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation) {
        el.setAttribute('title', translation);
      }
    });

    // Update active class on language toggle buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const btnLang = btn.getAttribute('data-lang');
      if (btnLang === lang) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  bindEvents() {
    document.addEventListener('click', (e) => {
      const langBtn = e.target.closest('.lang-btn');
      if (langBtn) {
        const lang = langBtn.getAttribute('data-lang');
        if (lang) {
          this.setLanguage(lang);
        }
      }
    });
  }
}

// Global i18n instance
window.i18n = new I18nManager();
window.t = (key, fallback) => window.i18n.t(key, fallback);

document.addEventListener('DOMContentLoaded', () => {
  window.i18n.init();
});
