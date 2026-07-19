import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// SEC-09: antes este middleware era un no-op (todo NextResponse.next()) — las
// rutas (admin) solo se "protegían" con estado cliente (Zustand). Ahora valida
// la SESIÓN REAL: verifica la firma HS256 y la expiración del JWT que el BFF
// (/api/auth/login|mfa|refresh) dejó en la cookie HttpOnly `arellan-auth`, y
// exige un rol de gestión. Sin secreto configurado se deniega (fail-closed).
// Verificación con Web Crypto (edge-native, sin dependencias). Nota SEC-17:
// requiere compartir JWT_ACCESS_SECRET con este servidor Next — consecuencia de
// HS256 simétrico; la migración a RS256 eliminaría esa necesidad.

const PROTECTED_PREFIXES = [
  "/dashboard", "/orders", "/finance", "/inventory",
  "/clients", "/personnel", "/audit", "/approvals",
];
const AUTH_PATH = "/login";
const ALLOWED_ROLES = new Set(["OWNER", "ADMIN", "FINANCE"]);
const ACCESS_COOKIE = "arellan-auth";

const SECRET_RAW = process.env.JWT_ACCESS_SECRET;

interface JwtClaims {
  role?: string;
  mfaVerified?: boolean;
  exp?: number;
  id?: string;
}

function base64UrlDecode(input: string): Uint8Array<ArrayBuffer> {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function verifyHs256(token: string): Promise<JwtClaims | null> {
  if (!SECRET_RAW) {
    console.error("[middleware] JWT_ACCESS_SECRET no configurado — acceso protegido denegado.");
    return null;
  }
  const [headerB64, payloadB64, signatureB64] = token.split(".");
  if (!headerB64 || !payloadB64 || !signatureB64) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(base64UrlDecode(headerB64))) as { alg?: string };
    // Sólo HS256: rechaza alg:none y confusiones de algoritmo.
    if (header.alg !== "HS256") return null;

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET_RAW),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(signatureB64),
      new TextEncoder().encode(`${headerB64}.${payloadB64}`),
    );
    if (!valid) return null;

    const claims = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as JwtClaims;
    if (typeof claims.exp === "number" && Date.now() >= claims.exp * 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

function redirectToLogin(request: NextRequest, from: string): NextResponse {
  const loginUrl = new URL(AUTH_PATH, request.url);
  loginUrl.searchParams.set("redirect", from);
  const res = NextResponse.redirect(loginUrl);
  // Cookie inválida/expirada: se limpia para evitar bucles de redirección.
  res.cookies.set(ACCESS_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(ACCESS_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    if (!token) return redirectToLogin(request, pathname);

    const claims = await verifyHs256(token);
    if (!claims?.id || !claims.role || !ALLOWED_ROLES.has(claims.role)) {
      return redirectToLogin(request, pathname);
    }
    return NextResponse.next();
  }

  // Con sesión de gestión válida, /login redirige al dashboard (sin bucle: si
  // el token no valida, se queda en /login).
  if (pathname === AUTH_PATH && token) {
    const claims = await verifyHs256(token);
    if (claims?.role && ALLOWED_ROLES.has(claims.role)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", "/orders/:path*", "/finance/:path*", "/inventory/:path*",
    "/clients/:path*", "/personnel/:path*", "/audit/:path*", "/approvals/:path*",
    "/login",
  ],
};
