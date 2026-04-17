import Link from "next/link";
import { cookies } from "next/headers";
import { CommandPalette } from "@/components/command-palette";
import { prisma } from "@/lib/prisma";
import { decodeSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

function displayMemberName(member: { name: string | null; email: string }) {
  if (member.name?.trim()) {
    return member.name.trim();
  }

  const emailPrefix = member.email.split("@")[0]?.trim();
  return emailPrefix || "Unnamed Participant";
}

export default async function ConfirmedTeamsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const isAuthenticated = Boolean(decodeSessionToken(sessionToken));

  const teams = await prisma.team.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      joinCode: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
        },
      },
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  const confirmedTeams = teams.filter(
    (team) => team._count.members >= 2 && team._count.members <= 4,
  );

  const confirmedParticipantCount = confirmedTeams.reduce(
    (sum, team) => sum + team._count.members,
    0,
  );

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
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // CONFIRMED TEAMS</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
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
              ) : (
                <Link
                  href="/dashboard"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-terminal-amber/60 hover:text-terminal-amber"
              >
                Teams
              </Link>
              <Link
                href="/confirmed-teams"
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                Confirmed Teams
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Public Team Roster</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Confirmed Teams (2-4 Members)</h1>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Confirmed Teams</p>
                <p className="mt-1 text-lg font-semibold text-phosphor">{confirmedTeams.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Participants in Confirmed Teams</p>
                <p className="mt-1 text-lg font-semibold text-terminal-amber">{confirmedParticipantCount}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {confirmedTeams.length === 0 ? (
                <p className="rounded-lg border border-white/10 bg-black/60 px-3 py-3 text-sm text-neutral-400">
                  No confirmed teams yet. A team appears here when it has at least 2 members.
                </p>
              ) : (
                confirmedTeams.map((team) => (
                  <article key={team.id} className="rounded-xl border border-white/10 bg-black/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-neutral-100">{team.name}</h2>
                        <p className="mt-1 text-xs text-neutral-400">
                          Join Code: {team.joinCode} • {team._count.members}/4 members
                        </p>
                      </div>
                      <span className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2 py-1 text-[11px] font-semibold text-phosphor">
                        CONFIRMED
                      </span>
                    </div>

                    <div className="mt-3 rounded-lg border border-white/10 bg-black/70 p-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Members</p>
                      <ul className="mt-2 grid gap-1 text-sm text-neutral-200">
                        {team.members.map((member) => (
                          <li key={member.id}>{displayMemberName(member)}</li>
                        ))}
                      </ul>
                    </div>
                  </article>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}