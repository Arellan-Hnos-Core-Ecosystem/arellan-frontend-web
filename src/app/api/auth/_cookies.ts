import { NextResponse } from "next/server";

// SEC-04: BFF de sesión del panel admin. El refresh token NUNCA llega a
// JavaScript: viaja en cookie HttpOnly con path restringido a /api/auth (solo
// los route handlers de sesión la reciben). El access token (15 min) se
// devuelve al cliente para el header Authorization en memoria y además se fija
// en cookie HttpOnly `arellan-auth` para que el middleware valide sesión real
// en el edge (SEC-09).
export const ACCESS_COOKIE = "arellan-auth";
export const REFRESH_COOKIE = "arellan-refresh";

export const BACKEND_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

const isProd = process.env.NODE_ENV === "production";

export function setSessionCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    // Solo los handlers /api/auth/* reciben esta cookie: ni las páginas ni el
    // resto de la app la ven — superficie mínima.
    path: "/api/auth",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { httpOnly: true, path: "/api/auth", maxAge: 0 });
}
