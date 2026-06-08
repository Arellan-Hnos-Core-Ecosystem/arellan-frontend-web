import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, AuthResponse, LoginRequest, MfaRequest } from "@/types";
import { api, configureApiAuth } from "@/lib/api";

interface AuthState {
  user: Account | null;
  accessToken: string | null;
  refreshToken: string | null;
  mfaToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  verifyMfa: (data: MfaRequest) => Promise<void>;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
}

function sanitizePersisted(raw: Partial<AuthState>) {
  if (raw.accessToken && raw.isAuthenticated && raw.user) {
    return {
      accessToken: raw.accessToken,
      refreshToken: raw.refreshToken ?? null,
      user: raw.user,
      isAuthenticated: true,
    };
  }
  return {
    accessToken: null as string | null,
    refreshToken: null as string | null,
    user: null as Account | null,
    isAuthenticated: false,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      mfaToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<AuthResponse>("/auth/login", data);

          if (response.data.mfaPending) {
            set({ mfaToken: response.data.sessionToken ?? null, isLoading: false });
            return;
          }

          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            isAuthenticated: true,
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
          const response = await api.post<AuthResponse>("/auth/mfa/verify", {
            token: data.code,
            sessionToken: get().mfaToken,
          });

          set({
            user: response.data.user,
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            mfaToken: null,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Codigo MFA invalido";
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: () => {
        try {
          api.post("/auth/logout").catch(() => {});
        } finally {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            mfaToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "arellan-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizePersisted(persisted as Partial<AuthState>),
      }),
    }
  )
);

// Wire api auth callbacks — uni-directional: auth → api (no cycle)
configureApiAuth({
  getAccessToken: () => useAuthStore.getState().accessToken,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  onTokenRefreshed: (access, refresh) => {
    useAuthStore.getState().setTokens(access, refresh);
  },
  onUnauthorized: () => {
    useAuthStore.getState().logout();
  },
});
