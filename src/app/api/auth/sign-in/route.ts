import {
  createSessionToken,
  getSessionCookieMaxAge,
  getSessionCookieName,
} from "@/lib/auth-session";
import { authenticateUser } from "@/lib/auth-store";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { phone, password } = body as { phone?: unknown; password?: unknown };
  if (typeof phone !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "phone and password are required" }, { status: 400 });
  }

  const user = await authenticateUser(phone, password);
  if (!user) {
    return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 });
  }

  const token = await createSessionToken(user.id);
  const response = NextResponse.json({
    authenticated: true,
    user: { phone: user.phone },
  });
  response.cookies.set(getSessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: getSessionCookieMaxAge(),
  });
  return response;
}
