import { mtnReportingGateway } from "@/lib/mtn-integration";
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

  const { eventType } = body as { eventType?: unknown };
  if (typeof eventType !== "string" || !eventType.trim()) {
    return NextResponse.json({ error: "eventType is required" }, { status: 400 });
  }

  const reported = await mtnReportingGateway.publishActivity(
    body as Record<string, unknown>,
  );
  if (!reported.ok) {
    return NextResponse.json({ error: reported.error }, { status: 502 });
  }

  return NextResponse.json({ accepted: true, reference: reported.providerRef });
}
