"use client";

import { useMemo, useState } from "react";
import { Activity, ActivityStatus, Push } from "@prisma/client";
import { ActivityFormDialog } from "@/components/projects/pushes/ActivityFormDialog";
import { PushFormDialog } from "@/components/projects/pushes/PushFormDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { updateActivityOwner, updateActivityStatus } from "@/app/projects/[projectSlug]/pushes/actions";

const STATUS_COLUMNS: ActivityStatus[] = [
  ActivityStatus.NOT_STARTED,
  ActivityStatus.IN_PROGRESS,
  ActivityStatus.BLOCKED,
  ActivityStatus.COMPLETED
];

function formatDate(date?: Date | string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed);
}

function isCurrentPush(push: Push) {
  const today = new Date();
  return push.startDate <= today && push.endDate >= today;
}

type ActivityWithRelations = Activity & {
  owner?: { id: string; name: string } | null;
  department?: { id: string; name: string; code: string } | null;
  relatedKr?: { id: string; code: string; title: string } | null;
  relatedMilestone?: { id: string; title: string } | null;
};

type PushWithRelations = Push & { activities: ActivityWithRelations[] };

type PushesViewProps = {
  project: { id: string; name: string; slug: string; status: string; primaryOwner?: { id: string; name: string } | null };
  pushes: PushWithRelations[];
  canEdit: boolean;
  people: { id: string; name: string }[];
  departments: { id: string; name: string; code: string }[];
  milestones: { id: string; title: string }[];
  objectives: { id: string; title: string; isCurrent: boolean }[];
  keyResults: { id: string; code: string; title: string }[];
  currentPushId?: string | null;
  currentObjectiveId?: string | null;
};

