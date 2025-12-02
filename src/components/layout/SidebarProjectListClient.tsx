"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SidebarProject = {
  id: string;
  name: string;
  slug: string;
  status: string;
};

function statusVariant(status: string) {
  if (status === "ACTIVE") return "default" as const;
  if (status === "PLANNING") return "outline" as const;
  if (status === "PAUSED") return "secondary" as const;
  return "outline" as const;
}

export default function SidebarProjectListClient({ projects }: { projects: SidebarProject[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(query.toLowerCase()));
  }, [projects, query]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search projects"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="space-y-2">
        {filtered.map((project) => (
          <Link
            href={`/projects/${project.slug}/overview`}
            key={project.id}
            className={cn(
              "flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-muted"
            )}
          >
            <span className="font-medium">{project.name}</span>
            <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
          </Link>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No projects match that search.</p>
        )}
      </div>
    </div>
  );
}
