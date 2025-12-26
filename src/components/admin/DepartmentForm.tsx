"use client";

import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { departmentInitialState, type DepartmentFormState } from "@/app/admin/departments/formState";
import { upsertDepartment } from "@/app/admin/departments/actions";
import { Checkbox } from "@/components/ui/checkbox";

type DepartmentFormProps = {
  department?: { id: string; name: string; code: string; isActive?: boolean; sortOrder?: number } | null;
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
          <p className="text-sm text-muted-foreground">Manage department name, code, and visibility.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="name">
              Name
            </label>
            <Input id="name" name="name" defaultValue={department?.name} />
            {state.errors.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="code">
              Code {department && "(Immutable)"}
            </label>
            <Input
              id="code"
              name="code"
              defaultValue={department?.code}
              readOnly={!!department}
              className={department ? "bg-muted cursor-not-allowed" : ""}
            />
            {state.errors.code && <p className="text-sm text-destructive">{state.errors.code}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="sortOrder">
                Sort Order
              </label>
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={department?.sortOrder ?? 0} />
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="isActive"
                name="isActive"
                defaultChecked={department ? department.isActive : true}
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Active
              </label>
            </div>
          </div>

          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <Button type="submit" className="w-full">Save Department</Button>
        </CardContent>
      </Card>
    </form>
  );
}
