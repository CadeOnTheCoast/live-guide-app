import Link from "next/link";
import { getUserOrRedirect } from "@/server/auth";

export default async function AppTopBar() {
  const { user } = await getUserOrRedirect();

  return (
    <header className="flex items-center justify-between border-b bg-white px-6 py-4">
      <Link href="/projects" className="text-xl font-bold">
        Live Guide
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
  );
}
