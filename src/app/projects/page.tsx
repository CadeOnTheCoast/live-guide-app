import Link from "next/link";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ProjectSummary = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

export default async function ProjectsHomePage() {
  const projects = (await db.project.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, slug: true, status: true }
  })) as unknown as ProjectSummary[];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Dashboard</p>
        <h2 className="text-3xl font-bold">Projects</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.slug}/overview`}
                className="flex items-center justify-between rounded-md border px-4 py-3 hover:bg-muted"
              >
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-muted-foreground">Open for more details</p>
                </div>
                <Badge variant="secondary">{project.status}</Badge>
              </Link>
            ))}
            {projects.length === 0 && (
              <p className="text-sm text-muted-foreground">No projects found. Seed the database to get started.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
