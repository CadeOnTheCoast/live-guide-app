import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectiveFormDialog } from "@/components/projects/ObjectiveFormDialog";
import { KeyResultRowForm } from "@/components/projects/KeyResultRowForm";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getUserOrRedirect } from "@/server/auth";
import { getCurrentObjectiveForProject } from "@/server/objectives";
import { canEditProject } from "@/server/permissions";
import { getProjectOverviewBySlug } from "@/server/projects";
import { db } from "@/server/db";
import { getCurrentPushForProject } from "@/server/pushes";

const OBJECTIVE_STATUS_STYLES: Record<string, string> = {
  ON_TRACK: "bg-emerald-100 text-emerald-800",
  AT_RISK: "bg-amber-100 text-amber-800",
  ACHIEVED: "bg-blue-100 text-blue-800",
  NOT_PURSUED: "bg-gray-100 text-gray-800"
};

function formatDate(date?: Date | string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(date));
}

function sortByKeyResultCode(a: { code: string }, b: { code: string }) {
  const parseNumber = (code: string) => parseInt(code.replace(/[^0-9]/g, ""), 10) || 0;
  return parseNumber(a.code) - parseNumber(b.code);
}

export default async function ProjectOverviewPage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();
  const project = await getProjectOverviewBySlug(params.projectSlug);

  if (!project) return notFound();

  const [currentObjective, people, departments] = await Promise.all([
    getCurrentObjectiveForProject(project.id),
    db.person.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.department.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } })
  ]);

  const canEdit = canEditProject(person?.role);
  const sortedKeyResults = currentObjective?.keyResults ? [...currentObjective.keyResults].sort(sortByKeyResultCode) : [];
  const currentPush = getCurrentPushForProject(project.pushes ?? []);

  return (
    <div className="space-y-6">
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
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Objective</p>
            <CardTitle>Current objective</CardTitle>
          </div>
          {canEdit && (
            <ObjectiveFormDialog
              projectId={project.id}
              slug={project.slug}
              triggerLabel={currentObjective ? "Edit objective" : "Create objective"}
              objective={currentObjective}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {currentObjective ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{currentObjective.title}</h3>
                <Badge className={OBJECTIVE_STATUS_STYLES[currentObjective.status] ?? ""}>{currentObjective.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {currentObjective.description || "No description provided."}
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span>
                  Timeframe: {formatDate(currentObjective.timeframeStart)} – {formatDate(currentObjective.timeframeEnd)}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">No objective defined yet.</p>
                <p className="text-sm text-muted-foreground">Set a current objective to anchor this project.</p>
              </div>
              {canEdit && <ObjectiveFormDialog projectId={project.id} slug={project.slug} triggerLabel="Create objective" />}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Key results</p>
            <CardTitle>Key results (3–5 recommended)</CardTitle>
          </div>
          {canEdit && currentObjective && sortedKeyResults.length < 5 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Keep between 3–5 KRs.</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {!currentObjective ? (
            <p className="text-sm text-muted-foreground">Create an objective to start adding key results.</p>
          ) : (
            <>
              {sortedKeyResults.length < 3 && (
                <p className="text-sm text-amber-700">You should aim for 3–5 key results.</p>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due date</TableHead>
                    {canEdit && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedKeyResults.map((keyResult) => (
                    <KeyResultRowForm
                      key={keyResult.id}
                      projectId={project.id}
                      objectiveId={currentObjective.id}
                      slug={project.slug}
                      people={people}
                      departments={departments}
                      keyResult={keyResult}
                      canEdit={canEdit}
                    />
                  ))}
                  {canEdit && sortedKeyResults.length < 5 && (
                    <KeyResultRowForm
                      key="new-key-result"
                      projectId={project.id}
                      objectiveId={currentObjective.id}
                      slug={project.slug}
                      people={people}
                      departments={departments}
                      isNew
                      canEdit={canEdit}
                    />
                  )}
                  {sortedKeyResults.length === 0 && !canEdit && (
                    <TableRow>
                      <TableCell colSpan={canEdit ? 9 : 8} className="text-sm text-muted-foreground">
                        No key results yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Push</p>
            <CardTitle>Current push</CardTitle>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${project.slug}/pushes`}>View pushes</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentPush ? (
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{currentPush.name}</h3>
              <p className="text-sm text-muted-foreground">
                {formatDate(currentPush.startDate)} – {formatDate(currentPush.endDate)}
              </p>
              {currentPush.highLevelSummary && (
                <p className="text-sm text-muted-foreground">{currentPush.highLevelSummary}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active Push right now.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
