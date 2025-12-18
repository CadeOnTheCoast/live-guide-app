import { db } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  startDate: Date | null;
  primaryOwner: {
    name: string;
    defaultDepartment: { name: string } | null;
  } | null;
};

 async function getProjects(): Promise<ProjectRow[]> {
  const projects = await db.project.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { primaryOwner: { include: { defaultDepartment: true } } }
  });

  return projects as unknown as ProjectRow[];
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
                  <TableHead>Owner</TableHead>
                  <TableHead>Owner Department</TableHead>
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
                    <TableCell>{project.primaryOwner?.name ?? "—"}</TableCell>
                    <TableCell>{project.primaryOwner?.defaultDepartment?.name ?? "—"}</TableCell>
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
