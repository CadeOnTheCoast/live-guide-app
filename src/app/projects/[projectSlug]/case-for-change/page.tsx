import { getProjectBySlug } from "@/server/projects";

export default async function ProjectCaseForChangePage({ params }: { params: { projectSlug: string } }) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) return null;

  return <div className="text-lg font-semibold">Case for change for {project.name}</div>;
}
