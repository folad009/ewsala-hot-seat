import { getPaystackHealth } from "@/lib/paystack";
import { NextResponse } from "next/server";

export async function GET() {
  const health = getPaystackHealth();
  return NextResponse.json({
    service: "paystack",
    configured: health.configured,
    mode: health.mode,
  });
}
