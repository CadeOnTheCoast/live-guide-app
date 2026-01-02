"use client";

import { useState, useMemo } from "react";
import { DecisionMaker, PressureAsset, PressureCorner, PowerRating, Stakeholder, StakeholderType } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Settings2, ExternalLink, Users, ShieldAlert, Newspaper, UserCheck } from "lucide-react";
import { DecisionMakerFormDialog } from "./DecisionMakerFormDialog";
import { PressureAssetFormDialog } from "./PressureAssetFormDialog";
import { StakeholderFormDialog } from "./StakeholderFormDialog";

type PressureViewProps = {
    project: {
        id: string;
        name: string;
        slug: string;
        status: string;
        primaryOwnerName?: string | null;
        asanaProjectGid: string | null;
        caseForChangePageUrl: string | null;
    };
    decisionMakers: (DecisionMaker & { pressureAssets: PressureAsset[] })[];
    stakeholders: Stakeholder[];
    canEdit: boolean;
    currentUser?: { email: string; name: string } | null;
};

const CORNER_CONFIG: Record<PressureCorner, { color: string; label: string; bg: string }> = {
    [PressureCorner.INFLUENCE]: { color: "text-brand-teal", bg: "bg-brand-teal", label: "Influence" },
    [PressureCorner.LEGAL]: { color: "text-brand-sage", bg: "bg-brand-sage", label: "Legal" },
    [PressureCorner.GRASSROOTS]: { color: "text-brand-mint", bg: "bg-brand-mint", label: "Grassroots" },
    [PressureCorner.MEDIA]: { color: "text-brand-sky", bg: "bg-brand-sky", label: "Media" }
};

