import Link from "next/link";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/command-palette";
import { RegistrationForm } from "@/components/registration-form";
import { decodeSessionToken } from "@/lib/session";

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getRedirectTarget(nextParam: string | string[] | undefined) {
  const value = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const isAuthenticated = Boolean(decodeSessionToken(sessionToken));
  const resolvedSearchParams = (await searchParams) ?? {};
  const redirectTarget = getRedirectTarget(resolvedSearchParams.next);

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
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // REGISTRATION</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Home
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Dashboard
                </Link>
              ) : null}
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/register"
                    className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
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
              <Link
                href="/confirmed-teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Confirmed Teams
              </Link>
            </nav>
          </div>
        </header>

        <RegistrationForm redirectTo={redirectTarget} />
      </div>
    </main>
  );
}
