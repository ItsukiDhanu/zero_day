export default function DashboardLoading() {
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
            <div className="h-4 w-52 animate-pulse rounded bg-neutral-700/70" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-14 animate-pulse rounded bg-neutral-700/70" />
              <div className="h-6 w-20 animate-pulse rounded bg-neutral-700/70" />
              <div className="h-6 w-14 animate-pulse rounded bg-neutral-700/70" />
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow">
            <div className="h-3 w-36 animate-pulse rounded bg-phosphor/30" />
            <div className="mt-3 h-8 w-52 animate-pulse rounded bg-neutral-700/70" />

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-12 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-44 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-10 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-16 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-10 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 sm:col-span-2">
                <div className="h-3 w-14 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded bg-neutral-700/70" />
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
            <div className="h-3 w-36 animate-pulse rounded bg-terminal-amber/30" />
            <div className="mt-3 h-8 w-52 animate-pulse rounded bg-neutral-700/70" />
            <div className="mt-5 h-10 w-full animate-pulse rounded-lg bg-phosphor/20" />

            <div className="mt-4 grid gap-3">
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-14 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-20 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-20 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-16 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-16 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-4 w-28 animate-pulse rounded bg-neutral-700/70" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-16 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 grid gap-2">
                  <div className="h-3 w-44 animate-pulse rounded bg-neutral-700/70" />
                  <div className="h-3 w-40 animate-pulse rounded bg-neutral-700/70" />
                  <div className="h-3 w-36 animate-pulse rounded bg-neutral-700/70" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <div className="h-10 w-32 animate-pulse rounded-lg bg-terminal-amber/30" />
              <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-700/70" />
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