export function PressureView({ project, decisionMakers, stakeholders, canEdit, currentUser }: PressureViewProps) {
    const [selectedDmId, setSelectedDmId] = useState<string | null>(decisionMakers[0]?.id ?? null);
    const [selectedStakeholderId, setSelectedStakeholderId] = useState<string | null>(null);
    const [filterCorner, setFilterCorner] = useState<PressureCorner | null>(null);

    const selectedDm = decisionMakers.find(dm => dm.id === selectedDmId) ?? decisionMakers[0];
    const selectedStakeholder = stakeholders.find(s => s.id === selectedStakeholderId);

    const affinityGroups = stakeholders.filter(s => ([StakeholderType.COMMUNITY_LEADER, StakeholderType.ALLY, StakeholderType.INFLUENCER] as StakeholderType[]).includes(s.stakeholderType));
    const opponents = stakeholders.filter(s => s.stakeholderType === StakeholderType.OPPONENT);
    const mediaOutlets = stakeholders.filter(s => s.stakeholderType === StakeholderType.MEDIA_OUTLET);

    const filteredAssets = useMemo(() => {
        if (!selectedDm) return [];
        if (!filterCorner) return selectedDm.pressureAssets;
        return selectedDm.pressureAssets.filter(a => a.corner === filterCorner);
    }, [selectedDm, filterCorner]);

    const cornerData = useMemo(() => {
        if (!selectedDm) return null;
        const data: Record<PressureCorner, number> = {
            [PressureCorner.INFLUENCE]: 0,
            [PressureCorner.LEGAL]: 0,
            [PressureCorner.GRASSROOTS]: 0,
            [PressureCorner.MEDIA]: 0
        };
        selectedDm.pressureAssets.forEach(asset => {
            const rating = asset.powerRating === PowerRating.HIGH ? 3 : asset.powerRating === PowerRating.MEDIUM ? 2 : 1;
            data[asset.corner] += rating * asset.weight;
        });
        return data;
    }, [selectedDm]);

    return (
        <div className="space-y-6">
            <ProjectHeader
                project={{
                    name: project.name,
                    status: project.status,
                    primaryOwnerName: project.primaryOwnerName ?? null,
                    asanaProjectGid: project.asanaProjectGid,
                    caseForChangePageUrl: project.caseForChangePageUrl
                }}
                projectSlug={project.slug}
                currentUser={currentUser}
            />

            <Tabs defaultValue="dm" className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8 bg-brand-charcoal text-white p-1 rounded-xl h-12">
                    <TabsTrigger value="dm" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-charcoal font-rajdhani font-bold tracking-wider text-xs">DECISION MAKERS</TabsTrigger>
                    <TabsTrigger value="affinity" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-charcoal font-rajdhani font-bold tracking-wider text-xs">AFFINITY GROUPS</TabsTrigger>
                    <TabsTrigger value="opponents" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-charcoal font-rajdhani font-bold tracking-wider text-xs">OPPONENTS</TabsTrigger>
                    <TabsTrigger value="media" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-brand-charcoal font-rajdhani font-bold tracking-wider text-xs">MEDIA</TabsTrigger>
                </TabsList>

                <TabsContent value="dm" className="mt-0 space-y-6">
                    <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
                        <Card className="h-full border-brand-sage/20 shadow-sm overflow-hidden">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-brand-sage/5 border-b border-brand-sage/10">
                                <CardTitle className="text-lg font-rajdhani">List</CardTitle>
                                {canEdit && <DecisionMakerFormDialog projectId={project.id} trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-brand-teal hover:text-brand-teal/80"><Plus className="h-4 w-4" /></Button>} />}
                            </CardHeader>
                            <CardContent className="p-2 pt-2">
                                <div className="space-y-1">
                                    {decisionMakers.map(dm => (
                                        <div key={dm.id} className="group relative">
                                            <button
                                                onClick={() => {
                                                    setSelectedDmId(dm.id);
                                                    setSelectedStakeholderId(null);
                                                }}
                                                className={`w-full rounded-md px-3 py-3 text-left transition-all ${selectedDmId === dm.id ? "bg-brand-charcoal text-white shadow-md" : "hover:bg-brand-sky/10"}`}
                                            >
                                                <div className="flex justify-between items-start pr-6">
                                                    <div>
                                                        <p className="font-semibold text-sm leading-tight">{dm.name}</p>
                                                        <p className={`text-[11px] mt-1 ${selectedDmId === dm.id ? "text-brand-sky" : "text-muted-foreground"}`}>{dm.organization}</p>
                                                    </div>
                                                    {dm.priorityLevel && (
                                                        <Badge className={`text-[9px] uppercase h-4 px-1 ${dm.priorityLevel === "high" ? "bg-red-500" : "bg-brand-sage"}`}>{dm.priorityLevel}</Badge>
                                                    )}
                                                </div>
                                            </button>
                                            {canEdit && (
                                                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <DecisionMakerFormDialog
                                                        projectId={project.id}
                                                        decisionMaker={dm}
                                                        trigger={<Button variant="ghost" size="icon" className="h-6 w-6"><Edit2 className="h-3 w-3" /></Button>}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {decisionMakers.length === 0 && (
                                        <p className="text-sm text-muted-foreground p-4 text-center italic">No decision makers defined.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {selectedDm ? (
                            <div className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <Card className="border-brand-sky/20 shadow-sm">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg font-rajdhani flex items-center gap-2">
                                                Pressure Profile
                                                <Badge variant="outline" className="font-normal text-[10px] ml-auto">{selectedDm.name}</Badge>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-col items-center justify-center pt-8 pb-12">
                                            <div className="relative aspect-square w-full max-w-[280px] flex items-center justify-center">
                                                {/* Central Indicator */}
                                                <div className="absolute inset-4 rounded-full border border-dashed border-brand-sage/30 flex items-center justify-center bg-brand-sky/5 shadow-[inset_0_0_20px_rgba(162,211,243,0.1)]">
                                                    <div className="text-center">
                                                        <p className="text-[10px] uppercase tracking-tighter text-brand-sage font-bold">Total</p>
                                                        <p className="text-2xl font-rajdhani font-bold text-brand-charcoal leading-none">
                                                            {(Object.values(cornerData ?? {}).reduce((a, b) => a + b, 0)).toFixed(0)}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Corners */}
                                                <button onClick={() => setFilterCorner(filterCorner === PressureCorner.INFLUENCE ? null : PressureCorner.INFLUENCE)} className={cn("absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-10 transition-all hover:scale-110", filterCorner === PressureCorner.INFLUENCE && "scale-110")}>
                                                    <div className={cn("text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1 uppercase tracking-widest transition-colors", filterCorner === PressureCorner.INFLUENCE ? "bg-brand-charcoal ring-2 ring-brand-teal" : "bg-brand-teal")}>Influence</div>
                                                    <div className={cn("w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center shadow-md", filterCorner === PressureCorner.INFLUENCE ? "border-brand-charcoal" : "border-brand-teal")}>
                                                        <span className={cn("text-lg font-rajdhani font-bold", filterCorner === PressureCorner.INFLUENCE ? "text-brand-charcoal" : "text-brand-teal")}>{cornerData?.INFLUENCE.toFixed(1)}</span>
                                                    </div>
                                                </button>

                                                <button onClick={() => setFilterCorner(filterCorner === PressureCorner.MEDIA ? null : PressureCorner.MEDIA)} className={cn("absolute top-1/2 -right-12 -translate-y-1/2 flex flex-row-reverse items-center z-10 transition-all hover:scale-110", filterCorner === PressureCorner.MEDIA && "scale-110")}>
                                                    <div className="flex flex-col items-center ml-2">
                                                        <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1 uppercase tracking-widest transition-colors", filterCorner === PressureCorner.MEDIA ? "bg-brand-charcoal text-white" : "bg-brand-sky text-brand-charcoal")}>Media</div>
                                                        <div className={cn("w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center shadow-md", filterCorner === PressureCorner.MEDIA ? "border-brand-charcoal" : "border-brand-sky")}>
                                                            <span className="text-lg font-rajdhani font-bold text-brand-charcoal">{cornerData?.MEDIA.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </button>

                                                <button onClick={() => setFilterCorner(filterCorner === PressureCorner.LEGAL ? null : PressureCorner.LEGAL)} className={cn("absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center z-10 transition-all hover:scale-110", filterCorner === PressureCorner.LEGAL && "scale-110")}>
                                                    <div className={cn("text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm mt-1 uppercase tracking-widest transition-colors", filterCorner === PressureCorner.LEGAL ? "bg-brand-charcoal ring-2 ring-brand-sage" : "bg-brand-sage")}>Legal</div>
                                                    <div className={cn("w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center shadow-md", filterCorner === PressureCorner.LEGAL ? "border-brand-charcoal" : "border-brand-sage")}>
                                                        <span className={cn("text-lg font-rajdhani font-bold", filterCorner === PressureCorner.LEGAL ? "text-brand-charcoal" : "text-brand-sage")}>{cornerData?.LEGAL.toFixed(1)}</span>
                                                    </div>
                                                </button>

                                                <button onClick={() => setFilterCorner(filterCorner === PressureCorner.GRASSROOTS ? null : PressureCorner.GRASSROOTS)} className={cn("absolute top-1/2 -left-12 -translate-y-1/2 flex items-center z-10 transition-all hover:scale-110", filterCorner === PressureCorner.GRASSROOTS && "scale-110")}>
                                                    <div className="flex flex-col items-center mr-2">
                                                        <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm mb-1 uppercase tracking-widest transition-colors", filterCorner === PressureCorner.GRASSROOTS ? "bg-brand-charcoal text-white" : "bg-brand-mint text-brand-charcoal")}>Grassroots</div>
                                                        <div className={cn("w-12 h-12 rounded-full bg-white border-2 flex items-center justify-center shadow-md", filterCorner === PressureCorner.GRASSROOTS ? "border-brand-charcoal" : "border-brand-mint")}>
                                                            <span className="text-lg font-rajdhani font-bold text-brand-charcoal">{cornerData?.GRASSROOTS.toFixed(1)}</span>
                                                        </div>
                                                    </div>
                                                </button>

                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"><div className="w-[110%] h-[1px] bg-brand-sage"></div><div className="h-[110%] w-[1px] bg-brand-sage absolute"></div></div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-brand-mint/20 shadow-sm">
                                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-brand-mint/5 border-b border-brand-mint/10">
                                            <CardTitle className="text-lg font-rajdhani">Assets & Details</CardTitle>
                                            {canEdit && <PressureAssetFormDialog projectId={project.id} decisionMakerId={selectedDm.id} trigger={<Button variant="outline" size="sm" className="h-7 text-[10px] uppercase tracking-wide border-brand-teal text-brand-teal hover:bg-brand-teal hover:text-white"><Plus className="h-3 w-3 mr-1" /> Add Asset</Button>} />}
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider mb-0.5">Title / Role</p>
                                                    <p className="font-medium text-xs">{selectedDm.title || "—"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider mb-0.5">Jurisdiction</p>
                                                    <p className="font-medium text-xs">{selectedDm.jurisdiction || "—"}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-muted-foreground uppercase text-[9px] font-bold tracking-wider mb-0.5">Stance</p>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${selectedDm.stance?.includes("supportive") ? "bg-green-500" : selectedDm.stance?.includes("opposed") ? "bg-red-500" : "bg-brand-sky"}`}></div>
                                                        <p className="font-medium capitalize text-xs">{selectedDm.stance || "Neutral / Unknown"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-brand-sky/10">
                                                <h5 className="text-[10px] font-bold uppercase tracking-widest text-brand-sage flex items-center gap-2 mb-3">
                                                    <Settings2 className="h-3 w-3" />
                                                    Active Pressure Assets
                                                </h5>
                                                <div className="space-y-2">
                                                    {filteredAssets.map(asset => (
                                                        <div key={asset.id} className="group flex items-center justify-between rounded-lg border border-brand-sky/20 p-2 bg-brand-sky/5 hover:bg-brand-sky/10 transition-colors">
                                                            <div className="flex items-start gap-2">
                                                                <div className={`mt-1 h-2 w-2 rounded-full ${CORNER_CONFIG[asset.corner].bg}`}></div>
                                                                <div>
                                                                    <p className="font-semibold text-xs leading-tight text-brand-charcoal">{asset.title}</p>
                                                                    <p className="text-[9px] text-muted-foreground mt-0.5 font-medium">Power: {asset.powerRating}</p>
                                                                </div>
                                                            </div>
                                                            {canEdit && <PressureAssetFormDialog projectId={project.id} decisionMakerId={selectedDm.id} asset={asset} trigger={<Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100"><Edit2 className="h-3 w-3" /></Button>} />}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* New Strategy Section for DM */}
                                <Card className="border-brand-teal/20 shadow-sm overflow-hidden">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 bg-brand-teal/5 border-b border-brand-teal/10">
                                        <CardTitle className="text-lg font-rajdhani flex items-center gap-2 uppercase tracking-widest"><UserCheck className="h-4 w-4" /> Strategic Context</CardTitle>
                                        <div className="flex gap-2">
                                            {canEdit && (
                                                <DecisionMakerFormDialog
                                                    projectId={project.id}
                                                    decisionMaker={selectedDm}
                                                    trigger={<Button variant="ghost" size="sm" className="h-7 px-2 font-bold text-[10px] tracking-widest text-brand-teal gap-1"><Edit2 className="h-3 w-3" /> EDIT Profile</Button>}
                                                />
                                            )}
                                            {selectedDm?.pressureAssets?.length > 0 ? (
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] bg-white border-brand-charcoal text-brand-charcoal hover:bg-brand-charcoal hover:text-white" asChild>
                                                    <a href={selectedDm.everyActionUrl ?? undefined} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> View in CRM</a>
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-muted-foreground italic" asChild>
                                                    <a href={`https://app5.everyaction.com/Contacts?SearchName=${encodeURIComponent(selectedDm.name)}`} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> Search CRM</a>
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-sage">Reason for targeting</p>
                                                <p className="text-sm leading-relaxed">{selectedDm.reason || "No strategic reason defined."}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-sage">Primary Pressure Points</p>
                                                <p className="text-sm leading-relaxed">{selectedDm.pressurePoints || "Not specified."}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-sage">Influencer(s)</p>
                                                <p className="text-sm leading-relaxed">{selectedDm.influencers || "None listed."}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card className="border-dashed flex items-center justify-center h-[300px]">
                                <CardContent className="text-center"><p className="text-muted-foreground italic mb-4">Select a decision maker to see pressure visualization.</p></CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="affinity">
                    <StakeholderGrid title="Affinity & Community Groups" icon={<Users className="h-4 w-4" />} stakeholders={affinityGroups} selectedId={selectedStakeholderId} onSelect={setSelectedStakeholderId} emptyMessage="No affinity groups tracked yet." canEdit={canEdit} projectId={project.id} />
                </TabsContent>

                <TabsContent value="opponents">
                    <StakeholderGrid title="Project Opponents" icon={<ShieldAlert className="h-4 w-4" />} stakeholders={opponents} selectedId={selectedStakeholderId} onSelect={setSelectedStakeholderId} emptyMessage="No opponents identified yet." canEdit={canEdit} projectId={project.id} />
                </TabsContent>

                <TabsContent value="media">
                    <StakeholderGrid title="Media Outlets" icon={<Newspaper className="h-4 w-4" />} stakeholders={mediaOutlets} selectedId={selectedStakeholderId} onSelect={setSelectedStakeholderId} emptyMessage="No media outlets tracked yet." canEdit={canEdit} projectId={project.id} />
                </TabsContent>
            </Tabs>

            {selectedStakeholder && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <StakeholderDetailCard stakeholder={selectedStakeholder} onClear={() => setSelectedStakeholderId(null)} canEdit={canEdit} projectId={project.id} />
                </div>
            )}
        </div>
    );
}

interface StakeholderGridProps {
    title: string;
    icon: React.ReactNode;
    stakeholders: Stakeholder[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    emptyMessage: string;
    canEdit: boolean;
    projectId: string;
}

function StakeholderGrid({ title, icon, stakeholders, selectedId, onSelect, emptyMessage, canEdit, projectId }: StakeholderGridProps) {
    return (
        <Card className="border-brand-sky/20 shadow-sm overflow-hidden">
            <CardHeader className="bg-brand-sky/5 border-b border-brand-sky/10 flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-rajdhani flex items-center gap-2 uppercase tracking-widest">{icon} {title}</CardTitle>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-bold text-[10px]">{stakeholders.length} Total</Badge>
                    {canEdit && (
                        <StakeholderFormDialog
                            projectId={projectId}
                            trigger={<Button variant="ghost" size="icon" className="h-8 w-8 text-brand-teal hover:text-brand-teal/80"><Plus className="h-4 w-4" /></Button>}
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-6">
                {stakeholders.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {stakeholders.map((s: Stakeholder) => (
                            <button
                                key={s.id}
                                onClick={() => onSelect(s.id)}
                                className={cn(
                                    "p-4 rounded-xl border text-left transition-all hover:shadow-md group relative",
                                    selectedId === s.id ? "border-brand-teal bg-brand-teal/5 ring-1 ring-brand-teal" : "border-brand-sky/20 hover:border-brand-teal/40 bg-white"
                                )}
                            >
                                <p className="font-bold text-brand-charcoal mb-1">{s.name}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium truncate">{s.organization || "Independent"}</p>
                                {s.reason && <p className="text-[11px] text-brand-sage mt-2 line-clamp-2 italic">&quot;{s.reason}&quot;</p>}

                                {selectedId === s.id && (
                                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-brand-teal" />
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 border border-dashed rounded-xl bg-muted/20 text-center">
                        <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function StakeholderDetailCard({ stakeholder, onClear, canEdit, projectId }: { stakeholder: Stakeholder, onClear: () => void, canEdit: boolean, projectId: string }) {
    return (
        <Card className="border-brand-charcoal overflow-hidden shadow-xl ring-1 ring-brand-charcoal/5">
            <CardHeader className="bg-brand-charcoal text-white flex flex-row items-center justify-between py-4 px-6 relative">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-brand-sky/20 flex items-center justify-center text-brand-sky font-bold font-rajdhani text-xl">
                        {stakeholder.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-sky/60">Stakeholder Profile</p>
                        <CardTitle className="text-2xl font-rajdhani">{stakeholder.name}</CardTitle>
                    </div>
                </div>
                <div className="flex gap-3">
                    {canEdit && (
                        <StakeholderFormDialog
                            projectId={projectId}
                            stakeholder={stakeholder}
                            trigger={<Button variant="outline" size="sm" className="h-8 text-[11px] bg-white/10 border-white/20 text-white hover:bg-white/20"><Edit2 className="h-3 w-3 mr-1" /> Edit</Button>}
                        />
                    )}
                    {stakeholder.everyActionUrl && (
                        <Button variant="outline" size="sm" className="h-8 text-[11px] bg-white/10 border-white/20 text-white hover:bg-white/20" asChild>
                            <a href={stakeholder.everyActionUrl ?? undefined} target="_blank" rel="noreferrer"><ExternalLink className="h-3 w-3 mr-1" /> CRM</a>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 w-8 text-white/60 hover:text-white" onClick={onClear}>✕</Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border-b">
                    <div className="p-6 bg-brand-sky/5">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-sage mb-4 flex items-center gap-2"><UserCheck className="h-3 w-3" /> Core Identity</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-tighter">Organization</label>
                                <p className="font-semibold">{stakeholder.organization || "—"}</p>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-tighter">Category</label>
                                <Badge variant="secondary" className="block w-fit mt-1">{stakeholder.stakeholderType.replace("_", " ")}</Badge>
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-tighter">Strategic Reason</label>
                                <p className="text-sm italic leading-relaxed text-brand-charcoal/80">&quot;{stakeholder.reason || "No strategic reason documented."}&quot;</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 col-span-2">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-sage mb-4">Strategic Execution</p>
                        <div className="grid sm:grid-cols-2 gap-8">
                            {/* Affinity Specific Fields */}
                            {([StakeholderType.COMMUNITY_LEADER, StakeholderType.ALLY, StakeholderType.INFLUENCER] as StakeholderType[]).includes(stakeholder.stakeholderType) && (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Captains (Affirmed or Potential)</label>
                                            <p className="text-sm font-medium">{stakeholder.captains || "TBD"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Plan to Educate</label>
                                            <p className="text-sm">{stakeholder.planToEducate || "Not yet defined."}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">General Notes</label>
                                            <p className="text-sm">{stakeholder.notes || "—"}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                            {/* Opponent Specific Fields */}
                            {stakeholder.stakeholderType === StakeholderType.OPPONENT && (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Influencer(s)</label>
                                            <p className="text-sm font-medium">{stakeholder.influencers || "Not identified."}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Plan to Counter</label>
                                            <p className="text-sm border-l-2 border-red-200 pl-3 py-1 bg-red-50/30 font-medium">{stakeholder.planToCounter || "No strategy defined yet."}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Notes</label>
                                            <p className="text-sm">{stakeholder.notes || "—"}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Media Specific Fields */}
                            {stakeholder.stakeholderType === StakeholderType.MEDIA_OUTLET && (
                                <>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Target Audience</label>
                                            <p className="text-sm font-medium">{stakeholder.audience || "General Public"}</p>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Media Plan</label>
                                            <p className="text-sm">{stakeholder.plan || "Not yet defined."}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[9px] font-black uppercase text-muted-foreground block mb-1">Notes</label>
                                            <p className="text-sm">{stakeholder.notes || "—"}</p>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
