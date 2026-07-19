import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, setSessionCookies } from "../_cookies";

// SEC-04: login vía BFF. El backend responde { accessToken, refreshToken, user }
// (o { mfaPending, sessionToken }). El refreshToken se retiene en cookie
// HttpOnly y se ELIMINA del body — el JS del panel nunca lo ve.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Cuerpo de peticion invalido" }, { status: 400 });
  }

  let backendRes: Response;
  try {
    backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
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
    user?: { role?: string };
    mfaPending?: boolean;
    sessionToken?: string;
    mfaEnrollmentRequired?: boolean;
    message?: string;
  };

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  // Paso intermedio MFA: sin tokens todavía, sin cookies.
  if (data.mfaPending) {
    return NextResponse.json(data, { status: 200 });
  }

  if (!data.accessToken || !data.refreshToken) {
    return NextResponse.json({ message: "Respuesta de autenticacion invalida" }, { status: 502 });
  }

  const { refreshToken, ...safeBody } = data;
  const response = NextResponse.json(safeBody, { status: 200 });
  setSessionCookies(response, { accessToken: data.accessToken, refreshToken });
  return response;
}
