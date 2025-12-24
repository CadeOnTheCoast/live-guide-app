import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { CaseForChangeView } from "@/components/projects/case-for-change/CaseForChangeView";

export default async function ProjectCaseForChangePage({ params }: { params: { projectSlug: string } }) {
  await getUserOrRedirect();

  const project = await db.project.findUnique({
    where: { slug: params.projectSlug },
    include: {
      primaryOwner: true
    }
  });

  if (!project) return notFound();

  return (
    <CaseForChangeView
      project={project}
    />
  );
}
