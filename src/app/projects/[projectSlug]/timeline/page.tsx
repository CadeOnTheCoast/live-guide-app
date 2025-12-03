import { ProjectTimelineView } from "@/components/projects/timeline/ProjectTimelineView";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { getUserOrRedirect } from "@/server/auth";
import { db } from "@/server/db";
import { canEditProject } from "@/server/permissions";

export default async function ProjectTimelinePage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();

  const project = await db.project.findUnique({
    where: { slug: params.projectSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      primaryOwner: { select: { id: true, name: true } },
      milestones: {
        orderBy: { date: "asc" },
        include: {
          leadDepartment: { select: { id: true, name: true, code: true } },
          relatedObjective: { select: { id: true, title: true } },
          push: { select: { id: true, name: true, startDate: true, endDate: true, sequenceIndex: true } },
          activities: { select: { id: true, title: true, status: true, relatedMilestoneId: true } },
          commsItems: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              plannedDate: true,
              actualDate: true,
              relatedMilestoneId: true
            }
          },
          pressureAssets: { select: { id: true, title: true, corner: true, powerRating: true, relatedMilestoneId: true } }
        }
      },
      pushes: {
        orderBy: { sequenceIndex: "asc" },
        select: { id: true, name: true, startDate: true, endDate: true, sequenceIndex: true }
      }
    }
  });

  if (!project) {
    return <div className="text-sm text-muted-foreground">Project not found</div>;
  }

  const [departments, objectives] = await Promise.all([
    db.department.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } }),
    db.objective.findMany({ where: { projectId: project.id }, select: { id: true, title: true } })
  ]);

  const canEdit = canEditProject(person?.role);

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={{
          name: project.name,
          status: project.status,
          primaryOwnerName: project.primaryOwner?.name
        }}
      />
      <ProjectTimelineView
        project={project}
        milestones={project.milestones}
        canEdit={canEdit}
        departments={departments}
        objectives={objectives}
        pushes={project.pushes}
      />
    </div>
  );
}
