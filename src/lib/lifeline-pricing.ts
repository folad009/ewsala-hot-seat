export type LifelineKind = "fifty" | "audience";

function parseNgn(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** One-off fee per lifeline use (NGN). Set NEXT_PUBLIC_LIFELINE_FEE_* in .env.local */
export function getLifelineFeeNgn(kind: LifelineKind): number {
  const fifty = parseNgn(process.env.NEXT_PUBLIC_LIFELINE_FEE_FIFTY_NGN, 500);
  const audience = parseNgn(process.env.NEXT_PUBLIC_LIFELINE_FEE_AUDIENCE_NGN, 700);
  return kind === "fifty" ? fifty : audience;
}

export function formatNgn(n: number): string {
  return `₦${n.toLocaleString("en-NG")}`;
}
