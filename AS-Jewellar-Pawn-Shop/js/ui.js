/**
 * AS JEWELLAR PAWN SHOP - UI CONTROLLER & FEEDBACK SYSTEM
 * Toasts, Modals, Confirmation Prompts, Loading States & Empty States.
 */

const UI = {
  /**
   * Show a toast message (success, error, warning, info)
   */
  showToast(message, type = 'info', duration = 3500) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284C7" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <div style="flex:1;">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 250ms ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  },

  /**
   * Open a modal dialog
   */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      // Focus first input
      const firstInput = modal.querySelector('input, select, textarea, button:not(.modal-close-btn)');
      if (firstInput) firstInput.focus();
    }
  },

  /**
   * Close a modal dialog
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  },

  /**
   * Universal Confirmation Dialog Modal
   */
  confirm({ title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmText = 'Confirm', cancelText = 'Cancel', isDanger = false, onConfirm }) {
    let confirmModal = document.getElementById('appConfirmModal');
    if (!confirmModal) {
      confirmModal = document.createElement('div');
      confirmModal.id = 'appConfirmModal';
      confirmModal.className = 'modal-backdrop';
      confirmModal.innerHTML = `
        <div class="modal-dialog modal-sm">
          <div class="modal-header">
            <h3 class="modal-title" id="confirmModalTitle">${title}</h3>
            <button class="modal-close-btn" onclick="UI.closeModal('appConfirmModal')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <p id="confirmModalMsg" style="color:var(--slate-700); font-size:var(--font-size-sm);">${message}</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline btn-sm" id="confirmCancelBtn">${cancelText}</button>
            <button class="btn ${isDanger ? 'btn-danger' : 'btn-primary'} btn-sm" id="confirmOkBtn">${confirmText}</button>
          </div>
        </div>
      `;
      document.body.appendChild(confirmModal);
    } else {
      document.getElementById('confirmModalTitle').textContent = title;
      document.getElementById('confirmModalMsg').textContent = message;
      const okBtn = document.getElementById('confirmOkBtn');
      okBtn.textContent = confirmText;
      okBtn.className = `btn ${isDanger ? 'btn-danger' : 'btn-primary'} btn-sm`;
      document.getElementById('confirmCancelBtn').textContent = cancelText;
    }

    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    const cleanUp = () => {
      UI.closeModal('appConfirmModal');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    };

    okBtn.onclick = () => {
      cleanUp();
      if (typeof onConfirm === 'function') onConfirm();
    };

    cancelBtn.onclick = cleanUp;
    UI.openModal('appConfirmModal');
  },

  /**
   * Fullscreen Loading Indicator Overlay
   */
  showLoading(text = 'Processing transaction...') {
    let overlay = document.getElementById('globalLoadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'globalLoadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = `
        <div class="spinner" style="width:36px; height:36px; border-width:3px;"></div>
        <div id="loadingOverlayText" style="font-weight:700; color:var(--slate-900); font-size:var(--font-size-sm);">${text}</div>
      `;
      document.body.appendChild(overlay);
    } else {
      document.getElementById('loadingOverlayText').textContent = text;
      overlay.style.display = 'flex';
    }
  },

  hideLoading() {
    const overlay = document.getElementById('globalLoadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }
};

window.UI = UI;

// Modal backdrop click-to-close handler
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});
