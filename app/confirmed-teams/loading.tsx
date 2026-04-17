export default function ConfirmedTeamsLoading() {
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
            <div className="h-4 w-56 animate-pulse rounded bg-neutral-700/70" />
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 animate-pulse rounded bg-neutral-700/70" />
              <div className="h-6 w-16 animate-pulse rounded bg-neutral-700/70" />
              <div className="h-6 w-28 animate-pulse rounded bg-neutral-700/70" />
            </div>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
            <div className="h-3 w-44 animate-pulse rounded bg-phosphor/30" />
            <div className="mt-3 h-8 w-80 animate-pulse rounded bg-neutral-700/70" />

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-28 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-6 w-16 animate-pulse rounded bg-phosphor/30" />
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <div className="h-3 w-44 animate-pulse rounded bg-neutral-700/70" />
                <div className="mt-2 h-6 w-20 animate-pulse rounded bg-terminal-amber/30" />
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <article key={index} className="rounded-xl border border-white/10 bg-black/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="h-5 w-40 animate-pulse rounded bg-neutral-700/70" />
                      <div className="mt-2 h-3 w-24 animate-pulse rounded bg-neutral-700/70" />
                    </div>
                    <div className="h-5 w-20 animate-pulse rounded bg-phosphor/30" />
                  </div>

                  <div className="mt-3 rounded-lg border border-white/10 bg-black/70 p-3">
                    <div className="h-3 w-16 animate-pulse rounded bg-neutral-700/70" />
                    <div className="mt-2 grid gap-2">
                      <div className="h-3 w-48 animate-pulse rounded bg-neutral-700/70" />
                      <div className="h-3 w-44 animate-pulse rounded bg-neutral-700/70" />
                      <div className="h-3 w-36 animate-pulse rounded bg-neutral-700/70" />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
