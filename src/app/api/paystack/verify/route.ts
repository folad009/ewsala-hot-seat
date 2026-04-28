import { verifyPaystackTransaction } from "@/lib/paystack";
import { DAILY_SUBSCRIPTION_FEE_NAIRA } from "@/lib/service-config";
import { recordSubscriptionTransaction } from "@/lib/subscription-transactions";
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
  const { reference, msisdn } = body as { reference?: unknown; msisdn?: unknown };
  if (typeof reference !== "string" || !reference.trim()) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const verified = await verifyPaystackTransaction(reference.trim());
  if (!verified.ok) {
    return NextResponse.json({ error: verified.error }, { status: 502 });
  }
  if (verified.status !== "success") {
    return NextResponse.json(
      { error: `Payment not successful: ${verified.status}` },
      { status: 402 },
    );
  }
  if (verified.amountKobo < DAILY_SUBSCRIPTION_FEE_NAIRA * 100) {
    return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
  }

  if (typeof msisdn === "string" && msisdn.trim()) {
    await recordSubscriptionTransaction({
      msisdn: msisdn.trim(),
      channel: "web",
      provider: "paystack",
      eventType: "payment_verified",
      status: "success",
      amountNaira: Math.floor(verified.amountKobo / 100),
      reference: verified.reference,
    }).catch(() => {
      // Best-effort write: verification should not fail because of ledger write.
    });
  }

  return NextResponse.json({
    verified: true,
    reference: verified.reference,
    amountKobo: verified.amountKobo,
  });
}
