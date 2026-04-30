import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CommandPalette } from "@/components/command-palette";
import { TeamDashboardShell } from "@/components/team-dashboard-shell";
import { canAccessJudging } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decodeSessionToken } from "@/lib/session";
import { getOrCreateSiteSettings } from "@/lib/site-settings";

function mapTeamState(team: {
  id: string;
  name: string;
  joinCode: string;
  captainId: string | null;
  _count: { members: number };
  members: Array<{ id: string; name: string | null; email: string }>;
}) {
  const captainId = team.captainId ?? team.members[0]?.id ?? null;

  return {
    id: team.id,
    name: team.name,
    joinCode: team.joinCode,
    memberCount: team._count.members,
    members: team.members.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      isCaptain: captainId === member.id,
    })),
  };
}

export default async function TeamsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const userId = decodeSessionToken(sessionToken);

  if (!userId) {
    redirect("/register");
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
        teamId: true,
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
    redirect("/register");
  }

  const isAuthenticated = true;
  const initialTeam = user.team ? mapTeamState(user.team) : null;
  const initialRegistrationOpen = settings.registrationOpen;

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
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // TEAM OPS</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Dashboard
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
              <Link
                href="/confirmed-teams"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Confirmed Teams
              </Link>
              <Link
                href="/teams"
                className="rounded-md border border-terminal-amber/60 bg-terminal-amber/10 px-2.5 py-1 text-terminal-amber"
              >
                Teams
              </Link>
              {user.teamId ? (
                <Link
                  href="/payment"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Payment
                </Link>
              ) : null}
            </nav>
          </div>
        </header>

        <TeamDashboardShell
          initialUser={{
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
            year: user.year,
            branch: user.branch,
            phoneNumber: user.phoneNumber,
            teamId: user.teamId,
          }}
          initialTeam={initialTeam}
          initialRegistrationOpen={initialRegistrationOpen}
        />
      </div>
    </main>
  );
}
