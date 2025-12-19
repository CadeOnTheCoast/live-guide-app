"use client";

import { useEffect } from "react";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { useFormState } from "react-dom";
import { upsertMilestone } from "@/app/projects/[projectSlug]/timeline/actions";
import { milestoneInitialState, type MilestoneFormState } from "@/app/projects/[projectSlug]/timeline/formState";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MilestoneWithRelations } from "./utils";

type MilestoneFormProps = {
  projectId: string;
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: MilestoneWithRelations | null;
  departments: { id: string; name: string; code: string }[];
  objectives: { id: string; title: string }[];
  pushes: { id: string; name: string }[];
};

export function MilestoneForm({ projectId, slug, open, onOpenChange, defaultValues, departments, objectives, pushes }: MilestoneFormProps) {
  const [state, formAction] = useFormState<MilestoneFormState, FormData>(
    upsertMilestone,
    milestoneInitialState
  );

  const errors = state?.errors ?? {};
  const statusOptions = Object.values(MilestoneStatus) as MilestoneStatus[];
  const categoryOptions = Object.values(MilestoneCategory) as MilestoneCategory[];

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
    }
  }, [state.success, onOpenChange]);

  const isEditing = Boolean(defaultValues?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit milestone" : "Add milestone"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          {defaultValues?.id && (
            <input type="hidden" name="milestoneId" value={defaultValues.id} />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={defaultValues?.title ?? ""}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {Array.isArray(errors.title)
                      ? errors.title.join(", ")
                      : errors.title}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={
                      defaultValues ? formatInputDate(defaultValues.date) : ""
                    }
                  />
                  {errors.date && (
                    <p className="text-sm text-destructive">
                      {Array.isArray(errors.date)
                        ? errors.date.join(", ")
                        : errors.date}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asanaTaskGid">Asana task GID</Label>
                  <Input
                    id="asanaTaskGid"
                    name="asanaTaskGid"
                    defaultValue={defaultValues?.asanaTaskGid ?? ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  defaultValue={defaultValues?.description ?? ""}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    id="category"
                    name="category"
                    defaultValue={
                      (defaultValues?.category as MilestoneCategory) ??
                      MilestoneCategory.OTHER
                    }
                  >
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    id="status"
                    name="status"
                    defaultValue={
                      (defaultValues?.status as MilestoneStatus) ??
                      MilestoneStatus.PLANNED
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    id="isMajor"
                    name="isMajor"
                    type="checkbox"
                    className="h-4 w-4 rounded border"
                    defaultChecked={defaultValues?.isMajor ?? false}
                  />
                  <Label htmlFor="isMajor">Major milestone</Label>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="leadDepartmentId">Lead department</Label>
                  <Select
                    id="leadDepartmentId"
                    name="leadDepartmentId"
                    defaultValue={defaultValues?.leadDepartmentId ?? ""}
                  >
                    <option value="">Unassigned</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} — {dept.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relatedObjectiveId">Objective</Label>
                  <Select
                    id="relatedObjectiveId"
                    name="relatedObjectiveId"
                    defaultValue={defaultValues?.relatedObjectiveId ?? ""}
                  >
                    <option value="">None</option>
                    {objectives.map((objective) => (
                      <option key={objective.id} value={objective.id}>
                        {objective.title}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pushId">Push</Label>
                  <Select
                    id="pushId"
                    name="pushId"
                    defaultValue={defaultValues?.pushId ?? ""}
                  >
                    <option value="">None</option>
                    {pushes.map((push) => (
                      <option key={push.id} value={push.id}>
                        {push.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              {state.formError && (
                <p className="text-sm text-destructive">{state.formError}</p>
              )}
              <Button type="submit">
                {isEditing ? "Update" : "Create"} milestone
              </Button>
            </CardFooter>
          </Card>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function formatInputDate(value: Date | string) {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  return date.toISOString().substring(0, 10);
}
