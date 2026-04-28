import { getAuthenticatedWebUser } from "@/lib/auth-request";
import { DAILY_SUBSCRIPTION_FEE_NAIRA } from "@/lib/service-config";
import { initializePaystackTransaction } from "@/lib/paystack";
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

  const { phone, callbackUrl } = body as { phone?: unknown; callbackUrl?: unknown };
  if (typeof phone !== "string" || phone.trim().length < 7) {
    return NextResponse.json({ error: "Valid phone is required" }, { status: 400 });
  }
  if (typeof callbackUrl !== "string" || !callbackUrl.startsWith("http")) {
    return NextResponse.json({ error: "Valid callbackUrl is required" }, { status: 400 });
  }
  const user = await getAuthenticatedWebUser();
  if (!user || user.phone !== phone.trim()) {
    return NextResponse.json(
      { error: "Please sign in with the same phone number before payment" },
      { status: 401 },
    );
  }

  const reference = `eswala_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
  const initialized = await initializePaystackTransaction({
    email: `${phone.trim()}@eswalatrivia.local`,
    amountKobo: DAILY_SUBSCRIPTION_FEE_NAIRA * 100,
    reference,
    callbackUrl,
    metadata: { phone: phone.trim(), product: "web_daily_subscription" },
  });
  if (!initialized.ok) {
    const status = initialized.code === "not_configured" ? 500 : 502;
    return NextResponse.json({ error: initialized.error }, { status });
  }

  return NextResponse.json({
    authorizationUrl: initialized.authorizationUrl,
    reference: initialized.reference,
  });
}
