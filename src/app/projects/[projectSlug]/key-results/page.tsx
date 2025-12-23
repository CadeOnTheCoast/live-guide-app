import { notFound } from "next/navigation";
import { db } from "@/server/db";
import { getUserOrRedirect } from "@/server/auth";
import { canEditProject } from "@/server/permissions";
import { getCurrentObjectiveForProject } from "@/server/objectives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { KeyResultDialog } from "@/components/projects/KeyResultDialog";
import { ObjectiveFormDialog } from "@/components/projects/ObjectiveFormDialog";
import { upsertKeyResult, upsertObjective } from "../overview/actions";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
    GREEN: "bg-emerald-500",
    YELLOW: "bg-amber-500",
    RED: "bg-rose-500",
};

export default async function KeyResultsPage({ params }: { params: { projectSlug: string } }) {
    const { person } = await getUserOrRedirect();
    const project = await db.project.findUnique({
        where: { slug: params.projectSlug },
        select: { id: true, name: true, slug: true }
    });

    if (!project) return notFound();

    const [currentObjective, people, departments] = await Promise.all([
        getCurrentObjectiveForProject(project.id),
        db.person.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
        db.department.findMany({ orderBy: { code: "asc" }, select: { id: true, name: true, code: true } })
    ]);

    const canEdit = canEditProject(person?.role);
    const keyResults = currentObjective?.keyResults ?? [];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold font-rajdhani text-brand-charcoal">Key Results</h2>
                    <p className="text-sm text-muted-foreground mt-1">Measuring impact across our strategic pillars.</p>
                </div>
                {canEdit && currentObjective && (
                    <ObjectiveFormDialog
                        projectId={project.id}
                        slug={project.slug}
                        triggerLabel="Edit objective"
                        action={upsertObjective}
                        objective={currentObjective}
                    />
                )}
            </div>

            {!currentObjective ? (
                <Card className="border-dashed flex flex-col items-center justify-center p-20 text-center bg-white shadow-sm border-brand-sky/30">
                    <div className="h-12 w-12 rounded-full bg-brand-sky/10 flex items-center justify-center mb-4">
                        <Badge variant="outline" className="text-brand-teal border-brand-teal/30">!</Badge>
                    </div>
                    <p className="text-brand-charcoal mb-4 font-semibold text-lg font-rajdhani">No objective defined yet.</p>
                    <p className="text-muted-foreground mb-6 max-w-xs text-sm">Every project needs an anchor objective to define its key results.</p>
                    {canEdit && (
                        <ObjectiveFormDialog
                            projectId={project.id}
                            slug={project.slug}
                            triggerLabel="DEFINE FIRST OBJECTIVE"
                            action={upsertObjective}
                            triggerVariant="default"
                        />
                    )}
                </Card>
            ) : (
                <div className="space-y-6">
                    <Card className="bg-gradient-to-br from-brand-charcoal to-brand-charcoal/90 text-white shadow-xl overflow-hidden border-none relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <Badge variant="outline" className="text-brand-sky border-brand-sky/30 uppercase tracking-[0.2em] text-[9px] font-bold">Project Focus</Badge>
                                    <CardTitle className="text-3xl font-rajdhani tracking-tight">{currentObjective.title}</CardTitle>
                                </div>
                                <Badge className={cn("px-3 py-1 text-[10px] font-bold tracking-widest", currentObjective.status === "ON_TRACK" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30")}>
                                    {currentObjective.status.replace("_", " ")}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <p className="text-brand-sky/70 text-base max-w-2xl leading-relaxed font-medium">
                                {currentObjective.description || "No description provided."}
                            </p>
                            {currentObjective.timeframeStart && (
                                <div className="mt-6 flex items-center gap-4 text-[10px] font-bold text-brand-sky/40 uppercase tracking-[0.2em]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-teal"></div>
                                        <span>STARTS: {new Date(currentObjective.timeframeStart).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-sage"></div>
                                        <span>ENDS: {currentObjective.timeframeEnd ? new Date(currentObjective.timeframeEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "Ongoing"}</span>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {keyResults.sort((a, b) => a.code.localeCompare(b.code)).map((kr) => {
                            // Simple progress calculation if numeric
                            const target = parseFloat(kr.targetValue ?? "0");
                            const current = parseFloat(kr.currentValue ?? "0");
                            const progress = target > 0 ? Math.min(100, Math.max(0, (current / target) * 100)) : 0;

                            return (
                                <Card key={kr.id} className="group hover:shadow-2xl transition-all border-brand-sky/10 overflow-hidden bg-white flex flex-col">
                                    <div className={`h-1.5 w-full ${STATUS_COLORS[kr.status] || "bg-gray-200"}`} />
                                    <CardHeader className="pb-3 px-5 pt-5 relative">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[10px] font-black text-brand-teal tracking-[0.2em] uppercase bg-brand-teal/5 px-2 py-0.5 rounded-sm">{kr.code}</span>
                                            <Badge variant="outline" className="text-[9px] h-5 px-2 uppercase font-black text-muted-foreground border-brand-sky/30">{kr.status}</Badge>
                                        </div>
                                        <CardTitle className="text-xl font-rajdhani leading-tight group-hover:text-brand-teal transition-colors min-h-[3rem] line-clamp-2">
                                            {kr.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6 px-5 flex-1">
                                        <div className="space-y-2.5">
                                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                                                <span className="text-brand-sage">Current Progress</span>
                                                <span className="text-brand-charcoal">{kr.currentValue || 0} / {kr.targetValue || "—"} <span className="text-brand-sage italic ml-0.5">{kr.unit || ""}</span></span>
                                            </div>
                                            <Progress value={progress} className="h-2 bg-brand-sky/10" />
                                            <p className="text-[10px] text-muted-foreground italic leading-snug line-clamp-2 pt-1">{kr.description || "No specific details provided."}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-brand-sky/10 mt-auto">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-brand-charcoal text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                                    {kr.owner?.name?.charAt(0) || "U"}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-brand-charcoal leading-none">{kr.owner?.name?.split(' ')[0] || "Unassigned"}</span>
                                                    <span className="text-[9px] text-brand-sage uppercase font-bold tracking-tighter mt-0.5">{kr.department?.code || "GENERAL"}</span>
                                                </div>
                                            </div>

                                            {canEdit && (
                                                <KeyResultDialog
                                                    projectId={project.id}
                                                    objectiveId={currentObjective.id}
                                                    slug={project.slug}
                                                    upsertAction={upsertKeyResult}
                                                    people={people}
                                                    departments={departments}
                                                    keyResult={kr}
                                                />
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}

                        {canEdit && keyResults.length < 5 && (
                            <Card className="border-2 border-dashed border-brand-sky/30 flex flex-col items-center justify-center p-8 bg-brand-sky/5 hover:bg-brand-sky/10 transition-all cursor-pointer group hover:border-brand-teal/40">
                                <div className="h-12 w-12 rounded-full border-2 border-dashed border-brand-sky/50 flex items-center justify-center mb-4 group-hover:border-brand-teal/50 transition-colors">
                                    <Plus className="h-6 w-6 text-brand-sky/50 group-hover:text-brand-teal transition-colors" />
                                </div>
                                <p className="text-xs font-black text-brand-teal/60 uppercase tracking-[0.2em] mb-4 group-hover:text-brand-teal transition-colors">New Key Result</p>
                                <KeyResultDialog
                                    projectId={project.id}
                                    objectiveId={currentObjective.id}
                                    slug={project.slug}
                                    upsertAction={upsertKeyResult}
                                    people={people}
                                    departments={departments}
                                    isNew
                                />
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
