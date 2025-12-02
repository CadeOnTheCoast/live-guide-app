import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ProjectsAdminPage() {
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
    include: { primaryOwner: true }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin</p>
          <h2 className="text-2xl font-bold">Projects</h2>
        </div>
        <Button asChild>
          <Link href="/admin/projects/new">New project</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Primary owner</TableHead>
                <TableHead>Start date</TableHead>
                <TableHead>End date</TableHead>
                <TableHead>Asana GID</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project: (typeof projects)[number]) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{project.status}</TableCell>
                  <TableCell>{project.primaryOwner?.name ?? "—"}</TableCell>
                  <TableCell>{project.startDate ? project.startDate.toISOString().substring(0, 10) : "—"}</TableCell>
                  <TableCell>{project.endDate ? project.endDate.toISOString().substring(0, 10) : "—"}</TableCell>
                  <TableCell>{project.asanaProjectGid ?? "—"}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/projects/${project.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
