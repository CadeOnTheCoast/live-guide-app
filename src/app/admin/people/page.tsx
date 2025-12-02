import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PersonActiveToggle from "@/components/admin/PersonActiveToggle";

export default async function PeoplePage() {
  const people = await db.person.findMany({
    orderBy: { name: "asc" },
    include: { defaultDepartment: true }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Admin</p>
          <h2 className="text-2xl font-bold">People</h2>
        </div>
        <Button asChild>
          <Link href="/admin/people/new">New person</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All people</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Default department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person: (typeof people)[number]) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.defaultDepartment?.name ?? "—"}</TableCell>
                  <TableCell>{person.role}</TableCell>
                  <TableCell>{person.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell className="flex items-center justify-end gap-2">
                    <PersonActiveToggle personId={person.id} isActive={person.isActive} />
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/people/${person.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {people.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                    No people found.
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
