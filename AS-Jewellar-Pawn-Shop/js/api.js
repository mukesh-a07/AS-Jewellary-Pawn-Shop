/**
 * AS JEWELLAR PAWN SHOP - API COMMUNICATION CLIENT
 * Handles network requests, timeout fallbacks, idempotency tokens, and offline queueing.
 */

class ApiClient {
  constructor() {
    this.endpoint = this.loadEndpoint();
    this.timeoutMs = 8000;
  }

  loadEndpoint() {
    return localStorage.getItem('as_jewellar_api_endpoint') || 'https://script.google.com/macros/s/AKfycbw6fWoHIhQxVRHEoTVwoMIe5pPA8B17ClwYL4lpJl1oB8kOXHHrF-snXRICsgZbGOJu/exec';
  }

  setEndpoint(url) {
    this.endpoint = url;
    localStorage.setItem('as_jewellar_api_endpoint', url);
  }

  isConfigured() {
    return Boolean(this.endpoint && (this.endpoint.startsWith('https://script.google.com/macros/s/') || this.endpoint.startsWith('http')));
  }

  async get(action, params = {}) {
    const token = (typeof window !== 'undefined' && window.auth && typeof window.auth.getToken === 'function')
      ? window.auth.getToken()
      : ((typeof window !== 'undefined' && window.auth && window.auth.token) || localStorage.getItem('as_jewellar_token') || '');
    const query = new URLSearchParams({
      action,
      token: token || '',
      ...params
    });

    const url = `${this.endpoint}?${query.toString()}`;

    // If completely offline, return cached or rejected
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { success: false, offline: true, message: 'Network offline. Using local cached data.' };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`API GET [${action}] failed, using local offline store:`, err.message);
      return { success: false, offline: true, message: err.message };
    }
  }

  async post(action, payload = {}) {
    const token = (typeof window !== 'undefined' && window.auth && typeof window.auth.getToken === 'function')
      ? window.auth.getToken()
      : ((typeof window !== 'undefined' && window.auth && window.auth.token) || localStorage.getItem('as_jewellar_token') || '');
    const deviceId = (window.offlineQueue && window.offlineQueue.deviceId) || 'DEVICE-COUNTER-01';
    const idempotencyKey = `IDEMP-${action}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const body = {
      action,
      token,
      data: payload,
      idempotencyKey,
      deviceId,
      timestamp: new Date().toISOString()
    };

    // If offline, enqueue directly into IndexedDB queue
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      if (window.offlineQueue) {
        const queuedItem = await window.offlineQueue.enqueueTransaction(action, payload, idempotencyKey);
        return {
          success: true,
          offlineQueued: true,
          syncStatus: 'PENDING',
          localTxId: queuedItem ? queuedItem.localTxId : null,
          idempotencyKey,
          queuedItem,
          message: 'Saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
        };
      }
      return {
        success: false,
        offline: true,
        message: 'Application is offline. Transaction queued locally.'
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(body),
        redirect: 'follow',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.warn(`API POST [${action}] failed over network. Enqueueing into Offline Queue:`, err.message);

      if (window.offlineQueue) {
        const queuedItem = await window.offlineQueue.enqueueTransaction(action, payload, idempotencyKey);
        return {
          success: true,
          offlineQueued: true,
          syncStatus: 'PENDING',
          localTxId: queuedItem ? queuedItem.localTxId : null,
          idempotencyKey,
          queuedItem,
          message: 'Network disruption. Saved locally in Offline Queue (Status: PENDING - Awaiting Cloud Sync)'
        };
      }

      return { success: false, message: err.message };
    }
  }
}

// Global ApiClient Instance
if (typeof window !== 'undefined') {
  window.api = new ApiClient();
  window.ApiClient = ApiClient;
}
if (typeof global !== 'undefined') {
  global.ApiClient = ApiClient;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ApiClient };
}
