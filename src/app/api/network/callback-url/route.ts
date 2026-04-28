import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const callbackPath = "/api/network/callback/subscriber-transactions";

  return NextResponse.json({
    callbackUrl: `${url.origin}${callbackPath}`,
    method: "GET",
    requiredQuery: ["from", "to"],
    optionalQuery: ["provider"],
    auth: "Authorization: Bearer <MTN_CALLBACK_TOKEN>",
  });
}
