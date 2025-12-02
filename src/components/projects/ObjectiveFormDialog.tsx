"use client";

import { useEffect, useMemo, useState } from "react";
import { useFormState } from "react-dom";
import { ObjectiveStatus } from "@prisma/client";
import { ObjectiveFormState, getObjectiveInitialState, upsertObjective } from "@/app/projects/[projectSlug]/overview/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS = Object.values(ObjectiveStatus) as ObjectiveStatus[];

function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export type ObjectiveFormDialogProps = {
  projectId: string;
  slug: string;
  triggerLabel: string;
  objective?: {
    id: string;
    title: string;
    description: string | null;
    timeframeStart: Date | null;
    timeframeEnd: Date | null;
    status: ObjectiveStatus;
  } | null;
};

export function ObjectiveFormDialog({ projectId, slug, triggerLabel, objective }: ObjectiveFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState<ObjectiveFormState, FormData>(upsertObjective, getObjectiveInitialState());

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  const defaultStatus = useMemo(() => objective?.status ?? ObjectiveStatus.ON_TRACK, [objective?.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={objective ? "outline" : "default"}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{objective ? "Edit objective" : "Create objective"}</DialogTitle>
          <DialogDescription>Define the current objective for this project.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="objectiveId" value={objective?.id ?? ""} />
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <Input id="title" name="title" defaultValue={objective?.title ?? ""} required />
            {state.errors.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="description">
              Description
            </label>
            <Textarea id="description" name="description" defaultValue={objective?.description ?? ""} rows={4} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="timeframeStart">
                Timeframe start
              </label>
              <Input id="timeframeStart" name="timeframeStart" type="date" defaultValue={toDateInputValue(objective?.timeframeStart)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="timeframeEnd">
                Timeframe end
              </label>
              <Input id="timeframeEnd" name="timeframeEnd" type="date" defaultValue={toDateInputValue(objective?.timeframeEnd)} />
              {state.errors.timeframe && <p className="text-sm text-destructive">{state.errors.timeframe}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="status">
              Status
            </label>
            <Select id="status" name="status" defaultValue={defaultStatus}>
              {STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </Select>
            {state.errors.status && <p className="text-sm text-destructive">{state.errors.status}</p>}
          </div>
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <DialogFooter>
            <Button type="submit">Save objective</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
