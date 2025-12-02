import { notFound } from "next/navigation";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjectBySlug } from "@/server/projects";

export default async function ProjectOverviewPage({ params }: { params: { projectSlug: string } }) {
  const project = await getProjectBySlug(params.projectSlug);

  if (!project) return notFound();

  return (
    <div className="space-y-4">
      <ProjectHeader
        project={{
          name: project.name,
          status: project.status,
          primaryOwnerName: project.primaryOwner?.name,
          asanaProjectGid: project.asanaProjectGid,
          caseForChangePageUrl: project.caseForChangePageUrl
        }}
      />
      <Card>
        <CardHeader>
          <CardTitle>Project summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{project.description || "No description provided."}</p>
          {project.caseForChangeSummary && (
            <div>
              <p className="text-sm font-semibold">Case for change</p>
              <p className="text-sm text-muted-foreground">{project.caseForChangeSummary}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
