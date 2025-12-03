"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import {
  getMilestoneInitialState,
  type MilestoneFormState,
  upsertMilestone
} from "@/app/projects/[projectSlug]/timeline/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toDateInputValue } from "@/components/projects/timeline/utils";

function enumEntries<T extends Record<string, string>>(enumObj: T) {
  return Object.values(enumObj).map((value) => ({ label: value, value }));
}

type MilestoneFormDialogProps = {
  projectId: string;
  slug: string;
  departments: { id: string; name: string; code: string }[];
  objectives: { id: string; title: string }[];
  pushes: { id: string; name: string }[];
  milestone?: {
    id: string;
    title: string;
    description: string | null;
    date: Date | string;
    isMajor: boolean;
    category: MilestoneCategory;
    status: MilestoneStatus;
    leadDepartmentId: string | null;
    relatedObjectiveId: string | null;
    pushId: string | null;
    asanaTaskGid: string | null;
  } | null;
  triggerLabel?: string;
  triggerVariant?: "ghost" | "default" | "outline" | "secondary";
  triggerSize?: "sm" | "default";
};

export function MilestoneFormDialog({
  projectId,
  slug,
  departments,
  objectives,
  pushes,
  milestone,
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "default"
}: MilestoneFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<MilestoneFormState, FormData>(upsertMilestone, getMilestoneInitialState());

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  const isEditing = Boolean(milestone);
  const label = triggerLabel ?? (isEditing ? "Edit" : "Add milestone");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize} aria-label={label}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit milestone" : "Create milestone"}</DialogTitle>
          <DialogDescription>Track major project points and related work.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="milestoneId" value={milestone?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="title">
                Title
              </label>
              <Input id="title" name="title" defaultValue={milestone?.title ?? ""} required />
              {state.errors.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="date">
                Date
              </label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={toDateInputValue(milestone?.date)}
                required
              />
              {state.errors.date && <p className="text-sm text-destructive">{state.errors.date}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="category">
                Category
              </label>
              <Select id="category" name="category" defaultValue={milestone?.category ?? MilestoneCategory.OTHER}>
                {enumEntries(MilestoneCategory).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {state.errors.category && <p className="text-sm text-destructive">{state.errors.category}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">
                Status
              </label>
              <Select id="status" name="status" defaultValue={milestone?.status ?? MilestoneStatus.PLANNED}>
                {enumEntries(MilestoneStatus).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              {state.errors.status && <p className="text-sm text-destructive">{state.errors.status}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="leadDepartmentId">
                Lead department
              </label>
              <Select id="leadDepartmentId" name="leadDepartmentId" defaultValue={milestone?.leadDepartmentId ?? ""}>
                <option value="">No lead department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.code} – {dept.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="relatedObjectiveId">
                Related objective
              </label>
              <Select id="relatedObjectiveId" name="relatedObjectiveId" defaultValue={milestone?.relatedObjectiveId ?? ""}>
                <option value="">No linked objective</option>
                {objectives.map((objective) => (
                  <option key={objective.id} value={objective.id}>
                    {objective.title}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="pushId">
                Related push
              </label>
              <Select id="pushId" name="pushId" defaultValue={milestone?.pushId ?? ""}>
                <option value="">No linked push</option>
                {pushes.map((push) => (
                  <option key={push.id} value={push.id}>
                    {push.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="asanaTaskGid">
                Asana task GID
              </label>
              <Input id="asanaTaskGid" name="asanaTaskGid" defaultValue={milestone?.asanaTaskGid ?? ""} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Context, dependencies, or detail for this milestone"
              defaultValue={milestone?.description ?? ""}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isMajor"
              name="isMajor"
              defaultChecked={milestone?.isMajor ?? false}
              className="h-4 w-4 rounded border"
            />
            <label htmlFor="isMajor" className="text-sm font-medium">
              Major milestone
            </label>
          </div>

          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}

          <DialogFooter>
            <Button type="submit">Save milestone</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
