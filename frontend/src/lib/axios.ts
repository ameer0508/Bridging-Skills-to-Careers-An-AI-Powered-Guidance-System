import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: apiURL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 seconds timeout
});

// Dedicated Axios instance to execute refresh calls.
// Prevents recursive triggering of interceptor hooks.
const refreshClient = axios.create({
  baseURL: apiURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (token) {
      promise.resolve(token);
    } else {
      promise.reject(error);
    }
  });
  failedQueue = [];
};

// Request Interceptor: inject active Access Token dynamically
apiClient.interceptors.request.use(
  config => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor: handle token expiration and automatic refreshing
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Check if error status is 401 and the request has not already been retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      const errorCode = error.response?.data?.error?.code;
      const refreshToken = useAuthStore.getState().refreshToken;

      // Handle token expiration: verify token status
      if (refreshToken && (errorCode === 'TOKEN_EXPIRED' || !errorCode)) {
        originalRequest._retry = true;

        // If a refresh is already underway, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return apiClient(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        isRefreshing = true;

        try {
          const response = await refreshClient.post('/auth/refresh', { refreshToken });
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;

          const currentUser = useAuthStore.getState().user;
          useAuthStore.getState().setSession(currentUser, newAccess, newRefresh);

          processQueue(null, newAccess);
          isRefreshing = false;

          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          isRefreshing = false;

          // If the refresh token fails, clear the active session (force log out)
          useAuthStore.getState().clearSession();
          return Promise.reject(refreshError);
        }
      }
    }

    // Standardize error model response
    const appError = {
      message: error.response?.data?.error?.message || error.message || 'Something went wrong',
      status: error.response?.status,
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      details: error.response?.data?.error?.details || null
    };

    if (import.meta.env.DEV) {
      console.error('[API Error]:', appError);
    }

    return Promise.reject(appError);
  }
);

export default apiClient;
