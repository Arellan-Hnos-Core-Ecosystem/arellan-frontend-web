// SEC-04: garantiza que el store de sesión jamás persista tokens en
// localStorage y que el login vía BFF no exponga el refresh token al JS.
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// localStorage shim (vitest node env) — instalado ANTES de importar el store.
const storage = new Map<string, string>();
beforeAll(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => void storage.set(k, v),
      removeItem: (k: string) => void storage.delete(k),
      clear: () => storage.clear(),
    },
    configurable: true,
  });
});

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

async function freshStore() {
  const mod = await import("../auth");
  mod.useAuthStore.setState({
    user: null,
    accessToken: null,
    mfaToken: null,
    mfaEnrollmentRequired: false,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });
  return mod;
}

describe("auth store (SEC-04)", () => {
  beforeEach(() => {
    storage.clear();
    fetchMock.mockReset();
  });

  it("keeps the access token ONLY in memory after login", async () => {
    const { useAuthStore } = await freshStore();

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        user: { id: "u1", name: "Ana", role: "ADMIN" },
        accessToken: "in-memory-access-token",
      }),
    });

    await useAuthStore.getState().login({ email: "a@x.pe", password: "secret" } as never);

    expect(useAuthStore.getState().accessToken).toBe("in-memory-access-token");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    // nada del token puede haber tocado el almacenamiento persistente
    const allPersisted = Array.from(storage.values()).join("|");
    expect(allPersisted).not.toContain("in-memory-access-token");
  });

  it("partialize persists ONLY the user — never tokens (SEC-04 invariant)", async () => {
    const { persistPartialize } = await import("../auth");

    const persisted = persistPartialize({
      user: { id: "u1", name: "Ana" } as never,
      accessToken: "SECRET-ACCESS",
      mfaToken: "SECRET-MFA",
      isAuthenticated: true,
    } as never);

    expect(persisted).toEqual({ user: { id: "u1", name: "Ana" } });
    expect(JSON.stringify(persisted)).not.toContain("SECRET");
  });

  it("migrates away legacy persisted tokens (version 2 purge)", async () => {
    const { persistMigrate } = await import("../auth");

    const migrated = persistMigrate({
      user: { id: "u1", name: "Ana" },
      accessToken: "LEGACY-ACCESS",
      refreshToken: "LEGACY-REFRESH",
      isAuthenticated: true,
    });

    const serialized = JSON.stringify(migrated);
    expect(serialized).not.toContain("LEGACY-ACCESS");
    expect(serialized).not.toContain("LEGACY-REFRESH");
    expect(migrated.user).toEqual({ id: "u1", name: "Ana" } as never);
  });

  it("login calls the same-origin BFF, not the backend directly", async () => {
    const { useAuthStore } = await freshStore();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { id: "u1" }, accessToken: "t" }),
    });

    await useAuthStore.getState().login({ email: "a@x.pe", password: "secret" } as never);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe("/api/auth/login");
  });

  it("keeps mfaPending flow without tokens", async () => {
    const { useAuthStore } = await freshStore();
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ mfaPending: true, sessionToken: "mfa-session" }),
    });

    await useAuthStore.getState().login({ email: "a@x.pe", password: "secret" } as never);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().mfaToken).toBe("mfa-session");
  });
});
