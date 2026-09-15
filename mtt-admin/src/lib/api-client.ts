const API_BASE = '/api/v1';

export class ApiError extends Error {
  constructor(public status: number, message: string, public data?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('opencpo_refresh_token');
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    const data = await response.json();
    const newToken = data.access_token || data.token;
    if (newToken) {
      localStorage.setItem('opencpo_admin_jwt', newToken);
      if (data.refresh_token) {
        localStorage.setItem('opencpo_refresh_token', data.refresh_token);
      }
      return newToken;
    }
  } catch {
    localStorage.removeItem('opencpo_admin_jwt');
    localStorage.removeItem('opencpo_refresh_token');
    localStorage.removeItem('opencpo_user');
  }
  return null;
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('opencpo_admin_jwt');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401 && !window.location.pathname.includes('/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await tryRefreshToken();
      isRefreshing = false;

      if (newToken) {
        onRefreshed(newToken);
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        localStorage.removeItem('opencpo_admin_jwt');
        localStorage.removeItem('opencpo_refresh_token');
        localStorage.removeItem('opencpo_user');
        window.location.href = '/login';
        throw new ApiError(401, 'Unauthorized');
      }
    } else {
      // Queue until refresh finishes
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push(async (newToken: string) => {
          headers['Authorization'] = `Bearer ${newToken}`;
          try {
            const retryRes = await fetch(url, { ...options, headers });
            if (!retryRes.ok) {
              reject(new ApiError(retryRes.status, retryRes.statusText));
            } else {
              resolve(await retryRes.json());
            }
          } catch (e) {
            reject(e);
          }
        });
      });
    }
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, errorData?.detail || response.statusText, errorData);
  }

  // Handle empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return {} as T;
  }

  return response.json();
}

export async function uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = localStorage.getItem('opencpo_admin_jwt');
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (response.status === 401 && !window.location.pathname.includes('/login')) {
    localStorage.removeItem('opencpo_admin_jwt');
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, errorData?.detail || response.statusText, errorData);
  }

  return response.json();
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: unknown) => request<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(url: string, body?: unknown) => request<T>(url, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, body?: unknown) => request<T>(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
  upload: <T>(url: string, formData: FormData) => uploadRequest<T>(url, formData),
};

