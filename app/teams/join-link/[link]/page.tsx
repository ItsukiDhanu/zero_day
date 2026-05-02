import { cookies } from "next/headers";
import Link from "next/link";
import { JoinLinkFlow } from "@/components/join-link-flow";
import { decodeSessionToken } from "@/lib/session";

type PageProps = {
  params: Promise<{ link: string }>;
};

export default async function JoinViaLinkPage({ params }: PageProps) {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const isAuthenticated = Boolean(decodeSessionToken(sessionToken));

  if (!isAuthenticated) {
    const nextTarget = encodeURIComponent(`/teams/join-link/${resolvedParams.link}`);

    return (
      <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4 py-12">
          <div className="w-full rounded-2xl border border-white/10 bg-black/40 p-8 backdrop-blur-md">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Join Link Access</p>
              <h1 className="mt-3 text-2xl font-semibold text-neutral-100 sm:text-3xl">Continue with your account</h1>
              <p className="mt-3 text-sm text-neutral-300">
                To join this team, sign in or create your participant profile first. We&apos;ll send you back to this join link automatically.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href={`/register?next=${nextTarget}`}
                  className="flex min-h-36 flex-col justify-between rounded-2xl border border-phosphor/50 bg-phosphor/10 p-5 text-left transition hover:border-phosphor hover:bg-phosphor/15"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-phosphor/80">New participant</p>
                    <h2 className="mt-3 text-xl font-semibold text-phosphor">Register</h2>
                    <p className="mt-2 text-sm text-neutral-300">
                      Create your account and return here to auto-join the team.
                    </p>
                  </div>
                  <span className="mt-4 text-sm font-semibold text-phosphor">Create account and continue →</span>
                </Link>

                <Link
                  href={`/login?next=${nextTarget}`}
                  className="flex min-h-36 flex-col justify-between rounded-2xl border border-white/15 bg-black/50 p-5 text-left transition hover:border-terminal-amber/60 hover:bg-terminal-amber/10"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-terminal-amber/80">Existing participant</p>
                    <h2 className="mt-3 text-xl font-semibold text-neutral-100">Login</h2>
                    <p className="mt-2 text-sm text-neutral-300">
                      Sign in with your existing account and we&apos;ll continue the team join.
                    </p>
                  </div>
                  <span className="mt-4 text-sm font-semibold text-terminal-amber">Sign in and continue →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <JoinLinkFlow link={resolvedParams.link} />;
}
