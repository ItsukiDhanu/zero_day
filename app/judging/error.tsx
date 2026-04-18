"use client";

import Link from "next/link";

type JudgingErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function JudgingError({ error, reset }: JudgingErrorProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // JUDGING</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Home
              </Link>
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor transition hover:border-phosphor hover:bg-phosphor/15"
              >
                Retry
              </button>
            </nav>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-terminal-amber/40 bg-black/40 p-6 shadow-glow backdrop-blur-md sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-terminal-amber">Temporary Error</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Unable to load judging workspace</h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
              A temporary server issue occurred while loading judging. Try again now, or come back in a moment.
            </p>
            {error.digest ? (
              <p className="mt-3 text-xs text-neutral-500">Reference: {error.digest}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-phosphor/50 bg-phosphor/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-phosphor transition hover:border-phosphor hover:bg-phosphor/15"
              >
                Retry Judging
              </button>
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300 transition hover:border-terminal-amber/60 hover:text-terminal-amber"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
