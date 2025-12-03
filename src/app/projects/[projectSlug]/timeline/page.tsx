import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { ProjectTimelineView } from "@/components/projects/timeline/ProjectTimelineView";

export default async function ProjectTimelinePage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();

  const project = await db.project.findUnique({
    where: { slug: params.projectSlug },
    include: {
      primaryOwner: { select: { id: true, name: true } },
      milestones: {
        orderBy: { date: "asc" },
        include: {
          activities: true,
          commsItems: true,
          pressureAssets: true,
          relatedObjective: { select: { id: true, title: true } },
          leadDepartment: { select: { id: true, name: true, code: true } },
          push: { select: { id: true, name: true, startDate: true, endDate: true } }
        }
      }
    }
  });

  if (!project) return notFound();

  const [departments, objectives, pushes] = await Promise.all([
    db.department.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } }),
    db.objective.findMany({ where: { projectId: project.id }, select: { id: true, title: true } }),
    db.push.findMany({ where: { projectId: project.id }, orderBy: { startDate: "asc" }, select: { id: true, name: true, startDate: true, endDate: true } })
  ]);

  const canEdit = canEditProject(person?.role);

  return (
    <ProjectTimelineView
      project={{
        id: project.id,
        name: project.name,
        slug: project.slug,
        status: project.status,
        primaryOwnerName: project.primaryOwner?.name ?? null,
        asanaProjectGid: (project as { asanaProjectGid?: string | null }).asanaProjectGid ?? null,
        caseForChangePageUrl: (project as { caseForChangePageUrl?: string | null }).caseForChangePageUrl ?? null
      }}
      milestones={project.milestones}
      canEdit={canEdit}
      departments={departments}
      objectives={objectives}
      pushes={pushes}
    />
  );
}
