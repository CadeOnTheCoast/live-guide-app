"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { ActivityStatus } from "@prisma/client";
import { activityInitialState, type ActivityFormState } from "@/app/projects/[projectSlug]/pushes/formState";
import { upsertActivity } from "@/app/projects/[projectSlug]/pushes/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ActivityFormDialogProps = {
  projectId: string;
  slug: string;
  pushId: string;
  people: { id: string; name: string }[];
  departments: { id: string; name: string; code: string }[];
  milestones: { id: string; title: string }[];
  keyResults: { id: string; code: string; title: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity?: any; // For editing
  trigger?: React.ReactNode;
};

const STATUS_OPTIONS = Object.values(ActivityStatus) as ActivityStatus[];

export function ActivityFormDialog({
  projectId,
  slug,
  pushId,
  people,
  departments,
  milestones,
  keyResults,
  activity,
  trigger
}: ActivityFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<ActivityFormState, FormData>(upsertActivity, activityInitialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button size="sm">Create activity</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{activity ? "Edit activity" : "Plan activity"}</DialogTitle>
          <DialogDescription>
            {activity ? "Update the details of this activity." : "Create a high-level activity tied to this push."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="activityId" value={activity?.id} />
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="pushId" value={pushId} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" name="title" defaultValue={activity?.title ?? ""} placeholder="Define the activity" required />
            {state.errors.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <Textarea id="description" name="description" rows={3} defaultValue={activity?.description ?? ""} placeholder="Details, milestones, risks" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ownerId">
                Owner
              </label>
              <Select id="ownerId" name="ownerId" defaultValue={activity?.ownerId ?? ""}>
                <option value="">Unassigned</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="departmentId">
                Department
              </label>
              <Select id="departmentId" name="departmentId" defaultValue={activity?.departmentId ?? ""}>
                <option value="">No department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} – {dept.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="relatedKrId">
                Related key result
              </label>
              <Select id="relatedKrId" name="relatedKrId" defaultValue={activity?.relatedKrId ?? ""}>
                <option value="">None</option>
                {keyResults.map((kr) => (
                  <option key={kr.id} value={kr.id}>
                    {kr.code}: {kr.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="relatedMilestoneId">
                Related milestone
              </label>
              <Select id="relatedMilestoneId" name="relatedMilestoneId" defaultValue={activity?.relatedMilestoneId ?? ""}>
                <option value="">None</option>
                {milestones.map((milestone) => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="startDate">
                Start date
              </label>
              <Input id="startDate" name="startDate" type="date" defaultValue={activity?.startDate ? new Date(activity.startDate).toISOString().split("T")[0] : ""} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dueDate">
                Due date
              </label>
              <Input id="dueDate" name="dueDate" type="date" defaultValue={activity?.dueDate ? new Date(activity.dueDate).toISOString().split("T")[0] : ""} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">
                Status
              </label>
              <Select id="status" name="status" defaultValue={activity?.status ?? ActivityStatus.NOT_STARTED}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace("_", " ")}
                  </option>
                ))}
              </Select>
              {state.errors.status && <p className="text-sm text-destructive">{state.errors.status}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="asanaTaskGid">
                Asana Task URL or GID
              </label>
              <div className="flex gap-2">
                <Input id="asanaTaskGid" name="asanaTaskGid" defaultValue={activity?.asanaTaskGid ?? ""} placeholder="Paste Asana URL or Task GID" />
                {activity?.asanaTaskGid && (
                  <Button variant="outline" size="icon" asChild title="Open in Asana">
                    <a href={`https://app.asana.com/0/0/${activity.asanaTaskGid}`} target="_blank" rel="noreferrer">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
                    </a>
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground italic">Tip: Pasting the full URL will automatically extract the GID.</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save activity</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
