import { db } from "@/server/db";
import SidebarProjectListClient from "@/components/layout/SidebarProjectListClient";
import SidebarClient from "./SidebarClient";

export default async function AppSidebar() {
  const projects = await db.project.findMany({
    orderBy: { name: "asc" },
    take: 20,
    select: { id: true, name: true, slug: true, status: true }
  });

  return (
    <SidebarClient>
      <SidebarProjectListClient projects={projects} />
    </SidebarClient>
  );
}
