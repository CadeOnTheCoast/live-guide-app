import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function ProjectsAdminPage({
  searchParams,
}: {
  searchParams: { showInactive?: string };
}) {
  const showInactive = searchParams.showInactive === "true";

  const projects = await db.project.findMany({
    where: showInactive ? {} : { isActive: true },
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
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={showInactive ? "/admin/projects" : "/admin/projects?showInactive=true"}>
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/projects/new">New project</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All projects {showInactive && "(including inactive)"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead>Primary owner</TableHead>
                <TableHead className="w-[160px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className={!project.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{project.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {project.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{project.primaryOwner?.name ?? "—"}</TableCell>
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
