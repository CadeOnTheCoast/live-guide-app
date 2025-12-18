"use client";

import { useFormState } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  deleteDepartment,
  deleteDepartmentInitialState,
  type DeleteDepartmentState
} from "@/app/admin/departments/actions";

export default function DepartmentDeleteButton({ departmentId }: { departmentId: string }) {
  const [state, formAction] = useFormState<DeleteDepartmentState, FormData>(
    deleteDepartment,
    deleteDepartmentInitialState
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="id" value={departmentId} />
      <Button type="submit" variant="outline" size="sm" className="text-destructive">
        Delete
      </Button>
      {state.formError && <p className="text-xs text-destructive">{state.formError}</p>}
    </form>
  );
}
