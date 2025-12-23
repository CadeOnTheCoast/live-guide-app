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
};

const STATUS_OPTIONS = Object.values(ActivityStatus) as ActivityStatus[];

export function ActivityFormDialog({
  projectId,
  slug,
  pushId,
  people,
  departments,
  milestones,
  keyResults
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
        <Button size="sm">Create activity</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Plan activity</DialogTitle>
          <DialogDescription>Create a high-level activity tied to this push.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="pushId" value={pushId} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" name="title" placeholder="Define the activity" required />
            {state.errors.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <Textarea id="description" name="description" rows={3} placeholder="Details, milestones, risks" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="ownerId">
                Owner
              </label>
              <Select id="ownerId" name="ownerId" defaultValue="">
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
              <Select id="departmentId" name="departmentId" defaultValue="">
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
              <Select id="relatedKrId" name="relatedKrId" defaultValue="">
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
              <Select id="relatedMilestoneId" name="relatedMilestoneId" defaultValue="">
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
              <Input id="startDate" name="startDate" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dueDate">
                Due date
              </label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">
                Status
              </label>
              <Select id="status" name="status" defaultValue={ActivityStatus.NOT_STARTED}>
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
                Asana task GID
              </label>
              <Input id="asanaTaskGid" name="asanaTaskGid" placeholder="Optional task link" />
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
