import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { CommandPalette } from "@/components/command-palette";
import { JudgingBoard, type JudgingTeamState } from "@/components/judging-board";
import { canAccessJudging, canManageSiteSettings } from "@/lib/auth";
import { getConfirmedTeamCounts } from "@/lib/confirmed-team-counts";
import { prisma } from "@/lib/prisma";
import { decodeSessionToken } from "@/lib/session";
import { EXTRA_SLOT_TEAM_MEMBER_LIMIT } from "@/lib/team-capacity";

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

type JudgingTeamRow = {
  id: string;
  name: string;
  repositoryUrl: string | null;
  extraSlotUnlocked: boolean;
  members: Array<{
    email: string;
    name: string | null;
  }>;
};

const currentUserSelect = {
  id: true,
  role: true,
} satisfies Prisma.UserSelect;

type JudgingCurrentUserRow = Prisma.UserGetPayload<{
  select: typeof currentUserSelect;
}>;

const prismaWithJudging = prisma as typeof prisma & {
  teamJudgingScore: {
    findMany: (args: unknown) => Promise<TeamJudgingScoreRow[]>;
  };
};

const DB_RETRY_ATTEMPTS = 2;
const DB_RETRY_BACKOFF_MS = 200;

function displayMemberName(member: { name: string | null; email: string }) {
  if (member.name?.trim()) {
    return member.name.trim();
  }

  const emailPrefix = member.email.split("@")[0]?.trim();
  return emailPrefix || "Unnamed Participant";
}

function displayUpdaterName(name: string | null, email: string) {
  if (name?.trim()) {
    return name.trim();
  }

  const emailPrefix = email.split("@")[0]?.trim();
  return emailPrefix || email;
}

function isDatabaseConnectivityError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PrismaClientInitializationError" ||
    /can't reach database server/i.test(error.message) ||
    /connect timeout/i.test(error.message)
  );
}

async function runWithDatabaseRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 0; attempt < DB_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isDatabaseConnectivityError(error) || attempt === DB_RETRY_ATTEMPTS - 1) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, DB_RETRY_BACKOFF_MS * (attempt + 1)));
    }
  }

  throw lastError;
}

function JudgingUnavailableState() {
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
            <p className="text-sm font-semibold tracking-[0.2em] text-phosphor">ZERO_DAY // JUDGING</p>
            <nav className="flex flex-wrap items-center gap-2 text-xs">
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-2.5 py-1 text-neutral-300 transition hover:border-phosphor/40 hover:text-phosphor"
              >
                Home
              </Link>
              <Link
                href="/judging"
                className="rounded-md border border-phosphor/40 bg-phosphor/10 px-2.5 py-1 text-phosphor"
              >
                Retry
              </Link>
            </nav>
          </div>
        </header>

        <section className="mx-auto mt-10 w-full max-w-5xl pb-12">
          <div className="rounded-2xl border border-terminal-amber/40 bg-black/40 p-6 shadow-glow backdrop-blur-md sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-terminal-amber">Temporary Service Disruption</p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-100 sm:text-3xl">Judging workspace is unavailable</h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-300 sm:text-base">
              We could not establish a database connection right now. Please retry in a few seconds.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/judging"
                className="rounded-md border border-phosphor/50 bg-phosphor/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-phosphor transition hover:border-phosphor hover:bg-phosphor/15"
              >
                Retry Judging
              </Link>
              <Link
                href="/"
                className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300 transition hover:border-terminal-amber/60 hover:text-terminal-amber"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function JudgingPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("zd_session")?.value;
  const userId = decodeSessionToken(sessionToken);

  if (!userId) {
    redirect("/login?next=/judging");
  }

  let currentUser: JudgingCurrentUserRow | null = null;

  try {
    currentUser = await runWithDatabaseRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: currentUserSelect,
      }),
    );
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return <JudgingUnavailableState />;
    }

    throw error;
  }

  if (!currentUser || !canAccessJudging(currentUser.role)) {
    notFound();
  }

  let confirmedTeamCounts: Awaited<ReturnType<typeof getConfirmedTeamCounts>> = [];
  let teams: JudgingTeamRow[] = [];
  let judgingScores: TeamJudgingScoreRow[] = [];

  try {
    confirmedTeamCounts = await runWithDatabaseRetry(() => getConfirmedTeamCounts());
    const confirmedTeamIds = confirmedTeamCounts.map((team) => team.teamId);

    teams = confirmedTeamIds.length
      ? await runWithDatabaseRetry(() =>
          prisma.team.findMany({
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
                take: EXTRA_SLOT_TEAM_MEMBER_LIMIT,
                select: {
                  email: true,
                  name: true,
                },
              },
                extraSlotUnlocked: true,
            },
          }),
        )
      : [];

    judgingScores = confirmedTeamIds.length
      ? await runWithDatabaseRetry(() =>
          prismaWithJudging.teamJudgingScore.findMany({
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
          }),
        )
      : [];
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      return <JudgingUnavailableState />;
    }

    throw error;
  }

  const confirmedTeamCountById = new Map(
    confirmedTeamCounts.map((team) => [team.teamId, team.memberCount]),
  );

  const updatedByEmails = Array.from(
    new Set(
      judgingScores
        .map((judgingScore) => judgingScore.updatedByEmail?.trim())
        .filter((email): email is string => Boolean(email)),
    ),
  );

  const judges = updatedByEmails.length
    ? await runWithDatabaseRetry(() =>
        prisma.user.findMany({
          where: {
            email: {
              in: updatedByEmails,
            },
          },
          select: {
            email: true,
            name: true,
          },
        }),
      ).catch((error) => {
        if (isDatabaseConnectivityError(error)) {
          return [];
        }

        throw error;
      })
    : [];

  const judgeNameByEmail = new Map(judges.map((judge) => [judge.email.trim(), judge.name]));

  const judgingByTeamId = new Map(judgingScores.map((judgingScore) => [judgingScore.teamId, judgingScore]));

  const judgingTeams: JudgingTeamState[] = teams.map((team) => {
    const judgingScore = judgingByTeamId.get(team.id);

    return {
      id: team.id,
      name: team.name,
      memberCount: confirmedTeamCountById.get(team.id) ?? team.members.length,
      extraSlotUnlocked: team.extraSlotUnlocked,
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
            updatedByName: judgingScore.updatedByEmail
              ? displayUpdaterName(
                  judgeNameByEmail.get(judgingScore.updatedByEmail.trim()) ?? null,
                  judgingScore.updatedByEmail,
                )
              : null,
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
              Scores are mapped to the rules page rubric across Innovation, Impact, Implementation,
              Presentation, and Rule Adherence.
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
                <li>Innovation: novelty and originality of the idea.</li>
                <li>Impact: relevance, usefulness, and practical value.</li>
                <li>Implementation: technical execution and code quality.</li>
                <li>Presentation: demo clarity and communication.</li>
                <li>Rule Adherence: fair play, repository readiness, and team collaboration.</li>
              </ul>
            </div>

            <JudgingBoard initialTeams={judgingTeams} />
          </div>
        </section>
      </div>
    </main>
  );
}
