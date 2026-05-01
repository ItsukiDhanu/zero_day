import { prisma } from "@/lib/prisma";

export type ConfirmedTeamCount = {
  teamId: string;
  memberCount: number;
};

export async function getConfirmedTeamCounts(): Promise<ConfirmedTeamCount[]> {
  const rows = await prisma.$queryRaw<ConfirmedTeamCount[]>`
    SELECT u."teamId", COUNT(*)::int AS "memberCount"
    FROM "User" u
    INNER JOIN "Team" t ON t."id" = u."teamId"
    INNER JOIN "TeamPayment" tp
      ON tp."team_id" = u."teamId"
      AND tp."status" = 'VERIFIED'
      AND tp."payment_purpose" = 'REGISTRATION'
    WHERE u."teamId" IS NOT NULL
    GROUP BY u."teamId", t."extra_slot_unlocked"
    HAVING COUNT(*) BETWEEN 2 AND CASE WHEN t."extra_slot_unlocked" THEN 5 ELSE 4 END
  `;

  return rows;
}
