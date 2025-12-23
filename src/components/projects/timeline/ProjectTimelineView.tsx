"use client";

import { useMemo, useState, useTransition } from "react";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import { deleteMilestone } from "@/app/projects/[projectSlug]/timeline/actions";
import { ProjectHeader } from "@/components/projects/ProjectHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/date";
import {
  filterMilestonesByYearRange,
  getMilestoneYearBounds,
  MilestoneWithRelations,
  sortMilestonesByDate
} from "./utils";
import { MilestoneArc, departmentColorClasses } from "./MilestoneArc";
import { MilestoneDetailPanel } from "./MilestoneDetailPanel";
import { MilestoneForm } from "./MilestoneForm";

type ProjectTimelineViewProps = {
  project: {
    id: string;
    name: string;
    slug: string;
    status: string;
    primaryOwnerName: string | null;
    asanaProjectGid: string | null;
    asanaUrl: string | null;
    teamsUrl: string | null;
    projectFolderUrl: string | null;
    projectNotesUrl: string | null;
    caseForChangePageUrl: string | null;
    badges: string[];
  };
  milestones: MilestoneWithRelations[];
  keyResults: { id: string; code: string; title: string; date: Date; departmentId: string | null; status: string }[];
  canEdit: boolean;
  departments: { id: string; name: string; code: string }[];
  objectives: { id: string; title: string }[];
  pushes: { id: string; name: string; startDate: Date; endDate: Date }[];
};

export function ProjectTimelineView({ project, milestones, keyResults, canEdit, departments, objectives, pushes }: ProjectTimelineViewProps) {
  const bounds = useMemo(() => getMilestoneYearBounds(milestones), [milestones]);
  const [startYear, setStartYear] = useState(bounds.startYear);
  const [endYear, setEndYear] = useState(bounds.endYear);
  const [selectedId, setSelectedId] = useState<string | null>(milestones[0]?.id ?? null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneWithRelations | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeDepartments, setActiveDepartments] = useState<string[]>(departments.map(d => d.code).concat(["OTHER"]));

  const filtered = useMemo(() => {
    let ordered = sortMilestonesByDate(milestones);
    ordered = filterMilestonesByYearRange(ordered, startYear, endYear);
    return ordered.filter(m => activeDepartments.includes(m.leadDepartment?.code ?? "OTHER"));
  }, [milestones, startYear, endYear, activeDepartments]);

  const selected = filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? null;

  const startDate = new Date(`${startYear}-01-01T00:00:00Z`);
  const endDate = new Date(`${endYear}-12-31T23:59:59Z`);

  const filteredKeyResults = useMemo(() => {
    return keyResults.filter(kr => {
      if (!kr.date) return false;
      const year = new Date(kr.date).getFullYear();
      return year >= startYear && year <= endYear;
    });
  }, [keyResults, startYear, endYear]);

  const colorLegend = departmentColorClasses();

  const toggleDept = (code: string) => {
    setActiveDepartments(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleDelete = (milestone: MilestoneWithRelations) => {
    const hasLinks = milestone.activities.length || milestone.commsItems.length || milestone.pressureAssets.length;
    const message = hasLinks
      ? "This milestone is linked to activities or comms items. Remove those links first before deleting."
      : "Are you sure you want to delete this milestone?";
    if (hasLinks || !window.confirm(message)) {
      if (hasLinks) {
        alert(message);
      }
      return;
    }

    startTransition(async () => {
      await deleteMilestone({ milestoneId: milestone.id, projectId: project.id, slug: project.slug });
      setSelectedId(null);
    });
  };

  const emptyState = filtered.length === 0;

  return (
    <div className="space-y-6">
      <ProjectHeader
        project={{
          name: project.name,
          status: project.status,
          primaryOwnerName: project.primaryOwnerName,
          asanaProjectGid: project.asanaProjectGid,
          asanaUrl: project.asanaUrl,
          teamsUrl: project.teamsUrl,
          projectFolderUrl: project.projectFolderUrl,
          projectNotesUrl: project.projectNotesUrl,
          caseForChangePageUrl: project.caseForChangePageUrl,
          badges: project.badges
        }}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Timeline controls</CardTitle>
          {canEdit && (
            <Button
              onClick={() => {
                setEditingMilestone(null);
                setFormOpen(true);
              }}
            >
              Add milestone
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Start year</label>
              <Input
                type="number"
                value={startYear}
                min={bounds.startYear}
                onChange={(e) => setStartYear(Number(e.target.value) || bounds.startYear)}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">End year</label>
              <Input
                type="number"
                value={endYear}
                min={startYear}
                onChange={(e) => setEndYear(Number(e.target.value) || bounds.endYear)}
              />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Filter by department:
            <div className="mt-2 flex flex-wrap gap-2">
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 bg-yellow-500/10 border-yellow-500">
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="text-[10px] font-bold uppercase">At Risk</span>
              </div>
              <div className="flex items-center gap-2 rounded-md border px-2 py-1 bg-red-600/10 border-red-600">
                <span className="h-3 w-3 rounded-full bg-red-600" />
                <span className="text-[10px] font-bold uppercase">Off Track</span>
              </div>
              <div className="h-4 w-px bg-border mx-1 my-auto" />
              {Object.entries(colorLegend).map(([key, value]) => {
                const isActive = activeDepartments.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => toggleDept(key)}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-1 transition-colors",
                      isActive ? "bg-muted border-primary" : "opacity-50"
                    )}
                  >
                    <span className={`h-3 w-3 rounded-full ${value}`} />
                    <span className="text-xs font-medium uppercase">{key}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {emptyState ? (
        <Card className="text-center">
          <CardContent className="py-10 space-y-3">
            <p className="text-lg font-semibold">No milestones yet</p>
            <p className="text-muted-foreground">Create a milestone to visualize the project arc.</p>
            {canEdit && (
              <Button
                onClick={() => {
                  setEditingMilestone(null);
                  setFormOpen(true);
                }}
              >
                Create the first milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <MilestoneArc
            milestones={filtered}
            keyResults={filteredKeyResults}
            pushes={pushes}
            startDate={startDate}
            endDate={endDate}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            projectSlug={project.slug}
          />

          <Card>
            <CardHeader>
              <CardTitle>Milestone list</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Lead dept</TableHead>
                    <TableHead>Push</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((milestone) => (
                    <TableRow
                      key={milestone.id}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => setSelectedId(milestone.id)}
                      data-testid="milestone-row"
                    >
                      <TableCell>{formatDate(milestone.date)}</TableCell>
                      <TableCell className="font-medium">{milestone.title}</TableCell>
                      <TableCell>{MilestoneStatus[milestone.status] ?? milestone.status}</TableCell>
                      <TableCell>{MilestoneCategory[milestone.category] ?? milestone.category}</TableCell>
                      <TableCell>{milestone.leadDepartment ? milestone.leadDepartment.code : "–"}</TableCell>
                      <TableCell>{milestone.push?.name ?? ""}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {selected && (
            <MilestoneDetailPanel
              milestone={selected}
              canEdit={canEdit}
              onEdit={(milestone) => {
                setEditingMilestone(milestone);
                setFormOpen(true);
              }}
              onDelete={handleDelete}
            />
          )}
        </>
      )}

      <MilestoneForm
        projectId={project.id}
        slug={project.slug}
        open={formOpen}
        onOpenChange={setFormOpen}
        defaultValues={editingMilestone}
        departments={departments}
        objectives={objectives}
        pushes={pushes}
      />
      {isPending && <p className="text-sm text-muted-foreground">Updating milestones…</p>}
    </div>
  );
}
