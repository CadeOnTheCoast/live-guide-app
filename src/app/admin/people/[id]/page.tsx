import Link from "next/link";
import { notFound } from "next/navigation";
import PersonForm from "@/components/admin/PersonForm";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";

export default async function EditPersonPage({ params }: { params: { id: string } }) {
  const [person, departments] = await Promise.all([
    db.person.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, email: true, defaultDepartmentId: true, isActive: true, role: true }
    }),
    db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
  ]);

  if (!person) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">People</p>
          <h2 className="text-2xl font-bold">Edit person</h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/people">Back to list</Link>
        </Button>
      </div>
      <PersonForm person={person} departments={departments} />
    </div>
  );
}
