-- AlterTable
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "historyDebrief" TEXT,
ADD COLUMN IF NOT EXISTS "asanaWorkspaceGid" TEXT,
ADD COLUMN IF NOT EXISTS "asanaTeamGid" TEXT,
ADD COLUMN IF NOT EXISTS "asanaUrl" TEXT,
ADD COLUMN IF NOT EXISTS "teamsUrl" TEXT,
ADD COLUMN IF NOT EXISTS "projectFolderUrl" TEXT,
ADD COLUMN IF NOT EXISTS "projectNotesUrl" TEXT,
ADD COLUMN IF NOT EXISTS "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DecisionMaker" ADD COLUMN IF NOT EXISTS "reason" TEXT,
ADD COLUMN IF NOT EXISTS "pressurePoints" TEXT,
ADD COLUMN IF NOT EXISTS "influencers" TEXT,
ADD COLUMN IF NOT EXISTS "everyActionUrl" TEXT;

-- AlterTable
ALTER TABLE "Stakeholder" ADD COLUMN IF NOT EXISTS "reason" TEXT,
ADD COLUMN IF NOT EXISTS "captains" TEXT,
ADD COLUMN IF NOT EXISTS "planToEducate" TEXT,
ADD COLUMN IF NOT EXISTS "planToCounter" TEXT,
ADD COLUMN IF NOT EXISTS "audience" TEXT,
ADD COLUMN IF NOT EXISTS "plan" TEXT,
ADD COLUMN IF NOT EXISTS "everyActionUrl" TEXT,
ADD COLUMN IF NOT EXISTS "influencers" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorUserId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail");
