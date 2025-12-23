"use client";

import { useMemo } from "react";
import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/admin/SharedCheckbox";
import { personInitialState, type PersonFormState } from "@/app/admin/people/formState";
import { upsertPerson } from "@/app/admin/people/actions";

type DepartmentOption = { id: string; name: string };

type PersonFormProps = {
  person?: {
    id: string;
    name: string;
    email: string;
    defaultDepartmentId: string | null;
    isActive: boolean;
    role: string;
  } | null;
  departments: DepartmentOption[];
};

export default function PersonForm({ person, departments }: PersonFormProps) {
  const [state, formAction] = useFormState<PersonFormState, FormData>(upsertPerson, personInitialState);

  const roleOptions = useMemo(
    () => [
      { value: "VIEWER", label: "Viewer" },
      { value: "EDITOR", label: "Editor" },
      { value: "ADMIN", label: "Admin" }
    ],
    []
  );

  return (
    <form action={formAction} className="max-w-2xl space-y-4">
      <input type="hidden" name="id" defaultValue={person?.id} />
      <Card>
        <CardHeader>
          <CardTitle>{person ? "Edit person" : "New person"}</CardTitle>
          <p className="text-sm text-muted-foreground">Manage basic details and access level.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <Input id="name" name="name" defaultValue={person?.name} />
              {state.errors.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input id="email" name="email" defaultValue={person?.email} />
              {state.errors.email && <p className="text-sm text-destructive">{state.errors.email}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="defaultDepartmentId">
                Default department
              </label>
              <Select id="defaultDepartmentId" name="defaultDepartmentId" defaultValue={person?.defaultDepartmentId ?? ""}>
                <option value="">Unassigned</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="role">
                Role
              </label>
              <Select id="role" name="role" defaultValue={person?.role ?? "VIEWER"}>
                {roleOptions.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </Select>
              {state.errors.role && <p className="text-sm text-destructive">{state.errors.role}</p>}
            </div>
          </div>
          <Checkbox
            id="isActive"
            name="isActive"
            label="Active account"
            defaultChecked={person?.isActive ?? true}
          />
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
        </CardContent>
        <CardContent>
          <Button type="submit">Save</Button>
        </CardContent>
      </Card>
    </form>
  );
}
