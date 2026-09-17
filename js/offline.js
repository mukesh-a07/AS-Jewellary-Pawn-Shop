/**
 * AS JEWELLAR PAWN SHOP - HARDENED OFFLINE-FIRST & BACKGROUND SYNC ENGINE
 * Multi-Tier Storage: ServiceWorker -> IndexedDB (Primary) -> localStorage (Mirror)
 * 5-State Sync Lifecycle: PENDING, SYNCING, SYNCED, FAILED, CONFLICT
 * Guarantees: Strict Idempotency, Zero Duplicates, Conflict Quarantine, Honest Offline Messaging.
 */

const DB_NAME = 'as_jewellar_db';
const DB_VERSION = 3;
const DEVICE_ID_KEY = 'as_jewellar_device_id';

class OfflineDatabase {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  async init() {
    if (typeof indexedDB === 'undefined') {
      return null;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // 1. Transaction Sync Queue Store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', { keyPath: 'localTxId' });
          queueStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          queueStore.createIndex('createdTime', 'createdTime', { unique: false });
          queueStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: true });
          queueStore.createIndex('type', 'type', { unique: false });
        }

        // 2. Customers Store
        if (!db.objectStoreNames.contains('customersStore')) {
          const custStore = db.createObjectStore('customersStore', { keyPath: 'customerId' });
          custStore.createIndex('mobile', 'mobile', { unique: false });
          custStore.createIndex('nameEn', 'nameEn', { unique: false });
        }

        // 3. Pledges Store
        if (!db.objectStoreNames.contains('pledgesStore')) {
          const pledgeStore = db.createObjectStore('pledgesStore', { keyPath: 'ticketNo' });
          pledgeStore.createIndex('customerId', 'customerId', { unique: false });
          pledgeStore.createIndex('packetId', 'packetId', { unique: false });
          pledgeStore.createIndex('status', 'status', { unique: false });
        }

        // 4. Payments Store
        if (!db.objectStoreNames.contains('paymentsStore')) {
          const payStore = db.createObjectStore('paymentsStore', { keyPath: 'paymentId' });
          payStore.createIndex('ticketNo', 'ticketNo', { unique: false });
          payStore.createIndex('customerId', 'customerId', { unique: false });
          payStore.createIndex('idempotencyKey', 'idempotencyKey', { unique: false });
        }

        // 5. Rates Store
        if (!db.objectStoreNames.contains('ratesStore')) {
          db.createObjectStore('ratesStore', { keyPath: 'id' });
        }

        // 6. Conflicts Store (Quarantine)
        if (!db.objectStoreNames.contains('conflictsStore')) {
          const confStore = db.createObjectStore('conflictsStore', { keyPath: 'conflictId' });
          confStore.createIndex('status', 'status', { unique: false });
          confStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.warn('IndexedDB open notice:', e);
        resolve(null);
      };
    });
  }

  async getStore(storeName, mode = 'readonly') {
    await this.initPromise;
    if (!this.db) return null;
    try {
      const tx = this.db.transaction(storeName, mode);
      return tx.objectStore(storeName);
    } catch (e) {
      console.warn(`IndexedDB transaction error for [${storeName}]:`, e);
      return null;
    }
  }

  async putRecord(storeName, record) {
    try {
      const store = await this.getStore(storeName, 'readwrite');
      if (store) {
        return new Promise((resolve) => {
          const req = store.put(record);
          req.onsuccess = () => resolve(true);
          req.onerror = () => resolve(false);
        });
      }
    } catch (e) {}
    return false;
  }

  async getRecord(storeName, key) {
    try {
      const store = await this.getStore(storeName, 'readonly');
      if (store) {
        return new Promise((resolve) => {
          const req = store.get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
        });
      }
    } catch (e) {}
    return null;
  }

  async getAllRecords(storeName) {
    try {
      const store = await this.getStore(storeName, 'readonly');
      if (store) {
        return new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
      }
    } catch (e) {}
    return [];
  }
}

