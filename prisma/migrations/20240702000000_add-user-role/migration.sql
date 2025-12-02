-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VIEWER';
