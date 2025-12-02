import Link from "next/link";
import DepartmentForm from "@/components/admin/DepartmentForm";
import { Button } from "@/components/ui/button";

export default function NewDepartmentPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Departments</p>
          <h2 className="text-2xl font-bold">Create department</h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/departments">Back to list</Link>
        </Button>
      </div>
      <DepartmentForm />
    </div>
  );
}