class SyncQueueManager {
  constructor(dbHelper) {
    this.dbHelper = dbHelper;
    this.fallbackStorageKey = 'as_jewellar_sync_queue_fallback';
    this.isSyncing = false;
    this.deviceId = this.getOrCreateDeviceId();
    this.allowedStates = ['PENDING', 'SYNCING', 'SYNCED', 'FAILED', 'CONFLICT'];
  }

  getOrCreateDeviceId() {
    try {
      if (typeof localStorage !== 'undefined') {
        let devId = localStorage.getItem(DEVICE_ID_KEY);
        if (!devId) {
          devId = `DEV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
          localStorage.setItem(DEVICE_ID_KEY, devId);
        }
        return devId;
      }
    } catch (e) {}
    return 'DEV-COUNTER-LOCAL';
  }

  /**
   * Enqueue Offline Transaction with Strict Idempotency & De-duplication
   */
  async enqueueTransaction(type, payload = {}, customIdempotencyKey = null) {
    const timestamp = new Date().toISOString();
    const uniqueSuffix = Math.random().toString(36).substr(2, 7).toUpperCase();
    const localTxId = `LOCAL-TX-${Date.now()}-${uniqueSuffix}`;
    const idempotencyKey = customIdempotencyKey || payload.idempotencyKey || `IDEMP-${type}-${Date.now()}-${uniqueSuffix}`;

    // De-duplication check: if identical idempotencyKey already queued, return existing item
    const existingQueue = await this.getAllQueue();
    const duplicate = existingQueue.find(i => i.idempotencyKey === idempotencyKey);
    if (duplicate) {
      console.warn(`[SyncQueue] Duplicate transaction detected with key: ${idempotencyKey}. Returning existing queued record.`);
      return duplicate;
    }

    const queueItem = {
      localTxId,
      serverTxId: null,
      idempotencyKey,
      createdTimestamp: timestamp,
      createdTime: timestamp,
      retryCount: 0,
      deviceId: this.deviceId,
      syncStatus: 'PENDING', // PENDING, SYNCING, SYNCED, FAILED, CONFLICT
      type,
      payload,
      errorMessage: null
    };

    // 1. Save to IndexedDB
    try {
      const store = await this.dbHelper.getStore('syncQueue', 'readwrite');
      if (store) {
        await new Promise((resolve, reject) => {
          const req = store.add(queueItem);
          req.onsuccess = () => resolve();
          req.onerror = (e) => reject(e);
        });
      }
    } catch (err) {
      console.warn('Queue add to IndexedDB error, mirroring to localStorage:', err);
    }

    // 2. Synchronous Mirror to LocalStorage
    const list = this.getFallbackQueue();
    list.unshift(queueItem);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.fallbackStorageKey, JSON.stringify(list));
      }
    } catch (e) {}

    // 3. Dispatch queue changed event
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('offlineQueueChanged', { detail: { item: queueItem } }));
    }

    // 4. Auto trigger sync if online
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      setTimeout(() => this.syncQueue(), 300);
    }

    return queueItem;
  }

  getFallbackQueue() {
    try {
      if (typeof localStorage !== 'undefined') {
        const s = localStorage.getItem(this.fallbackStorageKey);
        return s ? JSON.parse(s) : [];
      }
    } catch (e) {
      return [];
    }
    return [];
  }

  /**
   * Get All Queued Items across IndexedDB and localStorage
   */
  async getAllQueue() {
    try {
      const store = await this.dbHelper.getStore('syncQueue', 'readonly');
      if (store) {
        const idbItems = await new Promise((resolve) => {
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => resolve([]);
        });
        if (idbItems && idbItems.length > 0) return idbItems;
      }
    } catch (e) {}
    return this.getFallbackQueue();
  }

  /**
   * Get Queue Statistics (pending, syncing, failed, conflict, synced)
   */
  async getQueueStats() {
    const all = await this.getAllQueue();
    return {
      total: all.length,
      pending: all.filter(i => i.syncStatus === 'PENDING').length,
      syncing: all.filter(i => i.syncStatus === 'SYNCING').length,
      failed: all.filter(i => i.syncStatus === 'FAILED').length,
      conflict: all.filter(i => i.syncStatus === 'CONFLICT').length,
      synced: all.filter(i => i.syncStatus === 'SYNCED').length
    };
  }

  async getItem(localTxId) {
    const all = await this.getAllQueue();
    return all.find(i => i.localTxId === localTxId) || null;
  }

  getQueueCount() {
    const list = this.getFallbackQueue();
    return list.filter(i => i.syncStatus === 'PENDING' || i.syncStatus === 'FAILED').length;
  }

  /**
   * Process & Synchronize Pending Offline Transactions
   * @param {boolean} forceAll If true, resets failed items and retries all
   */
  async syncQueue(forceAll = false) {
    if (this.isSyncing) return { status: 'ALREADY_SYNCING' };
    if (typeof navigator !== 'undefined' && !navigator.onLine) return { status: 'OFFLINE' };

    this.isSyncing = true;
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: { status: 'SYNCING' } }));
    }

    const items = await this.getAllQueue();
    let pendingItems = items.filter(i => i.syncStatus === 'PENDING' || (i.syncStatus === 'FAILED' && i.retryCount < 5));

    if (forceAll || pendingItems.length === 0) {
      // If forceAll or no pending, reset and retry any FAILED items as well
      const failedItems = items.filter(i => i.syncStatus === 'FAILED');
      for (const f of failedItems) {
        f.syncStatus = 'PENDING';
        f.retryCount = 0;
        await this.updateQueueItem(f);
      }
      pendingItems = items.filter(i => i.syncStatus === 'PENDING');
    }

    let syncedCount = 0;
    let failedCount = 0;
    let conflictCount = 0;

    for (const item of pendingItems) {
      try {
        item.syncStatus = 'SYNCING';
        await this.updateQueueItem(item);

        const response = await this.postToServer(item);

        if (response && response.success) {
          item.syncStatus = 'SYNCED';
          item.serverTxId = response.data?.serverTxId || response.data?.ticketNo || response.data?.paymentId || response.data?.customerId || response.data?.receiptNo || 'SERVER-ACK';
          item.errorMessage = null;
          syncedCount++;
        } else if (response && (response.code === 'CONFLICT' || response.status === 'CONFLICT')) {
          // Conflict Quarantine - Never silently overwrite or discard
          item.syncStatus = 'CONFLICT';
          item.errorMessage = response.message || 'Business data conflict detected on server';
          conflictCount++;
          await this.quarantineConflict(item, response);
        } else {
          item.syncStatus = 'FAILED';
          item.retryCount = (item.retryCount || 0) + 1;
          item.errorMessage = (response && response.message) || 'Sync server error';
          failedCount++;
        }
      } catch (networkErr) {
        item.syncStatus = 'FAILED';
        item.retryCount = (item.retryCount || 0) + 1;
        item.errorMessage = networkErr.message || 'Network timeout';
        failedCount++;
      }

      await this.updateQueueItem(item);
    }

    this.isSyncing = false;
    const finalStats = await this.getQueueStats();
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('syncStatusChanged', { detail: { status: 'COMPLETED', stats: finalStats } }));
    }

    return {
      syncedCount,
      failedCount,
      conflictCount,
      stats: finalStats
    };
  }

  /**
   * Retry all failed transactions immediately
   */
  async retryFailed() {
    return this.syncQueue(true);
  }

  async postToServer(item) {
    const token = (typeof window !== 'undefined' && window.auth) ? window.auth.getToken() : null;
    const endpoint = (typeof window !== 'undefined' && window.api)
      ? window.api.endpoint
      : (typeof localStorage !== 'undefined' ? localStorage.getItem('as_jewellar_api_endpoint') : '') || 'https://script.google.com/macros/s/AKfycbw6fWoHIhQxVRHEoTVwoMIe5pPA8B17ClwYL4lpJl1oB8kOXHHrF-snXRICsgZbGOJu/exec';

    const body = {
      action: 'syncTransaction',
      token,
      data: item,
      idempotencyKey: item.idempotencyKey,
      deviceId: item.deviceId || this.deviceId,
      localTxId: item.localTxId,
      timestamp: item.createdTimestamp
    };

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 8000) : null;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(body),
        redirect: 'follow',
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      return await res.json();
    } catch (e) {
      if (timeoutId) clearTimeout(timeoutId);
      throw e;
    }
  }

  async updateQueueItem(item) {
    // 1. Update in IndexedDB
    try {
      const store = await this.dbHelper.getStore('syncQueue', 'readwrite');
      if (store) {
        await new Promise((resolve) => {
          const req = store.put(item);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }
    } catch (e) {}

    // 2. Update in localStorage fallback
    const list = this.getFallbackQueue();
    const idx = list.findIndex(i => i.localTxId === item.localTxId);
    if (idx !== -1) {
      list[idx] = item;
    } else {
      list.unshift(item);
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.fallbackStorageKey, JSON.stringify(list));
      }
    } catch (e) {}

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('offlineQueueItemUpdated', { detail: { item } }));
    }
  }

  async quarantineConflict(item, serverResponse) {
    const conflictRecord = {
      conflictId: `CONF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      localTxId: item.localTxId,
      idempotencyKey: item.idempotencyKey,
      type: item.type,
      localPayload: item.payload,
      serverResponse,
      timestamp: new Date().toISOString(),
      conflictStatus: 'UNRESOLVED' // UNRESOLVED, RESOLVED_LOCAL, RESOLVED_SERVER, DISCARDED
    };

    try {
      const store = await this.dbHelper.getStore('conflictsStore', 'readwrite');
      if (store) {
        store.put(conflictRecord);
      }
    } catch (e) {}
  }

  async clearSynced() {
    const items = await this.getAllQueue();
    const remaining = items.filter(i => i.syncStatus !== 'SYNCED');

    try {
      const store = await this.dbHelper.getStore('syncQueue', 'readwrite');
      if (store) {
        store.clear();
        remaining.forEach(item => store.add(item));
      }
    } catch (e) {}

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.fallbackStorageKey, JSON.stringify(remaining));
      }
    } catch (e) {}

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent('offlineQueueChanged', { detail: { action: 'CLEARED_SYNCED' } }));
    }
  }

  async retryFailed() {
    const items = await this.getAllQueue();
    for (const item of items) {
      if (item.syncStatus === 'FAILED') {
        item.syncStatus = 'PENDING';
        item.retryCount = 0;
        await this.updateQueueItem(item);
      }
    }
    return this.syncQueue();
  }
}

