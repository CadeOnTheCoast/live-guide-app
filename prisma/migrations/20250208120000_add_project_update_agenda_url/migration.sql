-- Add projectUpdateAgendaUrl column to Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectUpdateAgendaUrl" TEXT;
