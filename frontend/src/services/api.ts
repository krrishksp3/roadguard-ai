import {
  RoadReport,
  User,
  RoadSegment,
  TenderRecord,
  RepairVerification,
  AnalyticsSummary,
  ComplaintStatus,
} from '../../../shared/types';

export function getBaseApiUrl(): string {
  const raw = (import.meta.env.VITE_API_URL || '').trim();

  // If in browser environment
  if (typeof window !== 'undefined') {
    const isRender = window.location.hostname.includes('onrender.com');
    // If deployed on Render and VITE_API_URL is missing or set to localhost/internal host
    if (isRender) {
      if (!raw || raw.includes('localhost') || raw.includes('127.0.0.1')) {
        return 'https://roadguard-backend-ghhb.onrender.com/api';
      }
    }
  }

  if (!raw) {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://localhost:5000/api';
    }
    return '/api';
  }

  let clean = raw.replace(/\/+$/, '');

  // If internal Render host was passed without .onrender.com (e.g. roadguard-backend-ghhb)
  if (!clean.includes('.') && clean.includes('roadguard-backend')) {
    clean = `https://${clean}.onrender.com`;
  } else if (!clean.startsWith('http://') && !clean.startsWith('https://') && !clean.startsWith('/')) {
    clean = `https://${clean}`;
  }

  // Handle case where https://roadguard-backend-ghhb was passed without TLD
  try {
    if (clean.startsWith('http://') || clean.startsWith('https://')) {
      const urlObj = new URL(clean);
      if (!urlObj.hostname.includes('.') && urlObj.hostname.includes('roadguard-backend')) {
        urlObj.hostname = `${urlObj.hostname}.onrender.com`;
        clean = urlObj.toString().replace(/\/+$/, '');
      }
    }
  } catch (_) {
    // Ignore URL parse error
  }

  return clean.endsWith('/api') ? clean : `${clean}/api`;
}

export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  if (url.startsWith('/demo-evidence') || url.startsWith('demo-evidence')) {
    return url.startsWith('/') ? url : `/${url}`;
  }
  const backendRoot = getBaseApiUrl().replace(/\/api\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendRoot}${cleanPath}`;
}

const API_BASE_URL = getBaseApiUrl();

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('roadguard_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    return json.data;
  },

  async register(data: { name: string; email: string; password: string; role?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    return json.data;
  },

  async getProfile(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch profile');
    return json.data;
  },

  // Reports
  async getAllReports(params?: { status?: string; severity?: string; search?: string }): Promise<{ data: RoadReport[]; meta: any }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/reports?${query.toString()}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch reports');
    return { data: json.data, meta: json.meta };
  },

  async getReportById(id: string): Promise<RoadReport> {
    const res = await fetch(`${API_BASE_URL}/reports/${id}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch report');
    return json.data;
  },

  async getMyReports(): Promise<RoadReport[]> {
    const res = await fetch(`${API_BASE_URL}/reports/my-reports`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch my reports');
    return json.data;
  },

  // File Uploads
  async uploadImage(file: File): Promise<{ url: string; filename: string; mimeType: string; size: number }> {
    const formData = new FormData();
    formData.append('photo', file);
    const token = localStorage.getItem('roadguard_token');
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${API_BASE_URL}/uploads`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Image upload failed');
    return json.data;
  },

  async createReport(payload: {
    clientReportId?: string;
    imageUrl: string;
    evidenceSource?: 'USER_UPLOADED' | 'LICENSED_EXTERNAL' | 'DEMO_SYNTHETIC';
    evidenceSourceMetadata?: string;
    imageFilename?: string;
    imageMimeType?: string;
    latitude: number;
    longitude: number;
    description: string;
    damageTypeHint?: string;
    address?: string;
  }): Promise<RoadReport> {
    const res = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit report');
    return json.data;
  },

  async updateReportStatus(
    id: string,
    status: ComplaintStatus,
    notes?: string
  ): Promise<RoadReport> {
    const res = await fetch(`${API_BASE_URL}/reports/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update status');
    return json.data;
  },

  // After-Repair Photo Upload
  async uploadAfterRepairPhoto(
    reportId: string,
    afterImageUrl: string,
    notes?: string
  ): Promise<RoadReport> {
    const res = await fetch(`${API_BASE_URL}/reports/${reportId}/after-photo`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ afterImageUrl, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to save after-repair photo');
    return json.data;
  },

  // Verification
  async runRepairVerification(reportId: string, afterImageUrl: string, notes?: string): Promise<RepairVerification> {
    const res = await fetch(`${API_BASE_URL}/verification/run`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reportId, afterImageUrl, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to run repair verification');
    return json.data;
  },

  async submitAuthorityDecision(
    reportId: string,
    decision: 'APPROVED' | 'REJECTED_REINSPECT',
    notes?: string
  ): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/verification/${reportId}/decision`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ decision, notes }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to submit decision');
    return json.data;
  },

  // Road Health & Tenders
  async resolveJurisdiction(lat: number, lng: number): Promise<{
    roadSegmentId?: string;
    roadSegmentName?: string;
    departmentId?: string;
    departmentName?: string;
    roadHealthScore?: number;
    isRecurringHotspot?: boolean;
  }> {
    const res = await fetch(`${API_BASE_URL}/road-health/resolve?lat=${lat}&lng=${lng}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to resolve jurisdiction');
    return json.data;
  },

  async getRoadHealth(): Promise<RoadSegment[]> {
    const res = await fetch(`${API_BASE_URL}/road-health`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch road health data');
    return json.data;
  },

  async getTenders(): Promise<TenderRecord[]> {
    const res = await fetch(`${API_BASE_URL}/tenders`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch tender intelligence data');
    return json.data;
  },

  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE_URL}/analytics/summary`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch analytics summary');
    return json.data;
  },
};