class OfflineManager {
  constructor(syncQueueInstance = null) {
    this.dbHelper = new OfflineDatabase();
    this.queue = syncQueueInstance || new SyncQueueManager(this.dbHelper);
    this.initListeners();
  }

  initListeners() {
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('online', () => {
        this.updateOnlineStatus(true);
        this.queue.syncQueue();
      });

      window.addEventListener('offline', () => {
        this.updateOnlineStatus(false);
      });

      window.addEventListener('syncStatusChanged', (e) => {
        this.updateBadgeFromStatus(e.detail);
      });

      // Periodic check every 60 seconds
      setInterval(() => {
        if (typeof navigator !== 'undefined' && navigator.onLine && !this.queue.isSyncing) {
          this.queue.syncQueue();
        }
      }, 60000);
    }
  }

  getSyncStateSummary(isOnlineOverride) {
    const isOnline = isOnlineOverride !== undefined ? isOnlineOverride : ((typeof navigator !== 'undefined') ? navigator.onLine : true);
    const queueList = this.queue ? this.queue.getFallbackQueue() : [];
    const pending = queueList.filter(i => i.syncStatus === 'PENDING').length;
    const syncing = queueList.filter(i => i.syncStatus === 'SYNCING').length;
    const failed = queueList.filter(i => i.syncStatus === 'FAILED').length;
    const conflict = queueList.filter(i => i.syncStatus === 'CONFLICT').length;
    const totalQueued = pending + syncing + failed + conflict;

    if (!isOnline) {
      const qText = totalQueued > 0 ? ` (${totalQueued} Queued)` : '';
      return {
        state: 'OFFLINE',
        label: `🟠 Offline${qText}`,
        badgeClass: 'badge-warning',
        color: '#F59E0B'
      };
    }

    if (syncing > 0) {
      return {
        state: 'SYNCING',
        label: `🔄 Syncing (${syncing})...`,
        badgeClass: 'badge-info',
        color: '#3B82F6'
      };
    }

    if (pending > 0) {
      return {
        state: 'PENDING_SYNC',
        label: `🔄 Pending Sync (${pending})`,
        badgeClass: 'badge-info',
        color: '#F59E0B'
      };
    }

    if (failed > 0 || conflict > 0) {
      return {
        state: 'SYNC_ERROR',
        label: `⚠️ Sync Error (${failed + conflict})`,
        badgeClass: 'badge-danger',
        color: '#EF4444'
      };
    }

    return {
      state: 'ONLINE',
      label: '🟢 Online',
      badgeClass: 'badge-success',
      color: '#10B981'
    };
  }

  updateOnlineStatus(isOnline) {
    this.queue.getQueueStats().then(stats => {
      this.renderConnectivityIndicator(isOnline, stats);
    });
  }

  async renderConnectivityIndicator(isOnline, stats) {
    const badges = document.querySelectorAll('.network-status-badge, #globalNetworkBadge, .connection-pill');
    
    badges.forEach(el => {
      if (!isOnline) {
        const pendingText = stats.pending > 0 ? ` (${stats.pending} Queued)` : '';
        el.className = 'connection-pill offline';
        el.innerHTML = `<div class="status-dot" style="background:#F59E0B;"></div><span>🟠 Offline${pendingText}</span>`;
        el.title = 'Offline: All transactions saved in secure local storage (Pending Cloud Sync)';
      } else if (stats.syncing > 0) {
        el.className = 'connection-pill';
        el.innerHTML = `<div class="status-dot" style="background:#3B82F6;"></div><span>🔄 Syncing (${stats.syncing})...</span>`;
        el.title = 'Syncing local transactions with cloud server';
      } else if (stats.pending > 0) {
        el.className = 'connection-pill';
        el.innerHTML = `<div class="status-dot" style="background:#F59E0B;"></div><span>🔄 Pending Sync (${stats.pending})</span>`;
        el.title = `${stats.pending} transactions queued for cloud sync`;
      } else if (stats.failed > 0 || stats.conflict > 0) {
        el.className = 'connection-pill offline';
        el.innerHTML = `<div class="status-dot" style="background:#EF4444;"></div><span>⚠️ Sync Error (${stats.failed + stats.conflict})</span>`;
        el.title = 'Some transactions encountered sync issues';
      } else {
        el.className = 'connection-pill';
        el.innerHTML = `<div class="status-dot" style="background:#10B981;"></div><span>🟢 Online</span>`;
        el.title = 'Connected to cloud server';
      }
    });
  }

  updateBadgeFromStatus(detail) {
    if (detail.status === 'SYNCING') {
      document.querySelectorAll('.connection-pill, .network-status-badge').forEach(el => {
        el.innerHTML = `<div class="status-dot" style="background:#3B82F6;"></div><span>🔄 Syncing...</span>`;
      });
    } else if (detail.status === 'COMPLETED') {
      const isOnline = (typeof navigator !== 'undefined') ? navigator.onLine : true;
      this.updateOnlineStatus(isOnline);
    }
  }
}

// Global Instances
if (typeof window !== 'undefined') {
  window.offlineDb = new OfflineDatabase();
  window.offlineQueue = new SyncQueueManager(window.offlineDb);
  window.syncQueueManager = window.offlineQueue;
  window.offlineManager = new OfflineManager(window.offlineQueue);
}

// Export for Node.js test environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    OfflineDatabase,
    SyncQueueManager,
    OfflineManager
  };
}
