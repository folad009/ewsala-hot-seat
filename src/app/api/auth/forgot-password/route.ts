import { resetUserPasswordByPhone } from "@/lib/auth-store";
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

  const updated = await resetUserPasswordByPhone(phone, password);
  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  return NextResponse.json({ reset: true });
}
