"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type LeaderboardRow = {
  msisdn: string;
  points: number;
  rank: number;
};

type LeaderboardResponse = {
  period: "weekly" | "monthly";
  rows: LeaderboardRow[];
  me: LeaderboardRow | null;
  totalPlayers: number;
};

function maskMsisdn(msisdn: string): string {
  if (msisdn.length < 8) return msisdn;
  return `${msisdn.slice(0, 4)}•••${msisdn.slice(-4)}`;
}

export function LeaderboardScreen() {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LeaderboardResponse | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?period=${period}&limit=10`);
        if (!res.ok) {
          setData(null);
          return;
        }
        setData((await res.json()) as LeaderboardResponse);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [period]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-(family-name:--font-stage) text-2xl font-bold uppercase text-white">
          Leaderboard
        </h2>
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          Back to game
        </Link>
      </div>

      <div className="inline-flex rounded-full border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => setPeriod("weekly")}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-wide ${
            period === "weekly" ? "bg-amber-500 text-slate-950" : "text-slate-300"
          }`}
        >
          Weekly
        </button>
        <button
          type="button"
          onClick={() => setPeriod("monthly")}
          className={`rounded-full px-4 py-2 text-xs uppercase tracking-wide ${
            period === "monthly" ? "bg-amber-500 text-slate-950" : "text-slate-300"
          }`}
        >
          Monthly
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading leaderboard...</p>
      ) : !data ? (
        <p className="text-sm text-slate-400">Could not load leaderboard.</p>
      ) : (
        <>
          <div className="space-y-2">
            {data.rows.map((row) => (
              <div
                key={`${row.rank}-${row.msisdn}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200"
              >
                <span>
                  #{row.rank} {maskMsisdn(row.msisdn)}
                </span>
                <span className="font-semibold text-amber-200">{row.points} pts</span>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {data.me ? (
              <>
                Your rank: <strong>#{data.me.rank}</strong> with{" "}
                <strong>{data.me.points} pts</strong> (out of {data.totalPlayers} players).
              </>
            ) : (
              <>You are not ranked yet for this period.</>
            )}
          </div>
        </>
      )}
    </div>
  );
}
