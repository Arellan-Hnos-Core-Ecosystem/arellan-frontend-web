import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, AuthResponse, LoginRequest, MfaRequest } from "@/types";
import { api } from "@/lib/api";

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
  refreshAccessToken: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
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
            set({
              mfaToken: response.data.sessionToken ?? null,
              isLoading: false,
            });
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
          const message =
            err instanceof Error ? err.message : "Error al iniciar sesion";
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
          const message =
            err instanceof Error ? err.message : "Codigo MFA invalido";
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

      refreshAccessToken: async () => {
        const currentRefreshToken = get().refreshToken;
        if (!currentRefreshToken) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await api.post<{
            accessToken: string;
            refreshToken: string;
          }>("/auth/refresh", { refreshToken: currentRefreshToken });

          set({
            accessToken: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            isAuthenticated: true,
          });
        } catch {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
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
    }
  )
);
