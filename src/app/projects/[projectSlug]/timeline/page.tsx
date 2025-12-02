import { getProjectBySlug } from "@/server/projects";

export default async function ProjectTimelinePage({ params }: { params: { projectSlug: string } }) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) return null;

  return <div className="text-lg font-semibold">Timeline for {project.name}</div>;
}
