import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'learn_auth_token';

const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Force logout only when an authenticated session goes stale.
// Auth endpoints return 401 for wrong credentials/codes — those must reach
// the form so the user sees the message, not a page reload.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = String(error.config?.url || '').includes('/auth/');
    const hadSession = typeof window !== 'undefined' && Boolean(localStorage.getItem(TOKEN_KEY));
    if (error.response?.status === 401 && !isAuthEndpoint && hadSession) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    client.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete client.defaults.headers.common.Authorization;
  }
}

export default client;
