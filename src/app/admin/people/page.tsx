import Link from "next/link";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import PersonActiveToggle from "@/components/admin/PersonActiveToggle";

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: { showInactive?: string };
}) {
  const showInactive = searchParams.showInactive === "true";

  const people = await db.person.findMany({
    where: showInactive ? {} : { isActive: true },
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
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={showInactive ? "/admin/people" : "/admin/people?showInactive=true"}>
              {showInactive ? "Hide Inactive" : "Show Inactive"}
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/people/new">New person</Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All people {showInactive && "(including inactive)"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Default department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[220px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id} className={!person.isActive ? "opacity-60" : ""}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell>{person.email}</TableCell>
                  <TableCell>{person.defaultDepartment?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{person.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {person.isActive ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-none">Active</Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
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
