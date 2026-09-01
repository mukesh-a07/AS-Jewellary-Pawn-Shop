/**
 * AS JEWELLAR PAWN SHOP - APP CONTROLLER & LAYOUT MANAGER
 * Injects Desktop Sidebar, Top Header, Mobile Bottom Nav, Global Search & Service Worker.
 */

class AppController {
  constructor() {
    this.currentPage = this.getCurrentPageName();
  }

  getCurrentPageName() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page === '' ? 'index.html' : page;
  }

  init() {
    this.renderSharedLayout();
    this.bindGlobalShortcuts();
    this.registerServiceWorker();
    this.bindMobileMenu();
  }

  renderSharedLayout() {
    // Skip shell injection on login page or standalone landing
    if (this.currentPage === 'login.html') return;

    const appShell = document.querySelector('.app-shell');
    if (!appShell) return;

    // 1. Inject Desktop Sidebar if placeholder exists or prepend
    let sidebar = document.querySelector('.sidebar');
    if (!sidebar) {
      sidebar = document.createElement('aside');
      sidebar.className = 'sidebar';
      sidebar.innerHTML = this.getSidebarHTML();
      appShell.prepend(sidebar);
    }

    // 2. Inject Top Header if header placeholder exists
    const mainWrapper = document.querySelector('.main-wrapper');
    if (mainWrapper) {
      let topHeader = mainWrapper.querySelector('.top-header');
      if (!topHeader) {
        topHeader = document.createElement('header');
        topHeader.className = 'top-header';
        topHeader.innerHTML = this.getHeaderHTML();
        mainWrapper.prepend(topHeader);
      }
    }

    // 3. Inject Mobile Bottom Navigation
    let bottomNav = document.querySelector('.mobile-bottom-nav');
    if (!bottomNav) {
      bottomNav = document.createElement('nav');
      bottomNav.className = 'mobile-bottom-nav';
      bottomNav.innerHTML = this.getMobileBottomNavHTML();
      document.body.appendChild(bottomNav);
    }

    // 4. Inject Global Search Modal
    this.injectGlobalSearchModal();

    // 5. Highlight active links
    this.highlightActiveNavigation();

    // 6. Trigger i18n translation pass for freshly injected layout components
    if (window.i18n) {
      window.i18n.applyLanguage(window.i18n.getLanguage());
    }
  }

  getSidebarHTML() {
    return `
      <div class="sidebar-header">
        <svg width="34" height="34" viewBox="0 0 80 80" fill="none">
          <rect x="0" y="0" width="80" height="80" rx="16" fill="#0F172A" />
          <path d="M40 16 L62 32 L40 68 L18 32 Z" fill="none" stroke="#D4AF37" stroke-width="4" stroke-linejoin="round" />
          <path d="M18 32 L62 32" stroke="#D4AF37" stroke-width="3" />
          <path d="M40 16 L40 68" stroke="#D4AF37" stroke-width="3" />
          <circle cx="40" cy="42" r="8" fill="#D4AF37" />
        </svg>
        <div class="sidebar-brand-text">
          <span class="brand-title">AS JEWELLAR</span>
          <span class="brand-subtitle">PAWN SHOP &bull; அடகு</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section-title" data-i18n="quick_actions">OPERATIONS</div>
        
        <a href="dashboard.html" class="nav-item" data-page="dashboard.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg></span>
          <span data-i18n="dashboard">Dashboard</span>
        </a>

        <a href="new-pledge.html" class="nav-item" data-page="new-pledge.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg></span>
          <span data-i18n="new_pledge">New Pledge POS</span>
        </a>

        <a href="customers.html" class="nav-item" data-page="customers.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <span data-i18n="customers">Customers</span>
        </a>

        <a href="pledges.html" class="nav-item" data-page="pledges.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg></span>
          <span data-i18n="pledges">Pledges List</span>
        </a>

        <a href="payments.html" class="nav-item" data-page="payments.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg></span>
          <span data-i18n="payments">Payments</span>
        </a>

        <a href="redemption.html" class="nav-item" data-page="redemption.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></span>
          <span data-i18n="redemption">Redemption</span>
        </a>

        <a href="renewal.html" class="nav-item" data-page="renewal.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg></span>
          <span data-i18n="renewal">Renewal</span>
        </a>

        <div class="nav-section-title" data-i18n="alerts">MANAGEMENT</div>

        <a href="reminders.html" class="nav-item" data-page="reminders.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg></span>
          <span data-i18n="reminders">Reminders</span>
          <span class="nav-badge" id="sidebarReminderBadge" style="display:none;"></span>
        </a>

        <a href="rates.html" class="nav-item" data-page="rates.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></span>
          <span data-i18n="rates">Gold & Silver Rates</span>
        </a>

        <a href="documents.html" class="nav-item" data-page="documents.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
          <span data-i18n="documents">Documents</span>
        </a>

        <a href="reports.html" class="nav-item" data-page="reports.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg></span>
          <span data-i18n="reports">Reports & Ledger</span>
        </a>

        <a href="settings.html" class="nav-item" data-page="settings.html">
          <span class="nav-icon"><svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></span>
          <span data-i18n="settings">Settings</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <div class="user-profile-summary">
          <div class="user-avatar">AD</div>
          <div class="user-meta">
            <span class="user-name">Shop Admin</span>
            <span class="user-role">Single-Branch Admin</span>
          </div>
        </div>
        <button class="btn-logout" title="Logout" onclick="window.auth.logout()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </button>
      </div>
    `;
  }

  getHeaderHTML() {
    return `
      <div class="header-left">
        <button class="mobile-menu-toggle" id="mobileMenuBtn" aria-label="Toggle Navigation">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <div class="header-title-container">
          <h1 class="page-title" id="pageTitleText">AS Jewellar</h1>
          <span class="page-subtitle" data-i18n="shop_tagline">Pawn Shop & Jewellery</span>
        </div>
      </div>

      <div class="header-right">
        <!-- Global Search trigger button -->
        <button class="global-search-btn" onclick="UI.openModal('globalSearchModal')" aria-label="Search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span data-i18n="search_placeholder">Search ticket, customer...</span>
          <span class="search-kbd">Ctrl+K</span>
        </button>

        <!-- Connection Pill -->
        <div class="connection-pill ${navigator.onLine ? '' : 'offline'}">
          <div class="status-dot"></div>
          <span data-i18n="${navigator.onLine ? 'online' : 'offline'}">${navigator.onLine ? 'Online' : 'Offline'}</span>
        </div>

        <!-- Bilingual Switcher -->
        <div class="lang-switcher">
          <button class="lang-btn ${window.i18n?.getLanguage() === 'en' ? 'active' : ''}" data-lang="en">English</button>
          <button class="lang-btn ${window.i18n?.getLanguage() === 'ta' ? 'active' : ''}" data-lang="ta">தமிழ்</button>
        </div>

        <!-- Notification Bell -->
        <button class="header-action-btn" title="Reminders & Alerts" onclick="window.location.href='reminders.html'">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
          <div class="header-badge"></div>
        </button>
      </div>
    `;
  }

  getMobileBottomNavHTML() {
    return `
      <a href="dashboard.html" class="mobile-nav-item" data-page="dashboard.html">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        <span data-i18n="dashboard">Home</span>
      </a>

      <a href="customers.html" class="mobile-nav-item" data-page="customers.html">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span data-i18n="customers">Customers</span>
      </a>

      <!-- Big Center "+ Pledge" POS Action -->
      <a href="new-pledge.html" class="mobile-nav-center-btn" title="New Pledge">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </a>

      <a href="payments.html" class="mobile-nav-item" data-page="payments.html">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        <span data-i18n="payments">Payments</span>
      </a>

      <a href="settings.html" class="mobile-nav-item" data-page="settings.html">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span data-i18n="settings">More</span>
      </a>
    `;
  }

  injectGlobalSearchModal() {
    if (document.getElementById('globalSearchModal')) return;

    const modal = document.createElement('div');
    modal.id = 'globalSearchModal';
    modal.className = 'modal-backdrop';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title" data-i18n="global_search">Global Search (முழு தேடல்)</h3>
          <button class="modal-close-btn" onclick="UI.closeModal('globalSearchModal')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="modal-body">
          <div class="search-box" style="margin-bottom:var(--space-4);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" class="form-input" id="globalSearchInput" placeholder="Enter Customer Name, Mobile (e.g. 9876543210), Ticket No (e.g. PLG-2026-000001)..." autofocus />
          </div>
          <div id="globalSearchResults">
            <div class="empty-state" style="padding:var(--space-6) 0;">
              <div class="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div class="empty-title">Instant Search</div>
              <div class="empty-text">Type to search customer profiles, pawn tickets, payment receipts, or KYC IDs.</div>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const input = modal.querySelector('#globalSearchInput');
    input.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      const resultsContainer = modal.querySelector('#globalSearchResults');
      if (q.length < 2) {
        resultsContainer.innerHTML = `
          <div class="empty-state" style="padding:var(--space-6) 0;">
            <div class="empty-title">Instant Search</div>
            <div class="empty-text">Type at least 2 characters to search across customers and pledges.</div>
          </div>
        `;
        return;
      }

      // Real-time search across actual customers and pledges
      const customers = (window.customerManager && typeof window.customerManager.search === 'function')
        ? window.customerManager.search({ query: q, pageSize: 5 }).items
        : [];
      
      const allPledges = (window.pledgePosManager && window.pledgePosManager.pledges) || [];
      const matchedPledges = allPledges.filter(p => 
        (p.ticketNo && p.ticketNo.toLowerCase().includes(q)) ||
        (p.packetId && p.packetId.toLowerCase().includes(q)) ||
        (p.items && p.items.some(it => (it.description || '').toLowerCase().includes(q)))
      ).slice(0, 5);

      if (customers.length === 0 && matchedPledges.length === 0) {
        resultsContainer.innerHTML = `
          <div class="empty-state" style="padding:var(--space-6) 0;">
            <div class="empty-title">No Results Found</div>
            <div class="empty-text">No customers or pledges matched "${window.Validation ? window.Validation.escapeHTML(q) : q}".</div>
          </div>
        `;
        return;
      }

      let html = '<div style="display:flex; flex-direction:column; gap:var(--space-2);">';
      
      customers.forEach(c => {
        const activeCount = c.activePledgesCount || 0;
        html += `
          <a href="customer.html?id=${c.customerId}" class="card" style="padding:var(--space-3); display:flex; justify-content:space-between; align-items:center; text-decoration:none; color:inherit;">
            <div>
              <div style="font-weight:700; color:var(--slate-900);">${c.nameEn} ${c.nameTa ? `(${c.nameTa})` : ''}</div>
              <div style="font-size:12px; color:var(--slate-500);">ID: ${c.customerId} &bull; 📞 ${c.mobile} &bull; ${c.townVillage || c.district || ''}</div>
            </div>
            <span class="badge badge-primary">${activeCount} Pledges</span>
          </a>
        `;
      });

      matchedPledges.forEach(p => {
        html += `
          <a href="pledges.html?ticket=${p.ticketNo}" class="card" style="padding:var(--space-3); display:flex; justify-content:space-between; align-items:center; text-decoration:none; color:inherit;">
            <div>
              <div style="font-weight:700; color:var(--slate-900);">Ticket #${p.ticketNo}</div>
              <div style="font-size:12px; color:var(--slate-500);">Loan: ₹ ${Number(p.loanAmount || 0).toLocaleString('en-IN')} &bull; Net Wt: ${p.totalNetWeight || 0}g &bull; Packet: ${p.packetId || '-'}</div>
            </div>
            <span class="badge ${p.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}">${p.status}</span>
          </a>
        `;
      });

      html += '</div>';
      resultsContainer.innerHTML = html;
    });
  }

  highlightActiveNavigation() {
    const current = this.currentPage;
    document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(link => {
      const page = link.getAttribute('data-page');
      if (page && (current === page || (current === 'index.html' && page === 'dashboard.html'))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        UI.openModal('globalSearchModal');
      }
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach(m => m.classList.remove('open'));
        document.body.style.overflow = '';
      }
    });
  }

  bindMobileMenu() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('#mobileMenuBtn')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.toggle('mobile-open');
        }
      } else if (!e.target.closest('.sidebar') && document.querySelector('.sidebar.mobile-open')) {
        document.querySelector('.sidebar').classList.remove('mobile-open');
      }
    });
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => console.log('ServiceWorker registered with scope:', reg.scope))
          .catch(err => console.warn('ServiceWorker registration failed:', err));
      });
    }
  }
}

window.app = new AppController();

document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
