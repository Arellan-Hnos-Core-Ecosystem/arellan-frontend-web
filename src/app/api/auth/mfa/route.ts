import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, setSessionCookies } from "../_cookies";

// SEC-04: verificación TOTP vía BFF — al completar MFA se emiten los tokens y
// el refreshToken queda solo en cookie HttpOnly (nunca en el body).
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Cuerpo de peticion invalido" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/auth/mfa/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ message: "Respuesta de autenticacion invalida" }, { status: 502 });
  }

  const { refreshToken, ...safeBody } = data;
  const response = NextResponse.json(safeBody, { status: 200 });
  setSessionCookies(response, { accessToken: data.accessToken, refreshToken });
  return response;
}
