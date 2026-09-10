import NetInfo from '@react-native-community/netinfo';
import {
  checkBackendHealth,
  fetchBackendSyllabus,
  uploadTeacherCorrections,
  SyncCorrectionsPayload,
} from './api';
import {
  getPendingCorrections,
  markCorrectionsSynced,
  getLastSyncTime,
  setLastSyncTime,
} from './database';

export interface SyncResult {
  success: boolean;
  isOnline: boolean;
  backendReachable: boolean;
  syncedAt: string;
  correctionsUploaded: number;
  message: string;
}

let isSyncing = false;

/**
 * Checks if the device has active internet or local network connectivity.
 */
export async function isNetworkConnected(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return Boolean(state.isConnected && (state.isInternetReachable ?? true));
  } catch (err) {
    console.warn('[SyncService] Failed to check network state:', err);
    return false;
  }
}

/**
 * Executes a full two-way synchronization:
 * 1. Checks network connectivity.
 * 2. Pings backend health.
 * 3. Uploads queued offline teacher corrections from SQLite.
 * 4. Checks/updates curriculum metadata from FastAPI backend.
 * 5. Saves last synced timestamp in SQLite settings.
 */
export async function performContentSync(): Promise<SyncResult> {
  if (isSyncing) {
    const lastTime = (await getLastSyncTime()) || new Date().toISOString();
    return {
      success: false,
      isOnline: true,
      backendReachable: true,
      syncedAt: lastTime,
      correctionsUploaded: 0,
      message: 'Sync already in progress.',
    };
  }

  isSyncing = true;
  const now = new Date().toISOString();

  try {
    // 1. Check network connectivity
    const online = await isNetworkConnected();
    if (!online) {
      const lastTime = await getLastSyncTime();
      return {
        success: false,
        isOnline: false,
        backendReachable: false,
        syncedAt: lastTime || 'Never',
        correctionsUploaded: 0,
        message: 'Device is currently offline. Working with local SQLite storage.',
      };
    }

    // 2. Check backend health & CORS connection
    const health = await checkBackendHealth();
    if (!health) {
      const lastTime = await getLastSyncTime();
      return {
        success: false,
        isOnline: true,
        backendReachable: false,
        syncedAt: lastTime || 'Never',
        correctionsUploaded: 0,
        message: 'Backend server unreachable at configured API URL.',
      };
    }

    // 3. Sync pending teacher corrections to backend
    const pendingCorrections = await getPendingCorrections();
    let uploadedCount = 0;

    if (pendingCorrections.length > 0) {
      const payload: SyncCorrectionsPayload[] = pendingCorrections.map((c) => ({
        hindi_text: c.hindi_text,
        original_santali: c.original_santali,
        corrected_santali: c.corrected_santali,
        created_at: c.created_at,
      }));

      const uploadOk = await uploadTeacherCorrections(payload);
      if (uploadOk) {
        const ids = pendingCorrections.map((c) => c.id);
        await markCorrectionsSynced(ids);
        uploadedCount = pendingCorrections.length;
      }
    }

    // 4. Check syllabus updates from backend
    await fetchBackendSyllabus();

    // 5. Update last sync time
    await setLastSyncTime(now);

    return {
      success: true,
      isOnline: true,
      backendReachable: true,
      syncedAt: now,
      correctionsUploaded: uploadedCount,
      message: `Sync successful! ${uploadedCount > 0 ? `${uploadedCount} corrections uploaded. ` : ''}Curriculum up-to-date.`,
    };
  } catch (err: any) {
    console.warn('[SyncService] Sync error:', err);
    const lastTime = await getLastSyncTime();
    return {
      success: false,
      isOnline: false,
      backendReachable: false,
      syncedAt: lastTime || 'Never',
      correctionsUploaded: 0,
      message: `Sync error: ${err?.message || 'Unknown failure'}`,
    };
  } finally {
    isSyncing = false;
  }
}
