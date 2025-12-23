import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { CommsView } from "@/components/projects/comms/CommsView";

export default async function ProjectCommsPage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();

  const project = await db.project.findUnique({
    where: { slug: params.projectSlug },
    include: {
      commsProfile: {
        include: {
          keyMessages: { orderBy: { priorityOrder: "asc" } },
          callsToAction: true,
          commsFrames: true,
          commsFaqs: { orderBy: { priorityOrder: "asc" } }
        }
      },
      commsItems: {
        orderBy: { plannedDate: "asc" },
        include: {
          owner: { select: { name: true } }
        }
      }
    }
  });

  if (!project) return notFound();

  const canEdit = canEditProject(person?.role);

  return (
    <CommsView
      project={project}
      commsProfile={project.commsProfile}
      commsItems={project.commsItems}
      canEdit={canEdit}
    />
  );
}
