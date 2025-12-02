import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export async function getProjects() {
  return db.project.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { department: true, owner: true }
  });
}

export default async function HomePage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Dashboard</p>
        <h2 className="text-3xl font-bold">Live Guide Projects</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projects found. Seed the database to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Start Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{project.status}</Badge>
                    </TableCell>
                    <TableCell>{project.department?.name ?? "—"}</TableCell>
                    <TableCell>
                      {project.owner ? `${project.owner.firstName} ${project.owner.lastName}` : "—"}
                    </TableCell>
                    <TableCell>
                      {project.startDate
                        ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(project.startDate)
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
