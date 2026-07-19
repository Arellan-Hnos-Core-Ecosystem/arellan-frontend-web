import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, LoginRequest, MfaRequest } from "@/types";
import { configureApiAuth } from "@/lib/api";

// SEC-04: NINGÚN token se persiste en localStorage. El access token vive solo
// en memoria (este store, sin partialize); el refresh token vive solo en una
// cookie HttpOnly gestionada por el BFF (/api/auth/*) — el JS nunca lo ve.
// Un XSS ya no puede exfiltrar la sesión persistente: como máximo usa el
// access token en memoria durante su TTL (15 min).
// Al recargar la página, la sesión se reanuda vía POST /api/auth/refresh
// (cookie HttpOnly → nuevo access token), no desde el almacenamiento.

interface BffAuthResponse {
  user?: Account;
  accessToken?: string;
  mfaPending?: boolean;
  sessionToken?: string;
  mfaEnrollmentRequired?: boolean;
  message?: string;
}

interface AuthState {
  user: Account | null;
  accessToken: string | null;
  mfaToken: string | null;
  mfaEnrollmentRequired: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  verifyMfa: (data: MfaRequest) => Promise<void>;
  restoreSession: () => Promise<boolean>;
  logout: () => void;
  setAccessToken: (accessToken: string) => void;
  clearError: () => void;
}

// SEC-04 (invariantes testeables): lo único persistible es el usuario para
// presentación. Cualquier token —presente o legacy— queda fuera.
export function persistPartialize(state: AuthState): { user: Account | null } {
  return { user: state.user };
}

export function persistMigrate(persisted: unknown): { user: Account | null } {
  const prev = (persisted ?? {}) as Partial<AuthState>;
  return { user: prev.user ?? null };
}

async function postJson(url: string, body: unknown): Promise<BffAuthResponse> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => ({}))) as BffAuthResponse;
  if (!res.ok) {
    throw new Error(data.message ?? "Error de autenticacion");
  }
  return data;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      mfaToken: null,
      mfaEnrollmentRequired: false,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await postJson("/api/auth/login", data);

          if (response.mfaPending) {
            set({ mfaToken: response.sessionToken ?? null, isLoading: false });
            return;
          }

          set({
            user: response.user ?? null,
            accessToken: response.accessToken ?? null,
            mfaEnrollmentRequired: response.mfaEnrollmentRequired === true,
            isAuthenticated: !!response.accessToken,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Error al iniciar sesion";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      verifyMfa: async (data: MfaRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await postJson("/api/auth/mfa", {
            token: data.code,
            sessionToken: get().mfaToken,
          });

          set({
            user: (response.user as Account) ?? null,
            accessToken: response.accessToken ?? null,
            mfaToken: null,
            mfaEnrollmentRequired: false,
            isAuthenticated: !!response.accessToken,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Codigo MFA invalido";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      // Reanuda la sesión tras una recarga: la cookie HttpOnly de refresh
      // produce un access token nuevo. Devuelve false si no hay sesión.
      restoreSession: async () => {
        try {
          const response = await postJson("/api/auth/refresh", {});
          if (!response.accessToken) return false;
          set({
            accessToken: response.accessToken,
            user: (response.user as Account) ?? get().user,
            isAuthenticated: true,
          });
          return true;
        } catch {
          set({ accessToken: null, isAuthenticated: false });
          return false;
        }
      },

      logout: () => {
        try {
          void fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
        } finally {
          set({
            user: null,
            accessToken: null,
            mfaToken: null,
            mfaEnrollmentRequired: false,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      setAccessToken: (accessToken: string) => {
        set({ accessToken, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "arellan-auth",
      // SEC-04: solo datos de presentación; jamás tokens.
      partialize: persistPartialize,
      // v2: purga los accessToken/refreshToken que la versión anterior dejó en
      // localStorage de los navegadores existentes.
      version: 2,
      migrate: persistMigrate,
      merge: (persisted, current) => ({
        ...current,
        user: ((persisted ?? {}) as Partial<AuthState>).user ?? null,
      }),
    }
  )
);

// Wire api auth callbacks — uni-directional: auth → api (no cycle)
configureApiAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onTokenRefreshed: (access) => {
    useAuthStore.getState().setAccessToken(access);
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});
