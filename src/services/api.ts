import axios from 'axios';
import { getCustomApiUrl } from './database';

export const DEFAULT_API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://shiksasetu.onrender.com';
let activeApiBaseUrl = DEFAULT_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: activeApiBaseUrl,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Log outgoing requests with full final URL
apiClient.interceptors.request.use((config) => {
  const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
  console.log(`[API Client] → ${config.method?.toUpperCase()} ${fullUrl}`);
  return config;
});

// Log incoming responses
apiClient.interceptors.response.use(
  (response) => {
    const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
    console.log(`[API Client] ← ${response.status} from ${fullUrl}`);
    return response;
  },
  (error) => {
    const fullUrl = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
    const status = error.response?.status || error.code || 'NO_RESPONSE';
    console.warn(`[API Client] ✖ [${status}] for ${fullUrl}:`, error.message);
    return Promise.reject(error);
  }
);

export const API_BASE_URL = DEFAULT_API_BASE_URL;

/**
 * Normalizes an API URL, trimming whitespace, removing trailing slashes,
 * applying appropriate protocol (https:// for cloud/render, http:// for local IPs),
 * and upgrading insecure Render endpoints to https://.
 */
export function normalizeApiUrl(rawUrl: string): string {
  let clean = (rawUrl || '').trim().replace(/[\u200B-\u200D\uFEFF]/g, '');
  if (!clean) return DEFAULT_API_BASE_URL;

  // Remove trailing slashes
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  // Prepend protocol if missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    const isLocal = /^(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)/i.test(clean);
    clean = isLocal ? `http://${clean}` : `https://${clean}`;
  }

  // Render requires https
  if (clean.includes('.onrender.com') && clean.startsWith('http://')) {
    clean = clean.replace('http://', 'https://');
  }

  return clean;
}

/**
 * Returns the currently active API Base URL.
 */
export function getEffectiveApiUrl(): string {
  return activeApiBaseUrl;
}

/**
 * Updates the active API Base URL at runtime and reconfigures the Axios client.
 */
export function setEffectiveApiUrl(url: string): string {
  const clean = normalizeApiUrl(url);
  activeApiBaseUrl = clean;
  apiClient.defaults.baseURL = clean;
  console.log(`[API Config] Active API Base URL set to: ${clean}`);
  return clean;
}

/**
 * Initializes the API base URL from SQLite settings if configured by the teacher.
 */
export async function initApiBaseUrl(): Promise<string> {
  try {
    const custom = await getCustomApiUrl();
    if (custom && custom.trim()) {
      return setEffectiveApiUrl(custom);
    }
  } catch (e) {
    console.warn('[API] Could not load custom API URL from database:', e);
  }
  return setEffectiveApiUrl(activeApiBaseUrl);
}

export interface TestConnectionResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
  finalUrl: string;
  elapsedMs: number;
}

/**
 * Probes the target server endpoint to test reachability with cold-start resilience.
 * - Overall timeout budget: up to 60 seconds across attempts.
 * - Automatic retry if Render free tier instance is spinning up.
 * - Emits real-time progress callbacks for the UI.
 * - Logs detailed start, elapsed time, status, body, and exceptions.
 */
