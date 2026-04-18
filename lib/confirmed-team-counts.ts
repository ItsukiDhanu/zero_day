import { prisma } from "@/lib/prisma";

export type ConfirmedTeamCount = {
  teamId: string;
  memberCount: number;
};

export async function getConfirmedTeamCounts(): Promise<ConfirmedTeamCount[]> {
  const rows = await prisma.$queryRaw<ConfirmedTeamCount[]>`
    SELECT "teamId", COUNT(*)::int AS "memberCount"
    FROM "User"
    WHERE "teamId" IS NOT NULL
    GROUP BY "teamId"
    HAVING COUNT(*) BETWEEN 2 AND 4
  `;

  return rows;
}
