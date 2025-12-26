import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { PressureView } from "@/components/projects/pressure/PressureView";

export default async function ProjectPressurePage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();

  const project = await db.project.findUnique({
    where: { slug: params.projectSlug },
    include: {
      decisionMakers: {
        include: {
          pressureAssets: {
            include: {
              owner: { select: { name: true } }
            }
          }
        }
      },
      pressureAssets: {
        include: {
          decisionMaker: true,
          owner: { select: { name: true } }
        }
      },
      stakeholders: true
    }
  });

  if (!project) return notFound();

  const canEdit = canEditProject(person?.role);

  return (
    <PressureView
      project={project}
      decisionMakers={project.decisionMakers}
      stakeholders={project.stakeholders}
      canEdit={canEdit}
    />
  );
}
