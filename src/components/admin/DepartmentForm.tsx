"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { departmentInitialState, type DepartmentFormState } from "@/app/admin/departments/formState";
import { upsertDepartment } from "@/app/admin/departments/actions";

type DepartmentFormProps = {
  department?: { id: string; name: string; code: string } | null;
};

export default function DepartmentForm({ department }: DepartmentFormProps) {
  const [state, formAction] = useFormState<DepartmentFormState, FormData>(
    upsertDepartment,
    departmentInitialState
  );

  return (
    <form action={formAction} className="max-w-xl">
      <input type="hidden" name="id" defaultValue={department?.id} />
      <Card>
        <CardHeader>
          <CardTitle>{department ? "Edit department" : "New department"}</CardTitle>
          <p className="text-sm text-muted-foreground">Manage department name and code.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Name
            </label>
            <Input id="name" name="name" defaultValue={department?.name} />
            {state.errors.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="code">
              Code
            </label>
            <Input id="code" name="code" defaultValue={department?.code} />
            {state.errors.code && <p className="text-sm text-destructive">{state.errors.code}</p>}
          </div>
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <Button type="submit">Save</Button>
        </CardContent>
      </Card>
    </form>
  );
}
