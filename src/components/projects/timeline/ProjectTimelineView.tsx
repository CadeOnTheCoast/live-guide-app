"use client";

import { useEffect, useMemo, useState } from "react";
import { Milestone, MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { MilestoneArc } from "@/components/projects/timeline/MilestoneArc";
import { MilestoneDetailPanel } from "@/components/projects/timeline/MilestoneDetailPanel";
import { MilestoneFormDialog } from "@/components/projects/timeline/MilestoneFormDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDisplayDate, filterMilestonesByYearRange, getYearRange } from "@/components/projects/timeline/utils";

export type MilestoneWithRelations = Milestone & {
  leadDepartment?: { id: string; name: string; code: string } | null;
  relatedObjective?: { id: string; title: string } | null;
  push?: { id: string; name: string; startDate: Date | null; endDate: Date | null; sequenceIndex: number | null } | null;
  activities: { id: string; title: string; status: string }[];
  commsItems: { id: string; title: string; type: string; status: string; plannedDate: Date | null; actualDate: Date | null }[];
  pressureAssets: { id: string; title: string; corner: string; powerRating: string }[];
};

type ProjectTimelineViewProps = {
  project: { id: string; name: string; slug: string; status: string; primaryOwner?: { id: string; name: string } | null };
  milestones: MilestoneWithRelations[];
  canEdit: boolean;
  departments: { id: string; name: string; code: string }[];
  objectives: { id: string; title: string }[];
  pushes: { id: string; name: string; startDate: Date | null; endDate: Date | null; sequenceIndex: number | null }[];
};

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  LEGISLATIVE: "bg-amber-500",
  LEGAL: "bg-indigo-500",
  REGULATORY: "bg-blue-500",
  COMMUNITY: "bg-emerald-500",
  INTERNAL: "bg-slate-500",
  OTHER: "bg-gray-500"
};

function statusBadgeVariant(status: MilestoneStatus) {
  switch (status) {
    case MilestoneStatus.COMPLETED:
      return "bg-emerald-100 text-emerald-800";
    case MilestoneStatus.AT_RISK:
      return "bg-amber-100 text-amber-800";
    case MilestoneStatus.CANCELLED:
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

export function ProjectTimelineView({
  project,
  milestones,
  canEdit,
  departments,
  objectives,
  pushes
}: ProjectTimelineViewProps) {
  const { startYear: defaultStart, endYear: defaultEnd } = getYearRange(milestones);
  const [startYear, setStartYear] = useState(defaultStart);
  const [endYear, setEndYear] = useState(defaultEnd);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(milestones[0]?.id ?? null);

  const filteredMilestones = useMemo(
    () => filterMilestonesByYearRange(milestones, startYear, endYear),
    [milestones, startYear, endYear]
  );

  useEffect(() => {
    if (filteredMilestones.length === 0) {
      setSelectedMilestoneId(null);
      return;
    }

    if (!selectedMilestoneId || !filteredMilestones.find((milestone) => milestone.id === selectedMilestoneId)) {
      setSelectedMilestoneId(filteredMilestones[0]?.id ?? null);
    }
  }, [filteredMilestones, selectedMilestoneId]);

  const selectedMilestone = filteredMilestones.find((milestone) => milestone.id === selectedMilestoneId) ?? null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 border-b pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">Timeline</p>
            <CardTitle>Long arc</CardTitle>
          </div>
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="startYear">
                Start year
              </label>
              <Input
                id="startYear"
                name="startYear"
                type="number"
                min={1900}
                value={startYear}
                onChange={(event) => setStartYear(Number(event.target.value) || defaultStart)}
                className="w-28"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wide text-muted-foreground" htmlFor="endYear">
                End year
              </label>
              <Input
                id="endYear"
                name="endYear"
                type="number"
                min={startYear}
                value={endYear}
                onChange={(event) => setEndYear(Number(event.target.value) || defaultEnd)}
                className="w-28"
              />
            </div>
            {canEdit && (
              <MilestoneFormDialog
                projectId={project.id}
                slug={project.slug}
                departments={departments}
                objectives={objectives}
                pushes={pushes}
              />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredMilestones.length === 0 ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>No milestones in this range.</p>
              {canEdit && <p>Use the button above to create the first milestone.</p>}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {Object.entries(CATEGORY_COLORS).map(([category, colorClass]) => (
                  <div key={category} className="flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${colorClass}`} />
                    <span>{category}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border-2 border-primary" />
                  <span>Major milestone</span>
                </div>
              </div>
              <MilestoneArc
                milestones={filteredMilestones}
                startYear={startYear}
                endYear={endYear}
                onSelect={setSelectedMilestoneId}
                selectedId={selectedMilestoneId}
                categoryColors={CATEGORY_COLORS}
              />
            </>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Milestones</p>
              <CardTitle>Zoomed view</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {filteredMilestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones to show.</p>
            ) : (
              <div className="divide-y">
                {filteredMilestones.map((milestone) => (
                  <button
                    key={milestone.id}
                    className={`flex w-full items-start gap-3 px-2 py-3 text-left transition hover:bg-muted ${
                      selectedMilestoneId === milestone.id ? "bg-muted/60" : ""
                    }`}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                  >
                    <div className="mt-1">
                      <span className={`block h-3 w-3 rounded-full ${CATEGORY_COLORS[milestone.category]}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{milestone.title}</p>
                        {milestone.isMajor && <Badge variant="secondary">Major</Badge>}
                        <Badge className={statusBadgeVariant(milestone.status)}>{milestone.status}</Badge>
                        <Badge variant="outline">{milestone.category}</Badge>
                        {milestone.leadDepartment && (
                          <Badge variant="outline">{milestone.leadDepartment.code}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDisplayDate(milestone.date)}</p>
                      {milestone.push && (
                        <p className="text-xs text-muted-foreground">Push: {milestone.push.name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <MilestoneDetailPanel
          milestone={selectedMilestone}
          canEdit={canEdit}
          slug={project.slug}
          departments={departments}
          objectives={objectives}
          pushes={pushes}
          categoryColors={CATEGORY_COLORS}
        />
      </div>
    </div>
  );
}
