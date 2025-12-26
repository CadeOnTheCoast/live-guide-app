import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import DepartmentDeleteButton from "@/components/admin/DepartmentDeleteButton";

type DepartmentRow = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  _count: { people: number };
};

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: { showInactive?: string };
}) {
  const showInactive = searchParams.showInactive === "true";

  const departments: DepartmentRow[] = await db.department.findMany({
    where: showInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
      isActive: true,
      _count: {
        select: {
          people: { where: { isActive: true } }
        }
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin</p>
          <h2 className="text-2xl font-bold">Departments</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={showInactive ? "/admin/departments" : "/admin/departments?showInactive=true"}>
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/departments/new">New department</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All departments {showInactive && "(including inactive)"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active staff</TableHead>
                <TableHead className="w-[200px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department: DepartmentRow) => (
                <TableRow key={department.id} className={!department.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.code}</TableCell>
                  <TableCell>
                    {department.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>{department._count.people}</TableCell>
                  <TableCell className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/departments/${department.id}`}>Edit</Link>
                    </Button>
                    <DepartmentDeleteButton departmentId={department.id} />
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No departments found.
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