export function PushesView({
  project,
  pushes,
  canEdit,
  people,
  departments,
  milestones,
  objectives,
  keyResults,
  currentPushId,
  currentObjectiveId
}: PushesViewProps) {
  const defaultPushId = useMemo(() => {
    if (currentPushId) return currentPushId;
    return pushes[0]?.id ?? null;
  }, [currentPushId, pushes]);

  const [selectedPushId, setSelectedPushId] = useState<string | null>(defaultPushId);
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "ALL">("ALL");
  const [departmentFilter, setDepartmentFilter] = useState<string | "ALL">("ALL");

  const selectedPush = pushes.find((push) => push.id === selectedPushId) ?? pushes[0];
  const selectedActivities = selectedPush?.activities ?? [];

  const filteredActivities = selectedActivities.filter((activity: ActivityWithRelations) => {
    const matchesStatus = statusFilter === "ALL" || activity.status === statusFilter;
    const matchesDepartment =
      departmentFilter === "ALL" || (activity.department && activity.department.id === departmentFilter);
    return matchesStatus && matchesDepartment;
  });

  const grouped = STATUS_COLUMNS.map((status) => ({
    status,
    activities: filteredActivities.filter((activity: ActivityWithRelations) => activity.status === status)
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Pushes</CardTitle>
          {canEdit && (
            <PushFormDialog
              projectId={project.id}
              slug={project.slug}
              objectives={objectives}
              defaultSequenceIndex={pushes.length ? Math.max(...pushes.map((p) => p.sequenceIndex)) + 1 : 1}
              currentObjectiveId={currentObjectiveId}
            />
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {pushes.length === 0 ? (
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>No pushes have been created yet.</p>
              {canEdit && <p>Use the button above to create the first push.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {pushes.map((push) => (
                <button
                  key={push.id}
                  onClick={() => setSelectedPushId(push.id)}
                  className={`w-full rounded-lg border p-3 text-left transition hover:border-primary ${
                    selectedPush?.id === push.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{push.name}</p>
                      {isCurrentPush(push) && <Badge variant="secondary">Current</Badge>}
                    </div>
                    {canEdit && (
                      <PushFormDialog
                        projectId={project.id}
                        slug={project.slug}
                        objectives={objectives}
                        push={push}
                        currentObjectiveId={currentObjectiveId}
                      />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(push.startDate)} – {formatDate(push.endDate)}
                  </p>
                  {push.highLevelSummary && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{push.highLevelSummary}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-full">
        <CardHeader className="flex flex-col gap-2 border-b pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-muted-foreground">Push board</p>
              <CardTitle>{selectedPush ? selectedPush.name : "No push selected"}</CardTitle>
              {selectedPush && (
                <p className="text-sm text-muted-foreground">
                  {formatDate(selectedPush.startDate)} – {formatDate(selectedPush.endDate)}
                </p>
              )}
            </div>
            {selectedPush && canEdit && (
              <ActivityFormDialog
                projectId={project.id}
                slug={project.slug}
                pushId={selectedPush.id}
                people={people}
                departments={departments}
                milestones={milestones}
                keyResults={keyResults}
              />
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Department</p>
              <Select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter((event.target.value || "ALL") as typeof departmentFilter)}
                className="w-48"
              >
                <option value="ALL">All departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} – {dept.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter((event.target.value as ActivityStatus | "ALL") ?? "ALL")}
                className="w-40"
              >
                <option value="ALL">All statuses</option>
                {STATUS_COLUMNS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedPush && (
            <p className="text-sm text-muted-foreground">Select a push to view its activities.</p>
          )}
          {selectedPush && filteredActivities.length === 0 && selectedPush.activities.length > 0 && (
            <p className="text-sm text-muted-foreground">No activities match these filters.</p>
          )}
          {selectedPush && selectedPush.activities.length === 0 && (
            <div className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="text-sm font-medium">No activities added for this push.</p>
                <p className="text-sm text-muted-foreground">Create activities to plan this push.</p>
              </div>
              {canEdit && (
                <ActivityFormDialog
                  projectId={project.id}
                  slug={project.slug}
                  pushId={selectedPush.id}
                  people={people}
                  departments={departments}
                  milestones={milestones}
                  keyResults={keyResults}
                />
              )}
            </div>
          )}

          {selectedPush && filteredActivities.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-4">
              {grouped.map((group) => (
                <div key={group.status} className="space-y-3 rounded-lg border bg-muted/50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{group.status.replace("_", " ")}</p>
                    <Badge variant="secondary">{group.activities.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {group.activities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        slug={project.slug}
                        people={people}
                        canEdit={canEdit}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

type ActivityCardProps = {
  activity: ActivityWithRelations;
  slug: string;
  people: { id: string; name: string }[];
  canEdit: boolean;
};

function ActivityCard({ activity, slug, people, canEdit }: ActivityCardProps) {
  const handleStatusChange = async (formData: FormData) => {
    await updateActivityStatus(formData);
  };

  const handleOwnerChange = async (formData: FormData) => {
    await updateActivityOwner(formData);
  };

  return (
    <div className="space-y-2 rounded-md border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-semibold leading-tight">{activity.title}</p>
          {activity.description && <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>}
        </div>
        <Badge variant="outline">{activity.status.replace("_", " ")}</Badge>
      </div>
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>Owner: {activity.owner?.name ?? "Unassigned"}</p>
        <p>Department: {activity.department?.code ?? "—"}</p>
        <p>Due: {formatDate(activity.dueDate)}</p>
        {activity.relatedKr && (
          <p>
            KR: {activity.relatedKr.code} – {activity.relatedKr.title}
          </p>
        )}
        {activity.relatedMilestone && <p>Milestone: {activity.relatedMilestone.title}</p>}
        {activity.asanaTaskGid && <p>Asana: {activity.asanaTaskGid}</p>}
      </div>
      {canEdit && (
        <div className="flex flex-wrap gap-2 pt-2 text-sm">
          <form action={handleStatusChange} className="flex-1 min-w-[160px]">
            <input type="hidden" name="activityId" value={activity.id} />
            <input type="hidden" name="slug" value={slug} />
            <Select
              name="status"
              defaultValue={activity.status}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              {STATUS_COLUMNS.map((status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ))}
            </Select>
          </form>
          <form action={handleOwnerChange} className="flex-1 min-w-[160px]">
            <input type="hidden" name="activityId" value={activity.id} />
            <input type="hidden" name="slug" value={slug} />
            <Select
              name="ownerId"
              defaultValue={activity.owner?.id ?? ""}
              onChange={(event) => event.currentTarget.form?.requestSubmit()}
            >
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </form>
        </div>
      )}
    </div>
  );
}
