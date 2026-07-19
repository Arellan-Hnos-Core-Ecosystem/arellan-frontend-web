import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, REFRESH_COOKIE, clearSessionCookies } from "../_cookies";

// SEC-04: logout vía BFF — revoca el refresh token en el backend (BD + Redis)
// y limpia ambas cookies HttpOnly. Idempotente: sin cookie, solo limpia.
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/auth/logout`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Best-effort: la revocación server-side puede fallar por red; las
      // cookies se limpian igualmente y el token expira por TTL.
    }
  }

  const response = NextResponse.json({ message: "Sesion cerrada" }, { status: 200 });
  clearSessionCookies(response);
  return response;
}
