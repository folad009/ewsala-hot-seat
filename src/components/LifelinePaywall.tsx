"use client";

import { formatNgn, type LifelineKind } from "@/lib/lifeline-pricing";

type Props = {
  open: boolean;
  kind: LifelineKind | null;
  amountNgn: number;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const titles: Record<LifelineKind, string> = {
  fifty: "Unlock 50:50",
  audience: "Unlock audience poll",
};

const subs: Record<LifelineKind, string> = {
  fifty: "Two wrong answers are removed. One-time fee for this use.",
  audience: "See a simulated audience vote split. One-time fee for this use.",
};

export function LifelinePaywall({
  open,
  kind,
  amountNgn,
  processing,
  onCancel,
  onConfirm,
}: Props) {
  if (!open || !kind) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={processing ? undefined : onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-950 p-6 shadow-2xl">
        <p id="paywall-title" className="font-[family-name:var(--font-stage)] text-xl font-bold text-white">
          {titles[kind]}
        </p>
        <p className="mt-2 text-sm text-slate-400">{subs[kind]}</p>
        <p className="mt-6 text-center font-[family-name:var(--font-stage)] text-3xl font-bold text-amber-300">
          {formatNgn(amountNgn)}
        </p>
        <p className="mt-2 text-center text-xs text-slate-600">
          Charged once before this hint is shown. No refund if you still miss the question.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
          <button
            type="button"
            disabled={processing}
            onClick={onConfirm}
            className="flex-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3.5 text-sm font-bold uppercase tracking-wide text-slate-950 transition enabled:hover:brightness-105 disabled:opacity-50"
          >
            {processing ? "Processing…" : `Pay ${formatNgn(amountNgn)}`}
          </button>
          <button
            type="button"
            disabled={processing}
            onClick={onCancel}
            className="flex-1 rounded-full border border-white/15 py-3.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
