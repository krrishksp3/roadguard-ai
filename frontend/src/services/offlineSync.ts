import { api } from './api';
import { SyncStatus } from '../../../shared/types';

export interface OfflineDraftReport {
  id: string; // clientReportId (UUID)
  imageUrl: string; // data URL or local URL for preview
  photoBase64?: string; // base64 data to upload when reconnected
  evidenceSource: 'USER_UPLOADED' | 'LICENSED_EXTERNAL' | 'DEMO_SYNTHETIC';
  imageFilename: string;
  imageMimeType?: string;
  latitude: number;
  longitude: number;
  address: string;
  description: string;
  damageTypeHint: string;
  createdAt: string;
  status: SyncStatus;
  syncAttempts: number;
  lastError?: string;
}

const DB_NAME = 'roadguard_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_reports';

type SyncSubscriber = (pendingCount: number, isSyncing: boolean) => void;
const subscribers = new Set<SyncSubscriber>();

function notifySubscribers(count: number, isSyncing: boolean) {
  subscribers.forEach((fn) => fn(count, isSyncing));
}

let isSyncingActive = false;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineSync = {
  subscribe(fn: SyncSubscriber): () => void {
    subscribers.add(fn);
    this.getPendingCount().then((count) => fn(count, isSyncingActive));
    return () => subscribers.delete(fn);
  },

  async getPendingCount(): Promise<number> {
    try {
      const reports = await this.getPendingReports();
      return reports.filter((r) => r.status !== 'SYNCED').length;
    } catch {
      return 0;
    }
  },

  async saveOfflineReport(draft: OfflineDraftReport): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(draft);

      req.onsuccess = async () => {
        const count = await this.getPendingCount();
        notifySubscribers(count, isSyncingActive);
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getPendingReports(): Promise<OfflineDraftReport[]> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch {
      return [];
    }
  },

  async deleteOfflineReport(id: string): Promise<void> {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(id);

        req.onsuccess = async () => {
          const count = await this.getPendingCount();
          notifySubscribers(count, isSyncingActive);
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore cleanup error
    }
  },

  async updateReportStatus(id: string, status: SyncStatus, lastError?: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const record = getReq.result as OfflineDraftReport | undefined;
        if (!record) {
          resolve();
          return;
        }

        record.status = status;
        record.syncAttempts += 1;
        if (lastError) record.lastError = lastError;

        store.put(record).onsuccess = async () => {
          const count = await this.getPendingCount();
          notifySubscribers(count, isSyncingActive);
          resolve();
        };
      };
      getReq.onerror = () => reject(getReq.error);
    });
  },

  /**
   * Synchronize pending reports when internet connectivity is restored
   */
  async syncPendingReports(): Promise<{ synced: number; failed: number }> {
    if (isSyncingActive || !navigator.onLine) {
      return { synced: 0, failed: 0 };
    }

    const pending = await this.getPendingReports();
    const activeQueue = pending.filter((r) => r.status === 'PENDING_SYNC' || r.status === 'FAILED');

    if (activeQueue.length === 0) {
      return { synced: 0, failed: 0 };
    }

    isSyncingActive = true;
    notifySubscribers(activeQueue.length, true);

    let synced = 0;
    let failed = 0;

    for (const draft of activeQueue) {
      try {
        await this.updateReportStatus(draft.id, 'SYNCING');

        let finalImageUrl = draft.imageUrl;

        // If photoBase64 exists, upload it as genuine evidence file
        if (draft.photoBase64 && draft.photoBase64.startsWith('data:')) {
          try {
            const res = await fetch(draft.photoBase64);
            const blob = await res.blob();
            const file = new File([blob], draft.imageFilename || 'road_evidence.jpg', {
              type: draft.imageMimeType || 'image/jpeg',
            });
            const uploadRes = await api.uploadImage(file);
            finalImageUrl = uploadRes.url;
          } catch (uploadErr) {
            console.warn('[OfflineSync] Could not upload image file separately, falling back to stored URI:', uploadErr);
          }
        }

        // Submit report with idempotency clientReportId
        await api.createReport({
          clientReportId: draft.id,
          imageUrl: finalImageUrl,
          evidenceSource: draft.evidenceSource,
          imageFilename: draft.imageFilename,
          imageMimeType: draft.imageMimeType,
          latitude: draft.latitude,
          longitude: draft.longitude,
          address: draft.address,
          description: draft.description,
          damageTypeHint: draft.damageTypeHint,
        });

        // Remove from offline queue upon successful sync
        await this.deleteOfflineReport(draft.id);
        synced++;
      } catch (err: any) {
        console.error(`[OfflineSync] Sync failed for draft ${draft.id}:`, err);
        await this.updateReportStatus(draft.id, 'FAILED', err.message || 'Network sync error');
        failed++;
      }
    }

    isSyncingActive = false;
    const remainingCount = await this.getPendingCount();
    notifySubscribers(remainingCount, false);

    return { synced, failed };
  },
};

// Automatic listener for online event
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Connectivity restored. Attempting background sync...');
    offlineSync.syncPendingReports().then((res) => {
      if (res.synced > 0) {
        console.log(`[OfflineSync] Successfully synced ${res.synced} offline road report(s).`);
      }
    });
  });
}
