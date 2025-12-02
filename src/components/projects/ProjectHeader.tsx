import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type ProjectHeaderProps = {
  project: {
    name: string;
    status: string;
    primaryOwnerName?: string | null;
    asanaProjectGid?: string | null;
    caseForChangePageUrl?: string | null;
  };
};

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const asanaLink = project.asanaProjectGid
    ? `https://app.asana.com/0/${project.asanaProjectGid}/list`
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-md border bg-card p-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <Badge variant="secondary">{project.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Primary owner: {project.primaryOwnerName ?? "Unassigned"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {asanaLink && (
          <Link
            href={asanaLink}
            className="rounded-md border px-3 py-2 hover:bg-muted"
            target="_blank"
            rel="noreferrer"
          >
            Open Asana project
          </Link>
        )}
        {project.caseForChangePageUrl && (
          <Link
            href={project.caseForChangePageUrl}
            className="rounded-md border px-3 py-2 hover:bg-muted"
            target="_blank"
            rel="noreferrer"
          >
            Case for change
          </Link>
        )}
      </div>
    </div>
  );
}
