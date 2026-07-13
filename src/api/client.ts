import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'learn_auth_token';

const client = axios.create({
  baseURL: BASE_URL,
  // Without this, a hung request (dead connection, slow DB) leaves the UI on
  // a loading skeleton forever instead of surfacing a retryable error.
  timeout: 15000,
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
    // Normalize "no server response" cases (timeout, offline, dropped
    // connection) to a message + retryable flag every hook can read the
    // same way, instead of each one guessing at axios's raw error shape.
    if (!error.response) {
      error.friendlyMessage =
        error.code === 'ECONNABORTED'
          ? 'This is taking longer than expected. Please try again.'
          : 'Could not reach the server. Check your connection and try again.';
      error.retryable = true;
    } else if (error.response.data?.retryable) {
      error.friendlyMessage = error.response.data.error;
      error.retryable = true;
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
