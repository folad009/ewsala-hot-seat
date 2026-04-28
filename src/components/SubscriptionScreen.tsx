"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type HistoryItem = {
  id: string;
  eventType: string;
  provider: string;
  status: string;
  amountNaira: number | null;
  occurredAt: string;
};

type HistoryResponse = {
  msisdn: string;
  subscription: {
    active: boolean;
    activeVia: "network" | "paystack" | null;
    lastEventAt: string | null;
  };
  transactions: HistoryItem[];
};

export function SubscriptionScreen() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/subscription/history?limit=20");
        if (!res.ok) {
          setError("Unable to load subscription details.");
          setData(null);
          return;
        }
        setData((await res.json()) as HistoryResponse);
      } catch {
        setError("Network error.");
        setData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-(family-name:--font-stage) text-2xl font-bold uppercase text-white">
          Subscription
        </h2>
        <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
          Back to game
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading subscription...</p>
      ) : error ? (
        <p className="text-sm text-rose-300">{error}</p>
      ) : !data ? (
        <p className="text-sm text-slate-400">No subscription record found.</p>
      ) : (
        <>
          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
            <p>
              MSISDN: <strong>{data.msisdn}</strong>
            </p>
            <p className="mt-1">
              Status:{" "}
              <strong className={data.subscription.active ? "text-emerald-300" : "text-rose-300"}>
                {data.subscription.active ? "Active" : "Inactive"}
              </strong>
              {data.subscription.activeVia ? ` via ${data.subscription.activeVia}` : ""}
            </p>
          </div>

          <div className="space-y-2">
            {data.transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="uppercase tracking-wide text-slate-400">
                    {tx.eventType.replaceAll("_", " ")}
                  </span>
                  <span>{new Date(tx.occurredAt).toLocaleString("en-NG")}</span>
                </div>
                <div className="mt-1 text-slate-400">
                  {tx.provider} · {tx.status}
                  {typeof tx.amountNaira === "number" ? ` · N${tx.amountNaira}` : ""}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
