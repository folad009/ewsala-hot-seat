import { DAILY_SUBSCRIPTION_FEE_NAIRA } from "@/lib/service-config";

type PaystackInitializeOk = {
  ok: true;
  authorizationUrl: string;
  reference: string;
};

type PaystackError = {
  ok: false;
  error: string;
  code?: "not_configured" | "upstream_error";
};

type PaystackVerifyOk = {
  ok: true;
  status: "success" | "pending" | "failed";
  reference: string;
  amountKobo: number;
};

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const MOCK_PREFIX = "mock_";

function paystackSecret(): string {
  return process.env.PAYSTACK_SECRET_KEY ?? "";
}

function paystackEnabled(): boolean {
  return paystackSecret().startsWith("sk_");
}

function paystackMockMode(): boolean {
  const key = paystackSecret();
  return key.startsWith("sk_test_mock_") || key.includes(MOCK_PREFIX);
}

export function getPaystackHealth(): {
  configured: boolean;
  mode: "test" | "live" | "unknown";
} {
  const key = paystackSecret();
  if (key.startsWith("sk_test_")) return { configured: true, mode: "test" };
  if (key.startsWith("sk_live_")) return { configured: true, mode: "live" };
  return { configured: false, mode: "unknown" };
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<PaystackInitializeOk | PaystackError> {
  if (!paystackEnabled()) {
    return {
      ok: false,
      error: "Paystack is not configured. Set PAYSTACK_SECRET_KEY (sk_test_... or sk_live_...).",
      code: "not_configured",
    };
  }
  if (paystackMockMode()) {
    return {
      ok: true,
      authorizationUrl: `${input.callbackUrl}${
        input.callbackUrl.includes("?") ? "&" : "?"
      }paystack_return=1&reference=${encodeURIComponent(input.reference)}`,
      reference: input.reference,
    };
  }
  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });
  } catch {
    return {
      ok: false,
      error: "Could not reach Paystack from server.",
      code: "upstream_error",
    };
  }
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string; reference?: string };
  };
  if (!res.ok || !json.status || !json.data?.authorization_url || !json.data.reference) {
    return {
      ok: false,
      error: json.message
        ? `Paystack initialize failed (${res.status}): ${json.message}`
        : `Paystack initialize failed with status ${res.status}`,
      code: "upstream_error",
    };
  }
  return {
    ok: true,
    authorizationUrl: json.data.authorization_url,
    reference: json.data.reference,
  };
}

export async function verifyPaystackTransaction(
  reference: string,
): Promise<PaystackVerifyOk | PaystackError> {
  if (!paystackEnabled()) {
    return {
      ok: false,
      error: "Paystack is not configured. Set PAYSTACK_SECRET_KEY (sk_test_... or sk_live_...).",
      code: "not_configured",
    };
  }
  if (paystackMockMode()) {
    return {
      ok: true,
      status: "success",
      reference,
      amountKobo: DAILY_SUBSCRIPTION_FEE_NAIRA * 100,
    };
  }
  let res: Response;
  try {
    res = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${paystackSecret()}` },
      },
    );
  } catch {
    return {
      ok: false,
      error: "Could not reach Paystack from server.",
      code: "upstream_error",
    };
  }
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: { status?: "success" | "failed" | "pending"; reference?: string; amount?: number };
  };

  if (!res.ok || !json.status || !json.data?.reference || typeof json.data.amount !== "number") {
    return {
      ok: false,
      error: json.message
        ? `Paystack verify failed (${res.status}): ${json.message}`
        : `Paystack verify failed with status ${res.status}`,
      code: "upstream_error",
    };
  }
  return {
    ok: true,
    status: json.data.status ?? "failed",
    reference: json.data.reference,
    amountKobo: json.data.amount,
  };
}
