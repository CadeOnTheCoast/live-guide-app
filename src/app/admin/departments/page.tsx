import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DepartmentDeleteButton from "@/components/admin/DepartmentDeleteButton";

type DepartmentRow = Awaited<ReturnType<typeof db.department.findMany>>[number];

export default async function DepartmentsPage() {
  const departments = await db.department.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      code: true,
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
        <Button asChild>
          <Link href="/admin/departments/new">New department</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All departments</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Active staff</TableHead>
                <TableHead className="w-[200px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((department: DepartmentRow) => (
                <TableRow key={department.id}>
                  <TableCell className="font-medium">{department.name}</TableCell>
                  <TableCell>{department.code}</TableCell>
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
