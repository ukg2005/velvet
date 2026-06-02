import axios from 'axios';

// Base API configuration (bypass proxy in dev if needed to preserve trailing slashes)
const resolvedBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function normalizeAuthPath(url?: string) {
  if (!url) {
    return url;
  }

  if (url === '/auth/login') {
    return '/auth/login/';
  }

  if (url === '/auth/login/verify') {
    return '/auth/login/verify/';
  }

  if (url === '/auth/verify-email') {
    return '/auth/verify-email/';
  }

  return url;
}

export const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for attaching the authentication token
api.interceptors.request.use((config) => {
  config.url = normalizeAuthPath(config.url);

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];
let refreshErrorSubscribers: ((err: any) => void)[] = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
  refreshErrorSubscribers = [];
}

function onRefreshFailed(error: any) {
  refreshErrorSubscribers.forEach((callback) => callback(error));
  refreshSubscribers = [];
  refreshErrorSubscribers = [];
}

function addRefreshSubscriber(
  callback: (token: string) => void,
  errorCallback: (err: any) => void
) {
  refreshSubscribers.push(callback);
  refreshErrorSubscribers.push(errorCallback);
}

// Interceptor for refreshing token if 401 Unauthorized occurs
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if the error is due to an invalid token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber(
            (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            (err) => {
              reject(err);
            }
          );
        });
      }

      isRefreshing = true;

      try {
        if (typeof window === 'undefined') {
          throw new Error('Token refresh requires browser context');
        }

        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(`${api.defaults.baseURL}/auth/token/refresh/`, {
          refresh,
        });

        // Save new token
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        
        isRefreshing = false;
        onRefreshed(data.access);

        // Update header and retry previous request
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed(refreshError);
        
        // Refresh token failed, clear storage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
