// API client utilities for frontend-admin with JWT token refresh logic

import { showError, showSuccess, parseBackendError } from './toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

console.log('='.repeat(50));
console.log('Frontend Admin API Client Initialized');
console.log('API_BASE_URL:', API_BASE_URL);
console.log('process.env.NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);
console.log('='.repeat(50));

interface AuthTokens {
  access: string;
  refresh: string;
}

class APIClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Load tokens from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  setTokens(tokens: AuthTokens) {
    this.accessToken = tokens.access;
    this.refreshToken = tokens.refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.access;
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.access);
        }
        return true;
      }
      
      // Refresh token expired, clear all tokens
      this.clearTokens();
      return false;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return false;
    }
  }

  async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Only add Content-Type if not FormData (FormData needs browser to set multipart boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // If unauthorized and we have a refresh token, try refreshing
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry request with new access token
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } else if (response.status === 401) {
      // No refresh token available, clear tokens and redirect
      this.clearTokens();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }

    return response;
  }

  async login(username: string, password: string) {
    const url = `${API_BASE_URL}/auth/login/`;
    console.log('Attempting login to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status);
      console.log('Login response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('Login successful, received tokens and data:', data);
        this.setTokens({ access: data.access, refresh: data.refresh });
        return data; // Return full login data including is_super_admin
      }

      const errorData = await response.text();
      console.log('Login failed with status:', response.status, 'Response:', errorData);
      
      if (response.status === 401) {
        throw new Error('Invalid username or password');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(`Login failed: ${errorData}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check your network connection and ensure the server is running.');
      }
      throw error;
    }
  }

  async logout() {
    this.clearTokens();
  }

  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Organization & Team Management APIs
  async get(endpoint: string, showToastOnError = true) {
    const response = await this.request(endpoint, { method: 'GET' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (showToastOnError) {
        showError(errorData);
      }
      throw { response: { data: errorData } };
    }
    return response.json();
  }

  async post(endpoint: string, data: any, showToastOnError = true) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (showToastOnError) {
        showError(errorData);
      }
      throw { response: { data: errorData } };
    }
    return response.json();
  }

  async put(endpoint: string, data: any, showToastOnError = true) {
    const response = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (showToastOnError) {
        showError(errorData);
      }
      throw { response: { data: errorData } };
    }
    return response.json();
  }

  async patch(endpoint: string, data: any, showToastOnError = true) {
    const response = await this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (showToastOnError) {
        showError(errorData);
      }
      throw { response: { data: errorData } };
    }
    return response.json();
  }

  async delete(endpoint: string, showToastOnError = true) {
    const response = await this.request(endpoint, { method: 'DELETE' });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (showToastOnError) {
        showError(errorData);
      }
      throw { response: { data: errorData } };
    }
    // Handle 204 No Content
    if (response.status === 204) {
      return { success: true };
    }
    return response.json();
  }

  // Form data upload (for files)
  async upload(endpoint: string, formData: FormData, showToastOnError = true) {
    const response = await this.request(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }));
      if (showToastOnError) {
        showError(errorData);
      }
      throw { response: { data: errorData } };
    }
    return response.json();
  }
}

export const apiClient = new APIClient();
export const api = apiClient; // Named export for convenience
export default apiClient;
