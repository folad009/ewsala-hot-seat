import { DailyTrivia } from "@/components/DailyTrivia";

type SearchParams = { date?: string | string[] };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const raw = params.date;
  const dateParam =
    typeof raw === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;

  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(251,191,36,0.07) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8 sm:py-12">
        <header className="mb-8 space-y-3 sm:mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-400/90">
            Daily trivia
          </p>
          <h1 className="font-(family-name:--font-stage) text-4xl font-bold uppercase leading-[0.95] tracking-tight text-slate-50 sm:text-5xl">
            Eswala
            <span className="block bg-linear-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent">
             Trivia
            </span>
          </h1>
        </header>

        <DailyTrivia initialDateParam={dateParam} />

        {/*<footer className="mt-14 border-t border-white/[0.06] pt-8 text-center text-[11px] leading-relaxed text-slate-500">
          <p>
            <span className="text-slate-600">Developers:</span>{" "}
            <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-slate-400">
              GET /api/daily
            </code>{" "}
            ·{" "}
            <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-slate-400">
              POST /api/answer
            </code>{" "}
            ·{" "}
            <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-slate-400">
              POST /api/submit
            </code>
          </p>
          <p className="mt-2">
            Test a fixed day:{" "}
            <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-slate-400">
              ?date=YYYY-MM-DD
            </code>{" "}
            (Lagos)
          </p>
        </footer>*/}
      </div>
    </div>
  );
}
