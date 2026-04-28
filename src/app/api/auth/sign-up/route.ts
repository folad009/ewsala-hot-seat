import {
  createSessionToken,
  getSessionCookieMaxAge,
  getSessionCookieName,
} from "@/lib/auth-session";
import { createUser } from "@/lib/auth-store";
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
  if (typeof phone !== "string" || phone.trim().length < 7) {
    return NextResponse.json({ error: "Valid phone number is required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  try {
    const user = await createUser(phone, password);
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
  } catch (error) {
    if (error instanceof Error && error.message === "User already exists") {
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not create account" }, { status: 500 });
  }
}
