import { getSubscriberTransactionsByTime } from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

function parseIsoDate(raw: string | null): Date | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function GET(request: Request) {
  const token = process.env.MTN_CALLBACK_TOKEN ?? "";
  const auth = request.headers.get("authorization") ?? "";
  const expected = token ? `Bearer ${token}` : "";

  if (!token || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized callback request" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = parseIsoDate(searchParams.get("from"));
  const to = parseIsoDate(searchParams.get("to"));
  const provider = searchParams.get("provider");

  if (!from || !to || from > to) {
    return NextResponse.json(
      { error: "Valid from and to ISO date query params are required" },
      { status: 400 },
    );
  }
  if (provider && provider !== "network" && provider !== "paystack") {
    return NextResponse.json(
      { error: "provider must be network or paystack" },
      { status: 400 },
    );
  }

  const transactions = await getSubscriberTransactionsByTime({
    from,
    to,
    provider: provider === "network" || provider === "paystack" ? provider : undefined,
  });

  return NextResponse.json({
    window: { from: from.toISOString(), to: to.toISOString() },
    count: transactions.length,
    transactions,
  });
}
