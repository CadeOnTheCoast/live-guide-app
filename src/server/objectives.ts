import { db } from "@/server/db";

export function getCurrentObjectiveForProject(projectId: string) {
  return db.objective.findFirst({
    where: { projectId, isCurrent: true },
    orderBy: { createdAt: "desc" },
    include: {
      keyResults: {
        include: { owner: true, department: true }
      }
    }
  });
}
