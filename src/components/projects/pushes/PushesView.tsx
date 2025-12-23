"use client";

import { useMemo, useState } from "react";
import { Activity, ActivityStatus, Push } from "@prisma/client";
import { ActivityFormDialog } from "@/components/projects/pushes/ActivityFormDialog";
import { PushFormDialog } from "@/components/projects/pushes/PushFormDialog";
import { Badge } from "@/components/ui/badge";
import { updateActivityStatus } from "@/app/projects/[projectSlug]/pushes/actions";
import { Calendar, Filter, Users, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STATUS_COLUMNS: ActivityStatus[] = [
  ActivityStatus.NOT_STARTED,
  ActivityStatus.IN_PROGRESS,
  ActivityStatus.BLOCKED,
  ActivityStatus.COMPLETED
];

const STATUS_CONFIG: Record<ActivityStatus, { label: string; color: string; border: string }> = {
  [ActivityStatus.NOT_STARTED]: { label: "To Do", color: "bg-brand-sky/20 text-brand-charcoal", border: "border-brand-sky/30" },
  [ActivityStatus.IN_PROGRESS]: { label: "In Progress", color: "bg-brand-teal/20 text-brand-teal", border: "border-brand-teal/30" },
  [ActivityStatus.BLOCKED]: { label: "Blocked", color: "bg-rose-100 text-rose-700", border: "border-rose-200" },
  [ActivityStatus.COMPLETED]: { label: "Done", color: "bg-brand-mint/20 text-brand-charcoal", border: "border-brand-mint/30" }
};


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
  const [departmentFilter, setDepartmentFilter] = useState<string | "ALL">("ALL");

  const selectedPush = pushes.find((push) => push.id === selectedPushId) ?? pushes[0];
  const selectedActivities = selectedPush?.activities ?? [];

  const filteredActivities = selectedActivities.filter((activity: ActivityWithRelations) => {
    const matchesDepartment =
      departmentFilter === "ALL" || (activity.department && activity.department.id === departmentFilter);
    return matchesDepartment;
  });

  const grouped = STATUS_COLUMNS.map((status) => ({
    status,
    activities: filteredActivities.filter((activity: ActivityWithRelations) => activity.status === status)
  }));

  const handleDragStart = (e: React.DragEvent, activityId: string) => {
    e.dataTransfer.setData("activityId", activityId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: ActivityStatus) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData("activityId");
    if (!activityId) return;

    const formData = new FormData();
    formData.append("activityId", activityId);
    formData.append("status", newStatus);
    formData.append("slug", project.slug);

    await updateActivityStatus(formData);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header Area with Filters and Push Selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 bg-white p-4 rounded-xl border border-brand-sky/20 shadow-sm">
        <div className="flex flex-wrap items-center gap-6">
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sage flex items-center gap-1.5">
              <Calendar className="h-3 w-3" /> Select Push
            </p>
            <div className="flex items-center gap-2">
              <select
                value={selectedPushId ?? ""}
                onChange={(e) => setSelectedPushId(e.target.value)}
                className="bg-brand-sky/5 border-none text-sm font-semibold rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-teal min-w-[240px]"
              >
                {pushes.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {isCurrentPush(p) ? " (Current)" : ""}
                  </option>
                ))}
              </select>
              {canEdit && (
                <PushFormDialog
                  projectId={project.id}
                  slug={project.slug}
                  objectives={objectives}
                  defaultSequenceIndex={pushes.length ? Math.max(...pushes.map((p) => p.sequenceIndex)) + 1 : 1}
                  currentObjectiveId={currentObjectiveId}
                  trigger={<Button variant="ghost" size="icon" className="h-9 w-9 text-brand-teal hover:bg-brand-teal/10"><Plus className="h-5 w-5" /></Button>}
                />
              )}
            </div>
          </div>

          <div className="h-10 w-[1px] bg-brand-sky/20 hidden md:block"></div>

          <div className="space-y-1.5 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-sage flex items-center gap-1.5">
              <Filter className="h-3 w-3" /> Filter Department
            </p>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-brand-sky/5 border-none text-sm font-medium rounded-lg px-3 py-2 focus:ring-2 focus:ring-brand-teal"
            >
              <option value="ALL">All Departments</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
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
            trigger={<Button className="bg-brand-teal hover:bg-brand-teal/90 text-white font-rajdhani shadow-md"><Plus className="h-4 w-4 mr-2" /> CREATE ACTIVITY</Button>}
          />
        )}
      </div>

      {/* Board Layout */}
      {!selectedPush ? (
        <div className="py-20 text-center bg-white rounded-xl border border-dashed text-muted-foreground">Select a push to view activities.</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
          {grouped.map((group) => (group.status !== ActivityStatus.BLOCKED || group.activities.length > 0) && (
            <div
              key={group.status}
              className="flex flex-col flex-shrink-0 w-72 rounded-xl bg-brand-sky/5 border border-brand-sky/10"
              onDrop={(e) => handleDrop(e, group.status)}
              onDragOver={handleDragOver}
            >
              <div className={cn("flex items-center justify-between p-3 border-b-2 rounded-t-xl", STATUS_CONFIG[group.status].border, "bg-white/50 backdrop-blur-sm")}>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">{STATUS_CONFIG[group.status].label}</p>
                  <Badge variant="outline" className="bg-white border-brand-sky/30 text-[10px] h-5 min-w-[20px] justify-center px-1 font-bold">{group.activities.length}</Badge>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-3 min-h-[400px]">
                {group.activities.map((activity: ActivityWithRelations) => (
                  <div
                    key={activity.id}
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, activity.id)}
                    className="group"
                  >
                    <ActivityCard
                      activity={activity}
                      projectId={project.id}
                      slug={project.slug}
                      pushId={selectedPush.id}
                      people={people}
                      departments={departments}
                      milestones={milestones}
                      keyResults={keyResults}
                      canEdit={canEdit}
                    />
                  </div>
                ))}
                {group.activities.length === 0 && (
                  <div className="h-20 border border-dashed border-brand-sky/20 rounded-lg flex items-center justify-center">
                    <p className="text-[10px] text-brand-sage/50 font-bold uppercase">Empty</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type ActivityCardProps = {
  activity: ActivityWithRelations;
  projectId: string;
  slug: string;
  pushId: string;
  people: { id: string; name: string }[];
  departments: { id: string; name: string; code: string }[];
  milestones: { id: string; title: string }[];
  keyResults: { id: string; code: string; title: string }[];
  canEdit: boolean;
};

function ActivityCard({ activity, projectId, slug, pushId, people, departments, milestones, keyResults }: ActivityCardProps) {
  return (
    <ActivityFormDialog
      projectId={projectId}
      slug={slug}
      pushId={pushId}
      people={people}
      departments={departments}
      milestones={milestones}
      keyResults={keyResults}
      activity={activity}
      trigger={
        <div className="group relative space-y-3 rounded-lg border border-brand-sky/20 bg-white p-3 shadow-sm transition-all hover:border-brand-teal hover:shadow-md cursor-pointer">
          <div className="space-y-1">
            <p className="font-semibold text-xs leading-snug group-hover:text-brand-teal transition-colors line-clamp-2">{activity.title}</p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5">
              <div className="h-5 w-5 rounded-full bg-brand-sky/20 flex items-center justify-center text-[10px] font-bold text-brand-teal">
                {activity.owner?.name?.charAt(0) || <Users className="h-3 w-3" />}
              </div>
              <span className="text-[10px] font-medium text-brand-charcoal/70 truncate max-w-[80px]">
                {activity.owner?.name?.split(' ')[0] ?? "Unassigned"}
              </span>
            </div>
            <Badge className="bg-brand-sage/10 text-brand-sage border-brand-sage/20 text-[9px] h-4 px-1 uppercase tracking-tight font-bold">
              {activity.department?.code ?? "—"}
            </Badge>
          </div>

          {activity.dueDate && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-brand-sage/60 uppercase tracking-tight border-t border-brand-sky/5 pt-2">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(activity.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      }
    />
  );
}
