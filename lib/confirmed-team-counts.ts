import { prisma } from "@/lib/prisma";

export type ConfirmedTeamCount = {
  teamId: string;
  memberCount: number;
};

export async function getConfirmedTeamCounts(): Promise<ConfirmedTeamCount[]> {
  const rows = await prisma.$queryRaw<ConfirmedTeamCount[]>`
    SELECT u."teamId", COUNT(*)::int AS "memberCount"
    FROM "User" u
    INNER JOIN "TeamPayment" tp
      ON tp."team_id" = u."teamId"
      AND tp."status" = 'VERIFIED'
      AND tp."payment_purpose" = 'REGISTRATION'
    WHERE u."teamId" IS NOT NULL
    GROUP BY u."teamId"
    HAVING COUNT(*) BETWEEN 2 AND 4
  `;

  return rows;
}
