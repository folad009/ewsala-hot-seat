import { getAuthenticatedWebUser } from "@/lib/auth-request";
import {
  getSubscriptionHistory,
  getSubscriptionStatus,
} from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const user = await getAuthenticatedWebUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit") ?? "100");
  const history = await getSubscriptionHistory(user.phone, limitParam);
  const status = await getSubscriptionStatus(user.phone);

  return NextResponse.json({
    msisdn: user.phone,
    subscription: status,
    transactions: history,
  });
}