export async function testApiConnection(
  targetUrl?: string,
  onProgress?: (message: string) => void
): Promise<TestConnectionResult> {
  const cleanBase = normalizeApiUrl(targetUrl || activeApiBaseUrl);
  const probeUrl = `${cleanBase}/`;

  console.log('[API Test] Initiating probe to:');
  console.log(probeUrl);

  const maxAttempts = 2;
  const timeouts = [25000, 35000]; // 25s attempt 1, 35s attempt 2 (total 60s budget)
  let lastError = '';
  let lastStatus: number | undefined;
  const totalStartTime = Date.now();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptTimeout = timeouts[attempt - 1];
    const attemptStartTime = Date.now();

    console.log(
      `[API Test] Request started at: ${new Date().toISOString()} (Attempt ${attempt}/${maxAttempts}, timeout: ${attemptTimeout / 1000}s)`
    );

    if (attempt > 1 && onProgress) {
      onProgress('Backend is waking up. Retrying...');
    }

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), attemptTimeout);

      const resp = await fetch(probeUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache',
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      const elapsedMs = Date.now() - attemptStartTime;
      console.log(`[API Test] Response status: ${resp.status}`);
      console.log(`[API Test] Final URL: ${probeUrl}`);
      console.log(`[API Test] Elapsed time: ${elapsedMs}ms`);

      if (resp.ok) {
        let body: any = null;
        try {
          body = await resp.json();
        } catch {
          body = { status: 'ok' };
        }
        console.log('[API Test] Response body:', body);

        return {
          success: true,
          status: resp.status,
          data: body,
          finalUrl: cleanBase,
          elapsedMs: Date.now() - totalStartTime,
        };
      }

      // If server returned 502, 503, 504 on attempt 1, Render may be in the middle of boot
      lastStatus = resp.status;
      let errBody = '';
      try {
        errBody = await resp.text();
      } catch {}
      console.log('[API Test] Response body (Error):', errBody.slice(0, 200));

      if (
        (resp.status === 502 || resp.status === 503 || resp.status === 504) &&
        attempt < maxAttempts
      ) {
        console.log(
          `[API Test] Gateway ${resp.status} received. Render instance is spinning up. Waiting before retry...`
        );
        if (onProgress) {
          onProgress('Backend is waking up. Retrying...');
        }
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }

      return {
        success: false,
        status: resp.status,
        error: `Server returned HTTP ${resp.status} ${resp.statusText || ''}${
          errBody ? ` - ${errBody.slice(0, 80)}` : ''
        }`.trim(),
        finalUrl: cleanBase,
        elapsedMs: Date.now() - totalStartTime,
      };
    } catch (err: any) {
      const elapsedMs = Date.now() - attemptStartTime;
      console.warn(`[API Test] Actual exception on attempt ${attempt} (${elapsedMs}ms):`, err);

      const isTimeout =
        err?.name === 'AbortError' || err?.message?.toLowerCase().includes('timeout');
      const errStr = (err?.message || '').toLowerCase();
      const isSsl =
        errStr.includes('cert') ||
        errStr.includes('ssl') ||
        errStr.includes('tls') ||
        errStr.includes('trust anchor');
      const isDns =
        errStr.includes('enotfound') || errStr.includes('getaddrinfo') || errStr.includes('dns');

      if (isTimeout) {
        lastError = `Connection timed out after ${attemptTimeout / 1000}s`;
        if (attempt < maxAttempts) {
          console.log('[API Test] Timeout on first attempt. Render is likely waking up from sleep. Retrying...');
          if (onProgress) {
            onProgress('Backend is waking up. Retrying...');
          }
          await new Promise((r) => setTimeout(r, 1000));
          continue;
        } else {
          lastError = `Connection timed out (60s total). The Render free tier instance is taking longer than usual to wake up. Please tap Test & Save again in a moment.`;
        }
      } else if (isSsl) {
        lastError = `SSL/TLS certificate error (${err.message}). Ensure device date and time are set automatically.`;
        break; // Do not retry SSL errors
      } else if (isDns) {
        lastError = `DNS lookup failed for ${cleanBase}. Check internet connection.`;
        break; // Do not retry fatal DNS errors
      } else {
        lastError = `Network connection failed: ${err?.message || 'Unable to reach host'}`;
        if (attempt < maxAttempts) {
          if (onProgress) {
            onProgress('Backend is waking up. Retrying...');
          }
          await new Promise((r) => setTimeout(r, 1500));
          continue;
        }
      }
    }
  }

  // Final fallback to Axios if fetch threw unexpected error
  try {
    console.log(`[API Test] Running final verification probe with Axios: ${probeUrl}`);
    const axiosStart = Date.now();
    const axiosResp = await axios.get(probeUrl, {
      timeout: 15000,
      headers: { Accept: 'application/json' },
    });
    const axiosElapsed = Date.now() - axiosStart;

    console.log(`[API Test] Response status: ${axiosResp.status}`);
    console.log('[API Test] Response body:', axiosResp.data);
    console.log(`[API Test] Final URL: ${probeUrl}`);
    console.log(`[API Test] Elapsed time: ${axiosElapsed}ms`);

    if (axiosResp.status >= 200 && axiosResp.status < 300) {
      return {
        success: true,
        status: axiosResp.status,
        data: axiosResp.data,
        finalUrl: cleanBase,
        elapsedMs: Date.now() - totalStartTime,
      };
    }
  } catch (axiosErr: any) {
    console.warn('[API Test] Final Axios probe failed:', axiosErr?.message);
    if (axiosErr?.response) {
      lastStatus = axiosErr.response.status;
      lastError = `Server returned HTTP ${axiosErr.response.status}: ${JSON.stringify(
        axiosErr.response.data || axiosErr.response.statusText
      )}`;
    }
  }

  return {
    success: false,
    status: lastStatus,
    error: lastError || 'Could not connect to backend server.',
    finalUrl: cleanBase,
    elapsedMs: Date.now() - totalStartTime,
  };
}


