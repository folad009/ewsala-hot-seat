import type { LifelineKind } from "@/lib/lifeline-pricing";

export type ChargeMeta = {
  quizDate: string;
  questionId: string;
};

/**
 * One-off payment before a lifeline is applied.
 * Calls `/api/payments/lifeline-charge` (stub). Replace with Paystack/Flutterwave init + server verify.
 * `NEXT_PUBLIC_SKIP_LIFELINE_PAYMENT=true` skips the paywall and charge (local testing only).
 */
export async function chargeForLifeline(
  kind: LifelineKind,
  meta: ChargeMeta,
): Promise<{ ok: boolean; error?: string; reference?: string }> {
  if (
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SKIP_LIFELINE_PAYMENT === "true"
  ) {
    return { ok: true, reference: "dev-skip" };
  }

  try {
    const res = await fetch("/api/payments/lifeline-charge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, ...meta }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      reference?: string;
      error?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error ?? "Payment could not start" };
    }
    if (!data.ok) {
      return { ok: false, error: data.error ?? "Payment failed" };
    }
    return { ok: true, reference: data.reference };
  } catch {
    return { ok: false, error: "Network error" };
  }
}
