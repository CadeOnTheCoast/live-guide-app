import { getProjectBySlug } from "@/server/projects";

export default async function ProjectPressurePage({ params }: { params: { projectSlug: string } }) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) return null;

  return <div className="text-lg font-semibold">Pressure for {project.name}</div>;
}