export interface BackendClassSummary {
  class_id: number;
  name: string;
  description: string;
  subjects: string[];
}

export interface BackendSyllabusResponse {
  classes: BackendClassSummary[];
}

export interface BackendLessonResponse {
  class_id: number;
  class_name: string;
  subject: string;
  chapter_id: string;
  chapter_title: string;
  lesson: {
    id: string;
    title: string;
    content: string;
    santaliContent?: string;
  };
}

export interface SyncCorrectionsPayload {
  hindi_text: string;
  original_santali: string;
  corrected_santali: string;
  created_at?: string;
}

export interface WorksheetGeneratePayload {
  classId: number;
  subject: string;
  topic: string;
  existingEnglishContent?: string;
}

export interface WorksheetGenerateResponse {
  id: string;
  classId: number;
  subject: string;
  topic: string;
  title: string;
  englishContent: string;
  santaliContent: string;
  source: string;
  createdAt: string;
}

/**
 * Health check endpoint test.
 */
export async function checkBackendHealth(): Promise<{ status: string; app: string } | null> {
  try {
    const response = await apiClient.get('/');
    return response.data;
  } catch (err: any) {
    console.warn('[API] Health check failed:', err.message);
    return null;
  }
}

/**
 * Fetches high-level curriculum syllabus list from FastAPI backend.
 */
export async function fetchBackendSyllabus(): Promise<BackendSyllabusResponse | null> {
  try {
    const response = await apiClient.get('/syllabus');
    return response.data;
  } catch (err: any) {
    console.warn('[API] Failed to fetch syllabus from backend:', err.message);
    return null;
  }
}

/**
 * Fetches full curriculum for a single class.
 */
export async function fetchBackendClassSyllabus(classId: number): Promise<any | null> {
  try {
    const response = await apiClient.get(`/syllabus/${classId}`);
    return response.data;
  } catch (err: any) {
    console.warn(`[API] Failed to fetch class ${classId} syllabus:`, err.message);
    return null;
  }
}

/**
 * Uploads teacher translation corrections to the backend store.
 */
export async function uploadTeacherCorrections(corrections: SyncCorrectionsPayload[]): Promise<boolean> {
  try {
    const response = await apiClient.post('/teacher/corrections', {
      corrections,
    });
    return response.data?.status === 'success';
  } catch (err: any) {
    console.warn('[API] Failed to upload teacher corrections to backend:', err.message);
    return false;
  }
}

/**
 * Requests on-demand AI bilingual worksheet generation from FastAPI backend.
 */
export async function generateWorksheet(
  payload: WorksheetGeneratePayload
): Promise<WorksheetGenerateResponse> {
  const response = await apiClient.post<WorksheetGenerateResponse>('/worksheets/generate', payload, {
    timeout: 25000,
  });
  return response.data;
}
