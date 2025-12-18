import Link from "next/link";
import { notFound } from "next/navigation";
import { ReactNode } from "react";
import { getProjectBySlug } from "@/server/projects";

const tabs = [
  { slug: "overview", label: "Overview" },
  { slug: "pushes", label: "Pushes" },
  { slug: "timeline", label: "Timeline" },
  { slug: "pressure", label: "Pressure" },
  { slug: "comms", label: "Comms" },
  { slug: "budget", label: "Budget" },
  { slug: "case-for-change", label: "Case for change" }
];

export default async function ProjectLayout({
  children,
  params
}: {
  children: ReactNode;
  params: { projectSlug: string };
}) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Project</p>
          <h2 className="text-2xl font-bold">{project.name}</h2>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2 border-b pb-2 text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.slug}
            href={`/projects/${project.slug}/${tab.slug}` as any}
            className="rounded-md px-3 py-1 hover:bg-muted"
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
