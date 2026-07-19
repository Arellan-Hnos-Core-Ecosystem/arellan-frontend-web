import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, REFRESH_COOKIE, setSessionCookies, clearSessionCookies } from "../_cookies";

// SEC-04: rotación de sesión vía BFF. El refresh token vive SOLO en la cookie
// HttpOnly (path /api/auth); el backend lo rota (revoca el anterior, detecta
// reuso) y aquí se re-fijan ambas cookies. El body devuelve únicamente el
// accessToken nuevo para la memoria del cliente.
// CSRF: cookie SameSite=Lax — un POST cross-site no la envía; además la
// respuesta no realiza mutación de negocio, solo rota la propia sesión.
export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "Sesion no encontrada" }, { status: 401 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
  } catch {
    return NextResponse.json({ message: "Error de conexion con el servidor" }, { status: 502 });
  }

  const data = (await backendRes.json()) as {
    accessToken?: string;
    refreshToken?: string;
    user?: unknown;
    message?: string;
  };

  if (!backendRes.ok || !data.accessToken || !data.refreshToken) {
    // Refresh inválido/revocado: se limpia la sesión local (fail-closed).
    const response = NextResponse.json(
      { message: data.message ?? "Sesion expirada" },
      { status: backendRes.ok ? 502 : backendRes.status },
    );
    clearSessionCookies(response);
    return response;
  }

  const { refreshToken: rotated, ...safeBody } = data;
  const response = NextResponse.json(safeBody, { status: 200 });
  setSessionCookies(response, { accessToken: data.accessToken, refreshToken: rotated });
  return response;
}
