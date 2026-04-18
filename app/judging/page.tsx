import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { CommandPalette } from "@/components/command-palette";
import { JudgingBoard, type JudgingTeamState } from "@/components/judging-board";
import { canAccessJudging, canManageSiteSettings } from "@/lib/auth";
import { getConfirmedTeamCounts } from "@/lib/confirmed-team-counts";
import { prisma } from "@/lib/prisma";
import { decodeSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

type TeamJudgingScoreRow = {
  teamId: string;
  innovationScore: number;
  impactScore: number;
  implementationScore: number;
  presentationScore: number;
  ruleAdherenceScore: number;
  comments: string | null;
  updatedByEmail: string | null;
  updatedAt: Date;
};

const prismaWithJudging = prisma as typeof prisma & {
  teamJudgingScore: {
    findMany: (args: unknown) => Promise<TeamJudgingScoreRow[]>;
  };
};

function displayMemberName(member: { name: string | null; email: string }) {
  if (member.name?.trim()) {
    return member.name.trim();
  }

  const emailPrefix = member.email.split("@")[0]?.trim();
  return emailPrefix || "Unnamed Participant";
}

export default async function JudgingPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const userId = decodeSessionToken(sessionToken);

  if (!userId) {
    redirect("/login?next=/judging");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
    },
  });

  if (!currentUser || !canAccessJudging(currentUser.role)) {
    notFound();
  }

  const confirmedTeamCounts = await getConfirmedTeamCounts();
  const confirmedTeamIds = confirmedTeamCounts.map((team) => team.teamId);
  const confirmedTeamCountById = new Map(
    confirmedTeamCounts.map((team) => [team.teamId, team.memberCount]),
  );

  const teams = confirmedTeamIds.length
    ? await prisma.team.findMany({
        where: {
          id: {
            in: confirmedTeamIds,
          },
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          repositoryUrl: true,
          members: {
            orderBy: { createdAt: "asc" },
            take: 4,
            select: {
              email: true,
              name: true,
            },
          },
        },
      })
    : [];

  const judgingScores = confirmedTeamIds.length
    ? await prismaWithJudging.teamJudgingScore.findMany({
        where: {
          teamId: {
            in: confirmedTeamIds,
          },
        },
        select: {
          teamId: true,
          innovationScore: true,
          impactScore: true,
          implementationScore: true,
          presentationScore: true,
          ruleAdherenceScore: true,
          comments: true,
          updatedByEmail: true,
          updatedAt: true,
        },
      })
    : [];

  const judgingByTeamId = new Map(judgingScores.map((judgingScore) => [judgingScore.teamId, judgingScore]));

  const judgingTeams: JudgingTeamState[] = teams.map((team) => {
    const judgingScore = judgingByTeamId.get(team.id);

    return {
      id: team.id,
      name: team.name,
      memberCount: confirmedTeamCountById.get(team.id) ?? team.members.length,
      members: team.members.map(displayMemberName),
      repositoryUrl: team.repositoryUrl,
      judging: judgingScore
        ? {
            innovationScore: judgingScore.innovationScore,
            impactScore: judgingScore.impactScore,
            implementationScore: judgingScore.implementationScore,
            presentationScore: judgingScore.presentationScore,
            ruleAdherenceScore: judgingScore.ruleAdherenceScore,
            comments: judgingScore.comments,
            updatedByEmail: judgingScore.updatedByEmail,
            updatedAt: judgingScore.updatedAt.toISOString(),
          }
        : null,
    };
  });

  const judgedTeamCount = judgingTeams.filter((team) => Boolean(team.judging)).length;
  const repositorySubmittedCount = judgingTeams.filter((team) => Boolean(team.repositoryUrl)).length;

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
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // JUDGING</p>
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
              {canManageSiteSettings(currentUser.role) ? (
                <Link
                  href="/organizer"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Organizer
                </Link>
              ) : null}
              {currentUser.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
                >
                  Admin
                </Link>
              ) : null}
              <Link
                href="/judging"
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                Judging
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur-md shadow-glow sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-phosphor/90">Jury Workspace</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">
              Team Evaluation Board (100 Points)
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
              Scores are mapped to the rules page rubric. Each criterion is scored out of 20: Innovation,
              Impact, Implementation, Presentation, and Rule Adherence.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Confirmed Teams</p>
                <p className="mt-1 text-lg font-semibold text-phosphor">{judgingTeams.length}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Judged Teams</p>
                <p className="mt-1 text-lg font-semibold text-terminal-amber">{judgedTeamCount}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/60 px-3 py-2">
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Repository Submitted</p>
                <p className="mt-1 text-lg font-semibold text-phosphor">{repositorySubmittedCount}</p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-white/10 bg-black/60 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-neutral-400">Rubric Reference</p>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-neutral-300">
                <li>Innovation (0-20): novelty and originality of the idea.</li>
                <li>Impact (0-20): relevance, usefulness, and practical value.</li>
                <li>Implementation (0-20): technical execution and code quality.</li>
                <li>Presentation (0-20): demo clarity and communication.</li>
                <li>Rule Adherence (0-20): fair play, repository readiness, and team collaboration.</li>
              </ul>
            </div>

            <JudgingBoard initialTeams={judgingTeams} />
          </div>
        </section>
      </div>
    </main>
  );
}
