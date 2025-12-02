import { getProjectBySlug } from "@/server/projects";

export default async function ProjectOverviewPage({ params }: { params: { projectSlug: string } }) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) return null;

  return <div className="text-lg font-semibold">Overview for {project.name}</div>;
}
