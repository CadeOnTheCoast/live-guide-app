import Link from "next/link";
import ProjectForm from "@/components/admin/ProjectForm";
import { Button } from "@/components/ui/button";
import { db } from "@/server/db";
import { PROJECT_STATUS_OPTIONS } from "@/app/admin/projects/formState";

export default async function NewProjectPage() {
  const people = await db.person.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Projects</p>
          <h2 className="text-2xl font-bold">Create project</h2>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/projects">Back to list</Link>
        </Button>
      </div>
      <ProjectForm
        people={people}
        statusOptions={PROJECT_STATUS_OPTIONS}
        defaultStatus={PROJECT_STATUS_OPTIONS.find((value) => value === "ACTIVE") ?? PROJECT_STATUS_OPTIONS[0]}
      />
    </div>
  );
}
