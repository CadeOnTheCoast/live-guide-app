"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { Push } from "@prisma/client";
import { pushInitialState, type PushFormState } from "@/app/projects/[projectSlug]/pushes/formState";
import { upsertPush } from "@/app/projects/[projectSlug]/pushes/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

type PushFormDialogProps = {
  projectId: string;
  slug: string;
  objectives: { id: string; title: string; isCurrent: boolean }[];
  defaultSequenceIndex?: number;
  currentObjectiveId?: string | null;
  push?: Push;
  trigger?: React.ReactNode;
};

export function PushFormDialog({ projectId, slug, objectives, push, defaultSequenceIndex = 1, currentObjectiveId, trigger }: PushFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<PushFormState, FormData>(upsertPush, pushInitialState);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  const defaultObjective = useMemo(() => {
    if (push?.objectiveId) return push.objectiveId;
    const current = objectives.find((objective) => objective.isCurrent)?.id;
    return currentObjectiveId ?? current ?? "";
  }, [currentObjectiveId, objectives, push?.objectiveId]);

  const isEditing = Boolean(push);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant={isEditing ? "ghost" : "default"} size={isEditing ? "sm" : "default"}>
            {isEditing ? "Edit" : "New push"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit push" : "Create push"}</DialogTitle>
          <DialogDescription>Plan an 8-week push for this project.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="pushId" value={push?.id ?? ""} />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="sequenceIndex">
                Sequence
              </label>
              <Input
                id="sequenceIndex"
                name="sequenceIndex"
                type="number"
                min={1}
                defaultValue={push?.sequenceIndex ?? defaultSequenceIndex}
              />
              {state.errors.sequenceIndex && <p className="text-sm text-destructive">{state.errors.sequenceIndex}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="startDate">
                Start date
              </label>
              <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(push?.startDate)} required />
              {state.errors.startDate && <p className="text-sm text-destructive">{state.errors.startDate}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="endDate">
                End date
              </label>
              <Input id="endDate" name="endDate" type="date" defaultValue={toDateInputValue(push?.endDate)} required />
              {state.errors.endDate && <p className="text-sm text-destructive">{state.errors.endDate}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="objectiveId">
              Objective
            </label>
            <Select id="objectiveId" name="objectiveId" defaultValue={defaultObjective}>
              <option value="">No linked objective</option>
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="highLevelSummary">
                High-level summary
              </label>
              <Textarea
                id="highLevelSummary"
                name="highLevelSummary"
                rows={3}
                placeholder="Key goals, themes, or risks for this push"
                defaultValue={push?.highLevelSummary ?? ""}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="asanaProjectGid">
                Asana project GID override
              </label>
              <Input
                id="asanaProjectGid"
                name="asanaProjectGid"
                placeholder="Override canonical project GID"
                defaultValue={push?.asanaProjectGid ?? ""}
              />
            </div>
          </div>
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <DialogFooter>
            <Button type="submit">Save push</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
