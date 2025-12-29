import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AuthRedirect } from "@/components/auth/AuthRedirect";
import { getCurrentUser } from "@/server/auth";

export const dynamic = "force-dynamic";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  startDate: Date | null;
  primaryOwner: {
    name: string;
    defaultDepartment: { name: string } | null;
  } | null;
};

async function getProjects(): Promise<ProjectRow[]> {
  const projects = await db.project.findMany({
    where: { isActive: true },
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { primaryOwner: { include: { defaultDepartment: true } } }
  });

  return projects as unknown as ProjectRow[];
}

export default async function HomePage() {
  const [projects, { user }] = await Promise.all([
    getProjects(),
    getCurrentUser()
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8 md:px-6 lg:px-8">
      <Suspense fallback={null}>
        <AuthRedirect />
      </Suspense>

      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Dashboard</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-foreground">
            Live Guide Projects
          </h1>
        </div>
        <div className="flex gap-3">
          {user ? (
            <Button asChild size="lg">
              <Link href="/projects">Go to Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/30 px-6 py-4">
          <CardTitle className="text-xl font-semibold">Active Projects</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projects.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground italic">No projects found. Seed the database to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6 py-4">Name</TableHead>
                    <TableHead className="py-4">Status</TableHead>
                    <TableHead className="py-4">Owner</TableHead>
                    <TableHead className="py-4">Department</TableHead>
                    <TableHead className="px-6 py-4">Start Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="px-6 py-4 font-medium">
                        <Link
                          href={`/projects/${project.slug}/overview`}
                          className="text-primary hover:underline underline-offset-4 decoration-primary/40"
                        >
                          {project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="secondary" className="font-semibold px-2.5 py-0.5 rounded-full uppercase text-[10px] tracking-wider">
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-foreground/80">{project.primaryOwner?.name ?? "—"}</TableCell>
                      <TableCell className="py-4 text-muted-foreground">{project.primaryOwner?.defaultDepartment?.name ?? "—"}</TableCell>
                      <TableCell className="px-6 py-4 text-muted-foreground tabular-nums">
                        {project.startDate
                          ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(project.startDate)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
