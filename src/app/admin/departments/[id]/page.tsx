import Link from "next/link";
import { notFound } from "next/navigation";
import DepartmentForm from "@/components/admin/DepartmentForm";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";

export default async function EditDepartmentPage({ params }: { params: { id: string } }) {
  const department = await db.department.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, code: true }
  });

  if (!department) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Departments</p>
          <h2 className="text-2xl font-bold">Edit department</h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/departments">Back to list</Link>
        </Button>
      </div>
      <DepartmentForm department={department} />
    </div>
  );
}
