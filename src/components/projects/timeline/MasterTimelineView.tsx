"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTimelinePosition } from "./utils";
import { Check } from "lucide-react";

import { Eye, EyeOff, GripVertical } from "lucide-react";
import { useEffect } from "react";
import { useTimelineRealtime } from "./useTimelineRealtime";

type Milestone = {
    id: string;
    title: string;
    date: Date;
    status: string;
    isMajor: boolean;
};

type KeyResult = {
    id: string;
    code: string;
    title: string;
    dueDate: Date | null;
    status: string;
};

type ProjectWithTimeline = {
    id: string;
    name: string;
    slug: string;
    milestones: Milestone[];
    keyResults: KeyResult[];
};

type MasterTimelineViewProps = {
    projects: ProjectWithTimeline[];
};

const PROJECT_COLORS = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-violet-500",
    "bg-lime-500",
    "bg-fuchsia-500",
    "bg-sky-500",
    "bg-yellow-500",
];

export function MasterTimelineView({ projects: initialProjects }: MasterTimelineViewProps) {
    useTimelineRealtime();
    const currentYear = new Date().getFullYear();
    const [startYear, setStartYear] = useState(currentYear - 1);
    const [endYear, setEndYear] = useState(currentYear + 2);
    const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

    // Enhancements State
    const [orderedProjects, setOrderedProjects] = useState<ProjectWithTimeline[]>(initialProjects);
    const [hiddenProjectIds, setHiddenProjectIds] = useState<Set<string>>(new Set());
    const [activeFilters, setActiveFilters] = useState<Set<"milestone" | "keyresult">>(new Set());
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [showHidden, setShowHidden] = useState(false);

    // Sync state when props change (realtime update)
    useEffect(() => {
        setOrderedProjects(initialProjects);
    }, [initialProjects]);

    const startDate = useMemo(() => new Date(`${startYear}-01-01T00:00:00Z`), [startYear]);
    const endDate = useMemo(() => new Date(`${endYear}-12-31T23:59:59Z`), [endYear]);

    const visibleProjects = useMemo(() => {
        return orderedProjects.filter(p => showHidden || !hiddenProjectIds.has(p.id));
    }, [orderedProjects, hiddenProjectIds, showHidden]);

    const quarters = useMemo(() => {
        const labels: { label: string; yearLabel: string | null; percent: number }[] = [];
        const curr = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
        const end = new Date(endDate);

        while (curr <= end) {
            const q = Math.floor(curr.getMonth() / 3) + 1;
            const p = getTimelinePosition(curr, startDate, endDate);
            const isFirstQ = q === 1;
            labels.push({
                label: `Q${q}`,
                yearLabel: isFirstQ || labels.length === 0 ? `${curr.getFullYear()}` : null,
                percent: p
            });
            curr.setMonth(curr.getMonth() + 3);
        }
        return labels;
    }, [startDate, endDate]);

    const toggleFilter = (filter: "milestone" | "keyresult") => {
        setActiveFilters(prev => {
            const next = new Set(prev);
            if (next.size === 0) {
                // First click: solo this filter
                next.add(filter);
            } else if (next.has(filter)) {
                next.delete(filter);
                // If now empty, it means we clicked the last active filter, so reset to all
                if (next.size === 0) return new Set();
            } else {
                next.add(filter);
            }
            return next;
        });
    };

    const toggleProjectVisibility = (id: string) => {
        setHiddenProjectIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Required for Firefox
        e.dataTransfer.setData("text/plain", index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newProjects = [...orderedProjects];
        const draggedProject = newProjects[draggedIndex];
        newProjects.splice(draggedIndex, 1);
        newProjects.splice(index, 0, draggedProject);

        setOrderedProjects(newProjects);
        setDraggedIndex(index);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">Master View</p>
                    <h2 className="text-3xl font-bold">Project Timelines</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <button
                            onClick={() => setShowHidden(!showHidden)}
                            className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] uppercase font-bold transition-colors",
                                showHidden ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-muted text-muted-foreground border border-transparent"
                            )}
                        >
                            {showHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            {showHidden ? "Showing Hidden" : `${hiddenProjectIds.size} Hidden`}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-muted/30 p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">Start</label>
                        <Input
                            type="number"
                            className="h-8 w-20 text-xs"
                            value={startYear}
                            onChange={(e) => setStartYear(Number(e.target.value))}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-muted-foreground">End</label>
                        <Input
                            type="number"
                            className="h-8 w-20 text-xs"
                            value={endYear}
                            onChange={(e) => setEndYear(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <div className="relative flex flex-col min-w-[800px]">
                        {/* Header: Quarters */}
                        <div className="flex h-12 border-b bg-muted/20 items-end pb-2">
                            <div className="w-64 flex-shrink-0 px-4 font-semibold text-sm">Project</div>
                            <div className="relative flex-1 h-full mr-8">
                                {quarters.map((q, i) => (
                                    <div
                                        key={i}
                                        className="absolute flex flex-col items-center"
                                        style={{ left: `${q.percent}%`, transform: "translateX(-50%)" }}
                                    >
                                        <span className="text-[10px] font-bold text-muted-foreground">{q.label}</span>
                                        {q.yearLabel && <span className="text-[8px] uppercase tracking-tighter text-muted-foreground/60">{q.yearLabel}</span>}
                                        <div className="h-2 w-px bg-border mt-1" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Project Rows */}
                        <div className="divide-y">
                            {visibleProjects.map((project) => {
                                const pIdx = orderedProjects.findIndex(p => p.id === project.id);
                                const projectColor = PROJECT_COLORS[pIdx % PROJECT_COLORS.length];
                                const isHidden = hiddenProjectIds.has(project.id);

                                const timelineItems = [
                                    ...project.milestones.map(m => ({
                                        id: m.id,
                                        type: "milestone" as const,
                                        title: m.title,
                                        date: new Date(m.date),
                                        status: m.status,
                                        isMajor: m.isMajor,
                                        link: `/projects/${project.slug}/timeline`
                                    })),
                                    ...project.keyResults.filter(kr => kr.dueDate).map(kr => ({
                                        id: kr.id,
                                        type: "keyresult" as const,
                                        title: `${kr.code}: ${kr.title}`,
                                        date: new Date(kr.dueDate!),
                                        status: kr.status,
                                        isMajor: false,
                                        link: `/projects/${project.slug}/pushes`
                                    }))
                                ].filter(item => {
                                    const inTimeRange = item.date >= startDate && item.date <= endDate;
                                    const passFilter = activeFilters.size === 0 || activeFilters.has(item.type);
                                    return inTimeRange && passFilter;
                                });

                                return (
                                    <div
                                        key={project.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, pIdx)}
                                        onDragOver={(e) => handleDragOver(e, pIdx)}
                                        onDragEnd={() => setDraggedIndex(null)}
                                        className={cn(
                                            "group flex h-16 transition-colors relative",
                                            isHidden ? "bg-muted/50 opacity-60" : "hover:bg-muted/30",
                                            draggedIndex === pIdx && "bg-primary/10 opacity-50 ring-2 ring-primary ring-inset z-20",
                                            // Raise z-index if any item in this row is hovered
                                            hoveredItemId && timelineItems.some(i => i.id === hoveredItemId) && "z-50"
                                        )}
                                    >
                                        <div className="w-64 flex-shrink-0 flex items-center px-4 border-r bg-card/50">
                                            <div className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <Link
                                                    href={`/projects/${project.slug}/overview`}
                                                    className="text-sm font-semibold hover:underline truncate"
                                                >
                                                    {project.name}
                                                </Link>
                                                <div className="flex gap-2 mt-0.5">
                                                    <div className={cn("h-1.5 w-1.5 rounded-full mt-1", projectColor)} />
                                                    <span className="text-[10px] text-muted-foreground uppercase">
                                                        {timelineItems.length} items
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleProjectVisibility(project.id)}
                                                className="ml-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all"
                                                title={isHidden ? "Unhide project" : "Hide project from timeline"}
                                            >
                                                {isHidden ? <Eye className="h-4 w-4 text-amber-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                            </button>
                                        </div>

                                        <div className="relative flex-1 mr-8">
                                            {/* X-axis lines */}
                                            {quarters.map((q, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute h-full w-px bg-border/30 z-0"
                                                    style={{ left: `${q.percent}%` }}
                                                />
                                            ))}

                                            {/* Timeline Markers */}
                                            <div className="absolute inset-y-0 w-full flex items-center">
                                                <div className="h-px w-full bg-border/50" />
                                                {timelineItems.map((item) => {
                                                    const percent = getTimelinePosition(item.date, startDate, endDate);
                                                    const isCompleted = item.status === "COMPLETED" || item.status === "ACHIEVED";
                                                    const isHovered = hoveredItemId === item.id;

                                                    // Marker size and shape
                                                    const size = item.isMajor ? "h-6 w-6" : "h-4 w-4";
                                                    const shape = item.type === "keyresult" ? "rotate-45" : "rounded-full";

                                                    return (
                                                        <Link
                                                            key={item.id}
                                                            href={item.link}
                                                            onMouseEnter={() => setHoveredItemId(item.id)}
                                                            onMouseLeave={() => setHoveredItemId(null)}
                                                            className={cn(
                                                                "absolute -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125 flex flex-col items-center top-1/2",
                                                                isHovered ? "z-50" : "z-10"
                                                            )}
                                                            style={{ left: `${percent}%` }}
                                                        >
                                                            <div
                                                                className={cn(
                                                                    "flex items-center justify-center border-2 border-background shadow-sm transition-colors",
                                                                    projectColor,
                                                                    size,
                                                                    shape,
                                                                    isCompleted && "opacity-60",
                                                                    isHovered && "ring-2 ring-primary ring-offset-2"
                                                                )}
                                                            >
                                                                {isCompleted && (
                                                                    <div className={item.type === "keyresult" ? "-rotate-45" : ""}>
                                                                        <Check className="h-3 w-3 text-white" strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Tooltip on hover */}
                                                            <div className={cn(
                                                                "absolute top-full mt-2 w-48 bg-background border-primary/20 text-foreground text-[10px] p-2 rounded border shadow-xl transition-opacity pointer-events-none z-[100]",
                                                                isHovered ? "opacity-100" : "opacity-0"
                                                            )}>
                                                                <div className="font-bold border-b pb-1 mb-1 text-center">{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(item.date)}</div>
                                                                <div className="line-clamp-3 px-1">{item.title}</div>
                                                                <div className="mt-1 text-[8px] uppercase tracking-wider text-muted-foreground text-center border-t pt-1">{item.type} • {item.status}</div>
                                                            </div>
                                                        </Link>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legend / Interactive Filter */}
            <div className="flex flex-wrap gap-4 text-xs bg-muted/50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 pr-4 border-r">
                    <span className="font-bold text-muted-foreground uppercase">Toggle Filter:</span>
                </div>

                <button
                    onClick={() => toggleFilter("milestone")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
                        activeFilters.has("milestone")
                            ? "bg-primary text-primary-foreground border-primary"
                            : activeFilters.size > 0 ? "opacity-50 grayscale" : "bg-background hover:border-primary/50"
                    )}
                >
                    <div className={cn("h-3 w-3 rounded-full border", activeFilters.has("milestone") ? "bg-primary-foreground/20 border-white" : "bg-slate-400 border-muted-foreground")} />
                    <span className="font-semibold">Milestones</span>
                </button>

                <button
                    onClick={() => toggleFilter("keyresult")}
                    className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all",
                        activeFilters.has("keyresult")
                            ? "bg-primary text-primary-foreground border-primary"
                            : activeFilters.size > 0 ? "opacity-50 grayscale" : "bg-background hover:border-primary/50"
                    )}
                >
                    <div className={cn("h-3 w-3 rotate-45 border", activeFilters.has("keyresult") ? "bg-primary-foreground/20 border-white" : "bg-slate-400 border-muted-foreground")} />
                    <span className="font-semibold">Key Results</span>
                </button>

                <div className="flex-1" />

                <div className="flex items-center gap-3 pr-4 text-[10px] text-muted-foreground border-r">
                    <div className="flex items-center gap-1.5">
                        <div className="h-4 w-4 rounded-full bg-slate-400 flex items-center justify-center">
                            <Check className="h-2 w-2 text-white" strokeWidth={4} />
                        </div>
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="h-5 w-5 rounded-full bg-slate-400 border-2 border-slate-600" />
                        <span>Major Milestone</span>
                    </div>
                </div>

                {activeFilters.size > 0 && (
                    <button
                        onClick={() => setActiveFilters(new Set())}
                        className="text-[10px] font-bold uppercase text-primary hover:underline"
                    >
                        Reset All
                    </button>
                )}
            </div>
        </div>
    );
}
