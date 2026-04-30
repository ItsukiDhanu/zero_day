export default function PaymentLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="h-4 w-56 animate-pulse rounded bg-white/10" />
        </header>

        <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
          <div className="mb-6 space-y-3">
            <div className="h-3 w-40 animate-pulse rounded bg-phosphor/20" />
            <div className="h-8 w-64 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-full animate-pulse rounded bg-white/10" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          </div>

          <div className="rounded-lg border border-white/10 bg-black/40 p-6">
            <div className="space-y-4">
              <div className="h-10 w-40 animate-pulse rounded bg-phosphor/15" />
              <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
              <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-10 w-full animate-pulse rounded bg-white/10" />
              <div className="h-10 w-full animate-pulse rounded bg-phosphor/20" />
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
