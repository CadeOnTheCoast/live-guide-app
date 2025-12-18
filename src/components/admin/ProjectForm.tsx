"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectFormState } from "@/app/admin/projects/actions";
import { projectInitialState, upsertProject } from "@/app/admin/projects/actions";
import { Textarea } from "@/components/admin/SharedTextarea";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

type PersonOption = { id: string; name: string };

type ProjectFormProps = {
  project?: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    caseForChangeSummary: string | null;
    caseForChangePageUrl: string | null;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    primaryOwnerId: string | null;
    asanaProjectGid: string | null;
  } | null;
  people: PersonOption[];
  statusOptions: readonly string[];
  defaultStatus: string;
};

export default function ProjectForm({ project, people, statusOptions, defaultStatus }: ProjectFormProps) {
  const [state, formAction] = useFormState<ProjectFormState, FormData>(upsertProject, projectInitialState);
  const [name, setName] = useState(project?.name ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");

  useEffect(() => {
    if (!project && name && !slug) {
      setSlug(slugify(name));
    }
  }, [name, project, slug]);

  const dateToInputValue = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toISOString().substring(0, 10);
  };

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" defaultValue={project?.id} />
      <Card>
        <CardHeader>
          <CardTitle>{project ? "Edit project" : "New project"}</CardTitle>
          <p className="text-sm text-muted-foreground">Set project metadata and ownership.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="name">
                Name
              </label>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
              {state.errors.name && <p className="text-sm text-destructive">{state.errors.name}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="slug">
                Slug
              </label>
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated from name"
              />
              {state.errors.slug && <p className="text-sm text-destructive">{state.errors.slug}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="status">
                Status
              </label>
              <Select id="status" name="status" defaultValue={project?.status ?? defaultStatus}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="primaryOwnerId">
                Primary owner
              </label>
              <Select id="primaryOwnerId" name="primaryOwnerId" defaultValue={project?.primaryOwnerId ?? ""}>
                <option value="">Unassigned</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name}
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
              <Input id="startDate" name="startDate" type="date" defaultValue={dateToInputValue(project?.startDate ?? null)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="endDate">
                End date
              </label>
              <Input id="endDate" name="endDate" type="date" defaultValue={dateToInputValue(project?.endDate ?? null)} />
              {state.errors.date && <p className="text-sm text-destructive">{state.errors.date}</p>}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="caseForChangePageUrl">
                Case for Change URL
              </label>
              <Input
                id="caseForChangePageUrl"
                name="caseForChangePageUrl"
                type="url"
                defaultValue={project?.caseForChangePageUrl ?? ""}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="asanaProjectGid">
                Asana project GID
              </label>
              <Input id="asanaProjectGid" name="asanaProjectGid" defaultValue={project?.asanaProjectGid ?? ""} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="description">
                Description
              </label>
              <Textarea id="description" name="description" defaultValue={project?.description ?? ""} rows={4} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="caseForChangeSummary">
                Case for Change summary
              </label>
              <Textarea
                id="caseForChangeSummary"
                name="caseForChangeSummary"
                defaultValue={project?.caseForChangeSummary ?? ""}
                rows={4}
              />
            </div>
          </div>
          {state.formError && <p className="text-sm text-destructive">{state.formError}</p>}
          <Button type="submit">Save</Button>
        </CardContent>
      </Card>
    </form>
  );
}
