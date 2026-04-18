-- CreateTable
CREATE TABLE "TeamJudgingScore" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "innovation_score" INTEGER NOT NULL DEFAULT 0,
    "impact_score" INTEGER NOT NULL DEFAULT 0,
    "implementation_score" INTEGER NOT NULL DEFAULT 0,
    "presentation_score" INTEGER NOT NULL DEFAULT 0,
    "rule_adherence_score" INTEGER NOT NULL DEFAULT 0,
    "comments" TEXT,
    "updated_by_email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamJudgingScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamJudgingScore_team_id_key" ON "TeamJudgingScore"("team_id");

-- CreateIndex
CREATE INDEX "TeamJudgingScore_updatedAt_idx" ON "TeamJudgingScore"("updatedAt");

-- AddForeignKey
ALTER TABLE "TeamJudgingScore" ADD CONSTRAINT "TeamJudgingScore_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
