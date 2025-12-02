import Link from "next/link";
import PersonForm from "@/components/admin/PersonForm";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";

export default async function NewPersonPage() {
  const departments = await db.department.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">People</p>
          <h2 className="text-2xl font-bold">Create person</h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/people">Back to list</Link>
        </Button>
      </div>
      <PersonForm departments={departments} />
    </div>
  );
}
