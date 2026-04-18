import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CommandPalette } from "@/components/command-palette";
import { DashboardSessionCard } from "@/components/dashboard-session-card";
import { canAccessJudging } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decodeSessionToken } from "@/lib/session";
import { getOrCreateSiteSettings } from "@/lib/site-settings";

const YEAR_LABELS = {
  FIRST_YEAR: "1st Year",
  SECOND_YEAR: "2nd Year",
} as const;

function formatYear(year: keyof typeof YEAR_LABELS | null) {
  if (!year) {
    return "Not provided";
  }

  return YEAR_LABELS[year] ?? year;
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const userId = decodeSessionToken(sessionToken);

  if (!userId) {
    redirect("/login?next=/dashboard");
  }

  const [user, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        year: true,
        branch: true,
        phoneNumber: true,
        team: {
          select: {
            id: true,
            name: true,
            joinCode: true,
            captainId: true,
            _count: {
              select: {
                members: true,
              },
            },
            members: {
              orderBy: { createdAt: "asc" },
              take: 4,
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    getOrCreateSiteSettings(),
  ]);

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const team = user.team;
  const captainId = team ? team.captainId ?? team.members[0]?.id ?? null : null;
  const isCaptain = captainId === user.id;

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 pb-12 text-neutral-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-phosphor/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-terminal-amber/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_45%)]" />
      </div>

      <CommandPalette isAuthenticated />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        <header className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // DASHBOARD</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                Dashboard
              </Link>
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
              {user.role === "ORGANIZER" || user.role === "ADMIN" ? (
                <Link
                  href="/organizer"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Organizer
                </Link>
              ) : null}
              {canAccessJudging(user.role) ? (
                <Link
                  href="/judging"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Judging
                </Link>
              ) : null}
              {user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Admin
                </Link>
              ) : null}
            </nav>
          </div>
        </header>

        <DashboardSessionCard email={user.email} role={user.role} />

        <section className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Participant Profile</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-100">{user.name || "Participant"}</h2>

            <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-neutral-400">Email</dt>
                <dd className="mt-1 break-all text-neutral-100">{user.email}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-neutral-400">Role</dt>
                <dd className="mt-1 text-neutral-100">{user.role}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-neutral-400">Year</dt>
                <dd className="mt-1 text-neutral-100">{formatYear(user.year)}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-neutral-400">Department</dt>
                <dd className="mt-1 text-neutral-100">{user.branch || "Not provided"}</dd>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.18em] text-neutral-400">Phone</dt>
                <dd className="mt-1 text-neutral-100">{user.phoneNumber || "Not provided"}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.2em] text-terminal-amber">Participation Status</p>
            <h2 className="mt-2 text-2xl font-semibold text-neutral-100">
              {team ? `Team: ${team.name}` : "No Team Linked Yet"}
            </h2>

            <div
              className={`mt-5 rounded-lg border px-3 py-2 text-sm ${
                settings.registrationOpen
                  ? "border-phosphor/40 bg-phosphor/10 text-phosphor"
                  : "border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber"
              }`}
            >
              Registration Status: {settings.registrationOpen ? "OPEN" : "CLOSED"}
            </div>

            {team ? (
              <div className="mt-4 grid gap-3 text-sm">
                <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Join Code</p>
                  <p className="mt-1 text-lg font-semibold tracking-[0.26em] text-phosphor">{team.joinCode}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Your Team Role</p>
                  <p className="mt-1 text-neutral-100">{isCaptain ? "Captain" : "Member"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Team Capacity</p>
                  <p className="mt-1 text-neutral-100">{team._count.members}/4 members</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Members</p>
                  <ul className="mt-2 grid gap-1">
                    {team.members.map((member) => (
                      <li key={member.id} className="text-neutral-200">
                        {member.name || member.email}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-white/10 bg-black/60 px-3 py-3 text-sm text-neutral-300">
                Head to Team Ops to create or join a team before the event starts.
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/teams"
                className="rounded-lg border border-terminal-amber/80 bg-terminal-amber/10 px-4 py-2 text-sm font-semibold text-terminal-amber transition hover:bg-terminal-amber/20"
              >
                Open Team Ops
              </Link>
              <Link
                href="/forgot-password"
                className="rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-sm font-semibold text-neutral-200 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Reset Password
              </Link>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
