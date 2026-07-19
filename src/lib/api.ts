import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// Avoid circular dep: auth store calls configureApiAuth after it is created.
// api.ts never imports from stores/auth.ts.
// SEC-04: ya no existe getRefreshToken — el refresh token vive en una cookie
// HttpOnly y solo lo maneja el BFF (/api/auth/refresh). El interceptor 401
// llama al BFF (mismo origen) y recibe únicamente el access token nuevo.
let _getAccessToken: () => string | null = () => null;
let _onTokenRefreshed: (access: string) => void = () => {};
let _onUnauthorized: () => void = () => {};

export function configureApiAuth(opts: {
  getAccessToken: () => string | null;
  onTokenRefreshed: (access: string) => void;
  onUnauthorized: () => void;
}): void {
  _getAccessToken = opts.getAccessToken;
  _onTokenRefreshed = opts.onTokenRefreshed;
  _onUnauthorized = opts.onUnauthorized;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];
let redirectGuard = false;

function processQueue(error: unknown, token: string | null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else if (token) resolve(token);
  });
  failedQueue = [];
}

api.interceptors.request.use(
  (config) => {
    const token = _getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // BFF same-origin: la cookie HttpOnly arellan-refresh viaja sola.
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "same-origin",
        });
        if (!refreshRes.ok) throw new Error("Sesion expirada");
        const data = (await refreshRes.json()) as { accessToken?: string };
        if (!data.accessToken) throw new Error("Sesion expirada");

        _onTokenRefreshed(data.accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        }
        processQueue(null, data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        if (typeof window !== "undefined" && !redirectGuard) {
          redirectGuard = true;
          _onUnauthorized();
          window.location.replace("/login");
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      "Error de conexion con el servidor";

    return Promise.reject(new Error(message));
  },
);
