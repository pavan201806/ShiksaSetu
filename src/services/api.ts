import axios from 'axios';
import { getCustomApiUrl } from './database';

export const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000';
let activeApiBaseUrl = DEFAULT_API_BASE_URL;

export const apiClient = axios.create({
  baseURL: activeApiBaseUrl,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const API_BASE_URL = DEFAULT_API_BASE_URL;

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
  let clean = url.trim();
  if (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `http://${clean}`;
  }
  activeApiBaseUrl = clean;
  apiClient.defaults.baseURL = clean;
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
  return activeApiBaseUrl;
}

/**
 * Probes the target server endpoint to test reachability and CORS response.
 */
export async function testApiConnection(
  targetUrl?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  const url = targetUrl ? targetUrl.trim() : activeApiBaseUrl;
  let formattedUrl = url;
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `http://${formattedUrl}`;
  }
  if (formattedUrl.endsWith('/')) {
    formattedUrl = formattedUrl.slice(0, -1);
  }

  try {
    const resp = await axios.get(`${formattedUrl}/`, {
      timeout: 4000,
      headers: { Accept: 'application/json' },
    });
    if (resp.status === 200 && resp.data) {
      return { success: true, data: resp.data };
    }
    return { success: false, error: `Server returned HTTP status ${resp.status}` };
  } catch (err: any) {
    return {
      success: false,
      error: err.code === 'ECONNABORTED'
        ? 'Connection timed out (4s)'
        : err.message || 'Connection failed',
    };
  }
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
