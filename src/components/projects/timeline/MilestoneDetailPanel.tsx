"use client";

import Link from "next/link";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import { MilestoneWithRelations } from "./utils";

type MilestoneDetailPanelProps = {
  milestone: MilestoneWithRelations;
  canEdit: boolean;
  onEdit: (milestone: MilestoneWithRelations) => void;
  onDelete: (milestone: MilestoneWithRelations) => void;
};

export function MilestoneDetailPanel({ milestone, canEdit, onEdit, onDelete }: MilestoneDetailPanelProps) {
  const asanaLink = milestone.asanaTaskGid ? `https://app.asana.com/0/${milestone.asanaTaskGid}` : null;

  return (
    <Card data-testid="milestone-detail">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{milestone.title}</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-2 py-1">{MilestoneStatus[milestone.status] ?? milestone.status}</span>
            <span className="rounded-full bg-muted px-2 py-1">{MilestoneCategory[milestone.category] ?? milestone.category}</span>
            {milestone.isMajor && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-700">Major</span>}
          </div>
        </CardTitle>
        <CardDescription>{formatDate(milestone.date)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestone.description && <p className="text-sm text-muted-foreground">{milestone.description}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem label="Lead department" value={milestone.leadDepartment ? `${milestone.leadDepartment.code} — ${milestone.leadDepartment.name}` : "Unassigned"} />
          <DetailItem label="Objective" value={milestone.relatedObjective?.title ?? "None"} />
          <DetailItem label="Push" value={milestone.push?.name ?? "None"} />
          <DetailItem label="Asana" value={asanaLink ? <Link href={asanaLink as any} className="text-primary underline" target="_blank" rel="noreferrer">Open in Asana</Link> : "None"} />
        </div>

        <Section title="Activities" emptyLabel="No related activities">
          {milestone.activities.map((activity) => (
            <DetailRow key={activity.id} title={activity.title} subtitle={activity.status} />
          ))}
        </Section>

        <Section title="Comms items" emptyLabel="No related comms items">
          {milestone.commsItems.map((item) => (
            <DetailRow key={item.id} title={item.title} subtitle={`${item.type} • ${item.status}`} />
          ))}
        </Section>

        <Section title="Pressure assets" emptyLabel="No related pressure assets">
          {milestone.pressureAssets.map((asset) => (
            <DetailRow
              key={asset.id}
              title={asset.title}
              subtitle={`${asset.corner}${asset.powerRating ? ` • Power ${asset.powerRating}` : ""}`}
            />
          ))}
        </Section>
      </CardContent>
      {canEdit && (
        <CardFooter className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onEdit(milestone)}>
            Edit milestone
          </Button>
          <Button variant="destructive" onClick={() => onDelete(milestone)}>
            Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function Section({ title, emptyLabel, children }: { title: string; emptyLabel: string; children: React.ReactNode }) {
  const hasContent = Array.isArray(children) ? (children as React.ReactNode[]).length > 0 : !!children;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold">{title}</h4>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        {hasContent ? children : <p>{emptyLabel}</p>}
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1 text-sm">
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}

function DetailRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="rounded-md border bg-background px-3 py-2">
      <p className="font-medium">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
