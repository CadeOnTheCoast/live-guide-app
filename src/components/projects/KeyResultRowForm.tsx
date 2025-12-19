"use client";

import { useId } from "react";
import { useFormState } from "react-dom";
import { KeyResultStatus } from "@prisma/client";
import { cycleKeyResultStatus, upsertKeyResult } from "@/app/projects/[projectSlug]/overview/actions";
import {
  keyResultFormInitialState,
  type CycleStatusState,
  type KeyResultFormState
} from "@/app/projects/[projectSlug]/overview/formState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = Object.values(KeyResultStatus) as KeyResultStatus[];

const STATUS_LABELS: Record<KeyResultStatus, { label: string; className: string }> = {
  [KeyResultStatus.GREEN]: { label: "On track", className: "bg-emerald-100 text-emerald-800" },
  [KeyResultStatus.YELLOW]: { label: "At risk", className: "bg-amber-100 text-amber-800" },
  [KeyResultStatus.RED]: { label: "Off track", className: "bg-red-100 text-red-800" }
};

type PersonOption = { id: string; name: string };
type DepartmentOption = { id: string; name: string; code: string };

type KeyResult = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  targetValue: string | null;
  unit: string | null;
  currentValue: string | null;
  status: KeyResultStatus;
  dueDate: Date | null;
  ownerId: string | null;
  departmentId: string | null;
};

type KeyResultRowFormProps = {
  projectId: string;
  objectiveId: string;
  slug: string;
  people: PersonOption[];
  departments: DepartmentOption[];
  keyResult?: KeyResult;
  isNew?: boolean;
  canEdit: boolean;
};

function toDateInputValue(date?: Date | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function KeyResultRowForm({
  projectId,
  objectiveId,
  slug,
  people,
  departments,
  keyResult,
  isNew = false,
  canEdit
}: KeyResultRowFormProps) {
  const formId = useId();
  const [state, formAction] = useFormState<KeyResultFormState, FormData>(upsertKeyResult, keyResultFormInitialState);
  const [cycleState, cycleAction] = useFormState<CycleStatusState, FormData>(cycleKeyResultStatus, {});

  const defaultStatus = keyResult?.status ?? KeyResultStatus.GREEN;

  return (
    <>
      <form
        id={formId}
        action={formAction}
        className="hidden"
        suppressHydrationWarning
      >
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="objectiveId" value={objectiveId} />
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="keyResultId" value={keyResult?.id ?? ""} />
      </form>
      <TableRow className={isNew ? "bg-muted/40" : undefined}>
        <TableCell className="align-top">
          {canEdit ? (
            <Input form={formId} name="code" defaultValue={keyResult?.code ?? ""} placeholder="KR1" />
          ) : (
            <span className="font-medium">{keyResult?.code}</span>
          )}
          {state.errors?.code && <p className="text-xs text-destructive">{state.errors.code}</p>}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <Input form={formId} name="title" defaultValue={keyResult?.title ?? ""} placeholder="Describe the key result" />
          ) : (
            <div className="font-medium">{keyResult?.title}</div>
          )}
          {state.errors?.title && <p className="text-xs text-destructive">{state.errors.title}</p>}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <Select form={formId} name="ownerId" defaultValue={keyResult?.ownerId ?? ""}>
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          ) : (
            <span>{people.find((person) => person.id === keyResult?.ownerId)?.name ?? "—"}</span>
          )}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <Select form={formId} name="departmentId" defaultValue={keyResult?.departmentId ?? ""}>
              <option value="">Unassigned</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.code} — {department.name}
                </option>
              ))}
            </Select>
          ) : (
            <span>
              {departments.find((department) => department.id === keyResult?.departmentId)?.code ?? "—"}
            </span>
          )}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <div className="flex items-center gap-2">
              <Input form={formId} name="targetValue" defaultValue={keyResult?.targetValue ?? ""} placeholder="Target" />
              <Input form={formId} name="unit" defaultValue={keyResult?.unit ?? ""} placeholder="Unit" className="w-24" />
            </div>
          ) : (
            <span>
              {keyResult?.targetValue ?? "—"} {keyResult?.unit ?? ""}
            </span>
          )}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <Input form={formId} name="currentValue" defaultValue={keyResult?.currentValue ?? ""} placeholder="Current" />
          ) : (
            <span>{keyResult?.currentValue ?? "—"}</span>
          )}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <div className="flex items-center gap-2">
              <Select form={formId} name="status" defaultValue={defaultStatus}>
                {STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
              {keyResult && (
                <form action={cycleAction}>
                  <input type="hidden" name="keyResultId" value={keyResult.id} />
                  <input type="hidden" name="slug" value={slug} />
                  <Button type="submit" size="sm" variant="outline">
                    Cycle
                  </Button>
                </form>
              )}
            </div>
          ) : keyResult ? (
            <Badge className={STATUS_LABELS[keyResult.status].className}>{STATUS_LABELS[keyResult.status].label}</Badge>
          ) : null}
          {cycleState?.formError && <p className="text-xs text-destructive">{cycleState.formError}</p>}
        </TableCell>
        <TableCell className="align-top">
          {canEdit ? (
            <Input form={formId} name="dueDate" type="date" defaultValue={toDateInputValue(keyResult?.dueDate ?? null)} />
          ) : keyResult?.dueDate ? (
            new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(keyResult.dueDate))
          ) : (
            "—"
          )}
          {state.errors?.dueDate && <p className="text-xs text-destructive">{state.errors.dueDate}</p>}
        </TableCell>
        {canEdit && (
          <TableCell className="align-top text-right">
            <div className="flex flex-col items-end gap-2">
              <Button type="submit" form={formId} size="sm" variant={isNew ? "default" : "outline"}>
                {isNew ? "Add" : "Save"}
              </Button>
              {state.formError && <p className="text-xs text-destructive">{state.formError}</p>}
            </div>
          </TableCell>
        )}
      </TableRow>
    </>
  );
}
