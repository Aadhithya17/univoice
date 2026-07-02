const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface RequestOptions extends RequestInit {
  bodyData?: any;
}

const request = async (url: string, options: RequestOptions = {}) => {
  const headers = new Headers(options.headers || {});
  
  if (options.bodyData) {
    if (options.bodyData instanceof FormData) {
      // Fetch automatically sets content-type for FormData with boundary
      options.body = options.bodyData;
    } else {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(options.bodyData);
    }
  }

  // Ensure cookies are sent (JWT auth)
  options.credentials = 'include';
  options.headers = headers;

  const response = await fetch(`${API_BASE_URL}${url}`, options);

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg) as any;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  get: (url: string, headers?: HeadersInit) => request(url, { method: 'GET', headers }),
  post: (url: string, bodyData?: any, headers?: HeadersInit) => request(url, { method: 'POST', bodyData, headers }),
  put: (url: string, bodyData?: any, headers?: HeadersInit) => request(url, { method: 'PUT', bodyData, headers }),
  delete: (url: string, headers?: HeadersInit) => request(url, { method: 'DELETE', headers }),
  baseUrl: API_BASE_URL,
  backendUrl: BACKEND_URL,
};
