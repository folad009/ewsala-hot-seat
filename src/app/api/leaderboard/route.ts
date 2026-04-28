import { getAuthenticatedWebUser } from "@/lib/auth-request";
import { getLeaderboardByPeriod } from "@/lib/subscription-transactions";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") === "monthly" ? "monthly" : "weekly";
  const limit = Number(searchParams.get("limit") ?? "10");
  const user = await getAuthenticatedWebUser();
  const leaderboard = await getLeaderboardByPeriod(period, limit, user?.phone);

  return NextResponse.json({
    period,
    rows: leaderboard.rows,
    me: leaderboard.me,
    totalPlayers: leaderboard.totalPlayers,
  });
}
