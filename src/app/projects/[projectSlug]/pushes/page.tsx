import { getProjectBySlug } from "@/server/projects";

export default async function ProjectPushesPage({ params }: { params: { projectSlug: string } }) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) return null;

  return <div className="text-lg font-semibold">Pushes for {project.name}</div>;
}
