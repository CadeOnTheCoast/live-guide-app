import { ReactNode } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import AppTopBar from "@/components/layout/AppTopBar";
import { getUserOrRedirect } from "@/server/auth";

export const dynamic = "force-dynamic";

export default async function ProjectsLayout({ children }: { children: ReactNode }) {
  await getUserOrRedirect("/projects");

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar />
      <div className="flex flex-1 flex-col">
        <AppTopBar />
        <main className="flex-1 bg-muted/40 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
