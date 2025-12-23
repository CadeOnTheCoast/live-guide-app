import { db } from "@/server/db";

export function getProjectOverviewBySlug(slug: string) {
  return db.project.findUnique({
    where: { slug },
    include: {
      primaryOwner: { select: { id: true, name: true } },
      pushes: true,
      commsProfile: {
        include: {
          keyMessages: true
        }
      }
    }
  });
}

export function getProjectBySlug(slug: string) {
  return db.project.findUnique({
    where: { slug },
    include: {
      primaryOwner: { select: { id: true, name: true } }
    }
  });
}

export function getAllProjectsWithTimelineData() {
  return db.project.findMany({
    orderBy: { name: "asc" },
    include: {
      milestones: {
        include: {
          leadDepartment: { select: { id: true, name: true, code: true } }
        }
      },
      keyResults: {
        select: {
          id: true,
          code: true,
          title: true,
          dueDate: true,
          status: true,
          departmentId: true
        }
      }
    }
  });
}
