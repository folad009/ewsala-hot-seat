import { getSessionCookieName, verifySessionToken } from "@/lib/auth-session";
import { getUserById } from "@/lib/auth-store";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const payload = await verifySessionToken(token);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  const user = await getUserById(payload.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({
    authenticated: true,
    user: { phone: user.phone },
  });
}
