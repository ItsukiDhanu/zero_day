import { CommandPalette } from "@/components/command-palette";
import { HeroSection } from "@/components/hero-section";
import { cookies } from "next/headers";
import Link from "next/link";
import { decodeSessionToken } from "@/lib/session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const isAuthenticated = Boolean(decodeSessionToken(sessionToken));

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <CommandPalette isAuthenticated={isAuthenticated} />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // HACKATHON</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                Home
              </Link>
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/register"
                    className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                  >
                    Login
                  </Link>
                </>
              ) : null}
              <Link
                href="/teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-terminal-amber/60 hover:text-terminal-amber"
              >
                Teams
              </Link>
            </nav>
          </div>
        </header>

        <HeroSection />

        <section className="mx-auto mt-10 grid w-full max-w-5xl gap-5 pb-10 md:grid-cols-2">
          <Link
            href="/register"
            className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition hover:border-phosphor/40"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Registration Node</p>
            <h2 className="mt-3 text-xl font-semibold text-neutral-100">Open Registration Workspace</h2>
            <p className="mt-3 text-sm text-neutral-300">
              Submit participant profile, authenticate session, and prep for team operations.
            </p>
          </Link>

          <Link
            href="/teams"
            className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md transition hover:border-terminal-amber/60"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-terminal-amber">Team Console</p>
            <h2 className="mt-3 text-xl font-semibold text-neutral-100">Open Team Operations</h2>
            <p className="mt-3 text-sm text-neutral-300">
              Create team, join via secure code, monitor capacity, and manage registration state.
            </p>
          </Link>
        </section>
      </div>
    </main>
  );
}
