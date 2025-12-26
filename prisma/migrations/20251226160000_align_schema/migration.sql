-- AlterTable
ALTER TABLE "Project" ADD COLUMN "historyDebrief" TEXT,
ADD COLUMN "asanaWorkspaceGid" TEXT,
ADD COLUMN "asanaTeamGid" TEXT,
ADD COLUMN "asanaUrl" TEXT,
ADD COLUMN "teamsUrl" TEXT,
ADD COLUMN "projectFolderUrl" TEXT,
ADD COLUMN "projectNotesUrl" TEXT,
ADD COLUMN "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "DecisionMaker" ADD COLUMN "reason" TEXT,
ADD COLUMN "pressurePoints" TEXT,
ADD COLUMN "influencers" TEXT,
ADD COLUMN "everyActionUrl" TEXT;

-- AlterTable
ALTER TABLE "Stakeholder" ADD COLUMN "reason" TEXT,
ADD COLUMN "captains" TEXT,
ADD COLUMN "planToEducate" TEXT,
ADD COLUMN "planToCounter" TEXT,
ADD COLUMN "audience" TEXT,
ADD COLUMN "plan" TEXT,
ADD COLUMN "everyActionUrl" TEXT,
ADD COLUMN "influencers" TEXT;

-- CreateTable
CREATE TABLE "AuditLog" (
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
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorEmail_idx" ON "AuditLog"("actorEmail");
