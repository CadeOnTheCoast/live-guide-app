import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { getCurrentObjectiveForProject } from "@/server/objectives";
import { getCurrentPushForProject } from "@/server/pushes";
import { PushesView } from "@/components/projects/pushes/PushesView";

export default async function ProjectPushesPage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();

  const project = await db.project.findUnique({
    where: { slug: params.projectSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      primaryOwner: { select: { id: true, name: true } },
      pushes: {
        orderBy: { sequenceIndex: "desc" },
        include: {
          activities: {
            include: {
              owner: { select: { id: true, name: true } },
              department: { select: { id: true, name: true, code: true } },
              relatedKr: { select: { id: true, code: true, title: true } },
              relatedMilestone: { select: { id: true, title: true } }
            }
          }
        }
      }
    }
  });

  if (!project) return notFound();

  const [objectives, people, departments, milestones, currentObjective] = await Promise.all([
    db.objective.findMany({
      where: { projectId: project.id },
      select: { id: true, title: true, isCurrent: true }
    }),
    db.person.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.department.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } }),
    db.milestone.findMany({ where: { projectId: project.id }, orderBy: { date: "asc" }, select: { id: true, title: true } }),
    getCurrentObjectiveForProject(project.id)
  ]);

  const currentPush = getCurrentPushForProject(project.pushes);
  const canEdit = canEditProject(person?.role);
  const keyResults = currentObjective?.keyResults ?? [];

  return (
    <PushesView
      project={project}
      pushes={project.pushes}
      canEdit={canEdit}
      people={people}
      departments={departments}
      milestones={milestones}
      objectives={objectives}
      keyResults={keyResults}
      currentPushId={currentPush?.id}
      currentObjectiveId={currentObjective?.id ?? null}
    />
  );
}
