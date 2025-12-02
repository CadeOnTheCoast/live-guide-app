import { db } from "@/server/db";
import SidebarProjectListClient from "@/components/layout/SidebarProjectListClient";

export default async function AppSidebar() {
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true, slug: true, status: true }
  });

  return (
    <aside className="hidden w-64 border-r bg-card px-4 py-6 md:block">
      <div className="mb-4 space-y-1">
        <div className="text-lg font-semibold">Projects</div>
        <p className="text-sm text-muted-foreground">Choose a project to view details.</p>
      </div>
      <SidebarProjectListClient projects={projects} />
    </aside>
  );
}
