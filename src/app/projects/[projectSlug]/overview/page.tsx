import Link from "next/link";
import { notFound } from "next/navigation";
import { ObjectiveFormDialog } from "@/components/projects/ObjectiveFormDialog";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getUserOrRedirect } from "@/server/auth";
import { getCurrentObjectiveForProject } from "@/server/objectives";
import { canEditProject } from "@/server/permissions";
import { getProjectOverviewBySlug } from "@/server/projects";
import { getCurrentPushForProject } from "@/server/pushes";
import { upsertObjective } from "./actions";
import { ArrowRight, Target, Zap, LayoutDashboard, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { HistoryDebriefCard } from "@/components/projects/HistoryDebriefCard";

const OBJECTIVE_STATUS_STYLES: Record<string, string> = {
  ON_TRACK: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  AT_RISK: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ACHIEVED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  NOT_PURSUED: "bg-gray-500/10 text-gray-600 border-gray-500/20"
};

function formatDate(date?: Date | string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en", { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export default async function ProjectOverviewPage({ params }: { params: { projectSlug: string } }) {
  const { person } = await getUserOrRedirect();
  const project = await getProjectOverviewBySlug(params.projectSlug);

  if (!project) return notFound();

  const [currentObjective] = await Promise.all([
    getCurrentObjectiveForProject(project.id)
  ]);

  const canEdit = canEditProject(person?.role);
  const currentPush = getCurrentPushForProject(project.pushes ?? []);
  const keyResults = currentObjective?.keyResults ?? [];

  return (
    <div className="space-y-8 pb-12">
      <ProjectHeader
        project={{
          name: project.name,
          status: project.status,
          primaryOwnerName: project.primaryOwner?.name,
          asanaProjectGid: project.asanaProjectGid,
          asanaUrl: project.asanaUrl,
          teamsUrl: project.teamsUrl,
          projectFolderUrl: project.projectFolderUrl,
          projectNotesUrl: project.projectNotesUrl,
          caseForChangePageUrl: project.caseForChangePageUrl,
          badges: project.badges
        }}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Objective Card - Spans 2 columns on desktop */}
        <Card className="lg:col-span-2 overflow-hidden border-brand-sky/20 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sky/10 bg-brand-sky/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-charcoal flex items-center justify-center text-white">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sage">Strategic Focus</p>
                <CardTitle className="font-rajdhani text-xl">Current Objective</CardTitle>
              </div>
            </div>
            {canEdit && (
              <ObjectiveFormDialog
                projectId={project.id}
                slug={project.slug}
                triggerLabel={currentObjective ? "Edit" : "Create"}
                action={upsertObjective}
                objective={currentObjective}
              />
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {currentObjective ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-rajdhani font-bold text-brand-charcoal">{currentObjective.title}</h3>
                    <div className="flex items-center gap-3 text-sm text-brand-sage font-medium">
                      <span>{formatDate(currentObjective.timeframeStart)} – {formatDate(currentObjective.timeframeEnd)}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("px-3 py-1 font-bold tracking-widest text-[10px]", OBJECTIVE_STATUS_STYLES[currentObjective.status] ?? "")}>
                    {currentObjective.status.replace("_", " ")}
                  </Badge>
                </div>
                <p className="text-brand-charcoal/70 leading-relaxed max-w-2xl">
                  {currentObjective.description || "No description provided for this objective."}
                </p>
              </div>
            ) : (
              <div className="py-12 text-center space-y-4">
                <p className="text-muted-foreground font-medium">No active objective defined.</p>
                {canEdit && (
                  <ObjectiveFormDialog projectId={project.id} slug={project.slug} triggerLabel="Set Project Objective" action={upsertObjective} triggerVariant="default" />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Current Push Sidebar */}
        <Card className="border-brand-sky/20 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sky/10 bg-brand-teal/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-teal flex items-center justify-center text-white">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-teal">Current Interval</p>
                <CardTitle className="font-rajdhani text-xl">Active Push</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex-1">
            {currentPush ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-brand-charcoal">{currentPush.name}</h3>
                  <p className="text-xs text-brand-sage font-bold uppercase tracking-tighter">
                    Ends {formatDate(currentPush.endDate)}
                  </p>
                </div>
                {currentPush.highLevelSummary && (
                  <p className="text-sm text-brand-charcoal/70 line-clamp-3 italic">&quot;{currentPush.highLevelSummary}&quot;</p>
                )}
                <Button asChild variant="outline" className="w-full mt-4 border-brand-teal/20 text-brand-teal hover:bg-brand-teal/5 font-rajdhani font-bold tracking-wider text-xs">
                  <Link href={`/projects/${project.slug}/pushes`} className="flex items-center justify-center gap-2">
                    VIEW BOARD <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ) : (
              <p className="text-sm text-center text-muted-foreground py-12">No active Push right now.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Results Summary */}
      <Card className="border-brand-sky/20 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sky/10 bg-brand-charcoal text-white pb-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-brand-sky">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sky/60">Performance Indicators</p>
              <CardTitle className="font-rajdhani text-xl">Key Results Summary</CardTitle>
            </div>
          </div>
          <Button asChild variant="link" className="text-brand-sky hover:text-white p-0 h-auto font-rajdhani font-bold tracking-widest text-xs">
            <Link href={`/projects/${project.slug}/key-results`} className="flex items-center gap-2">
              FULL DASHBOARD <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!currentObjective ? (
            <div className="p-12 text-center text-muted-foreground">Define an objective to track key results.</div>
          ) : keyResults.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No key results defined yet.</div>
          ) : (
            <div className="divide-y divide-brand-sky/10">
              {keyResults.sort((a, b) => a.code.localeCompare(b.code)).map((kr) => {
                const target = parseFloat(kr.targetValue ?? "0");
                const current = parseFloat(kr.currentValue ?? "0");
                const progress = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

                return (
                  <div key={kr.id} className="p-4 hover:bg-brand-sky/5 transition-colors flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex items-center gap-4 md:w-1/3">
                      <span className="text-[10px] font-black text-brand-teal min-w-[32px]">{kr.code}</span>
                      <span className="font-semibold text-sm text-brand-charcoal truncate">{kr.title}</span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                        <span className="text-brand-sage">{kr.status}</span>
                        <span className="text-brand-charcoal">{current} / {target} {kr.unit}</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>
                    <div className="md:w-32 flex justify-end">
                      <Badge variant="secondary" className="bg-brand-sky/10 text-brand-charcoal text-[9px] font-bold px-2 border-none">
                        {kr.owner?.name?.split(' ')[0] || "Unassigned"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Key Messages */}
        <Card className="border-brand-sky/20 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-brand-sky/10 bg-brand-sky/5 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-brand-mint/20 flex items-center justify-center text-brand-teal">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sage">Core Comms</p>
                <CardTitle className="font-rajdhani text-xl">Key Messages</CardTitle>
              </div>
            </div>
            <Button asChild variant="link" className="text-brand-teal hover:text-brand-teal/80 p-0 h-auto font-rajdhani font-bold tracking-widest text-xs">
              <Link href={`/projects/${project.slug}/comms`} className="flex items-center gap-1">
                ALL COMMS <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            {project.commsProfile?.keyMessages.length ? (
              <div className="space-y-4">
                {project.commsProfile.keyMessages.map((msg: { id: string; message: string }) => (
                  <div key={msg.id} className="flex gap-3">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-teal shrink-0" />
                    <p className="text-sm text-brand-charcoal/80 leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">No key messages defined yet.</p>
            )}
          </CardContent>
        </Card>

        {/* History Debrief */}
        <HistoryDebriefCard historyDebrief={project.historyDebrief} canEdit={canEdit} />
      </div>
    </div>
  );
}
