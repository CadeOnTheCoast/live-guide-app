import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getUserOrRedirect } from "@/server/auth";
import { canManageAdminArea } from "@/server/permissions";

const adminLinks = [
  { href: "/admin/departments", label: "Departments" },
  { href: "/admin/people", label: "People" },
  { href: "/admin/projects", label: "Projects" }
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { user, person } = await getUserOrRedirect("/admin");

  if (!canManageAdminArea(person?.role)) {
    redirect("/projects");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 border-r bg-card px-4 py-6 md:block">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Admin</p>
          <h2 className="text-xl font-semibold">Reference data</h2>
        </div>
        <nav className="space-y-2 text-sm">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href as any}
              className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted"
            >
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-4">
          <Link href="/projects" className="text-xl font-bold">
            Live Guide Admin
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="rounded-md bg-secondary px-3 py-1 text-secondary-foreground">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-md border px-3 py-1 hover:bg-muted" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex-1 bg-muted/40 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
