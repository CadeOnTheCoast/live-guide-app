"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { MilestoneCategory } from "@prisma/client";
import { deleteMilestone, getMilestoneDeleteInitialState } from "@/app/projects/[projectSlug]/timeline/actions";
import { MilestoneFormDialog } from "@/components/projects/timeline/MilestoneFormDialog";
import { MilestoneWithRelations } from "@/components/projects/timeline/ProjectTimelineView";
import { formatDisplayDate } from "@/components/projects/timeline/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const asanaUrl = (gid?: string | null) => (gid ? `https://app.asana.com/0/${gid}` : null);

type MilestoneDetailPanelProps = {
  milestone: MilestoneWithRelations | null;
  canEdit: boolean;
  slug: string;
  departments: { id: string; name: string; code: string }[];
  objectives: { id: string; title: string }[];
  pushes: { id: string; name: string }[];
  categoryColors: Record<MilestoneCategory, string>;
};

export function MilestoneDetailPanel({
  milestone,
  canEdit,
  slug,
  departments,
  objectives,
  pushes,
  categoryColors
}: MilestoneDetailPanelProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteState, deleteAction] = useFormState(deleteMilestone, getMilestoneDeleteInitialState());

  useEffect(() => {
    if (deleteState.success) {
      setDeleteOpen(false);
    }
  }, [deleteState.success]);

  if (!milestone) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Milestone details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a milestone to view details.</p>
        </CardContent>
      </Card>
    );
  }

  const asanaLink = asanaUrl(milestone.asanaTaskGid);
  const categoryColor = categoryColors[milestone.category];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3">
        <div className="space-y-1">
          <p className="text-sm uppercase tracking-wide text-muted-foreground">Details</p>
          <CardTitle className="flex items-center gap-2">{milestone.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className={`flex items-center gap-2 rounded-full px-2 py-1 text-xs text-white ${categoryColor}`}>
              {milestone.category}
            </span>
            <Badge variant="outline">{milestone.status}</Badge>
            {milestone.isMajor && <Badge variant="secondary">Major</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">{formatDisplayDate(milestone.date)}</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap justify-end gap-2">
            <MilestoneFormDialog
              projectId={milestone.projectId}
              slug={slug}
              departments={departments}
              objectives={objectives}
              pushes={pushes}
              milestone={milestone}
              triggerVariant="outline"
              triggerSize="sm"
              triggerLabel="Edit"
            />
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete milestone</DialogTitle>
                  <DialogDescription>
                    {milestone.activities.length || milestone.commsItems.length || milestone.pressureAssets.length
                      ? "This milestone is linked to activities or comms items. Remove those links first before deleting."
                      : "This action cannot be undone."}
                  </DialogDescription>
                </DialogHeader>
                <form action={deleteAction} className="space-y-3">
                  <input type="hidden" name="milestoneId" value={milestone.id} />
                  <input type="hidden" name="slug" value={slug} />
                  {deleteState.formError && <p className="text-sm text-destructive">{deleteState.formError}</p>}
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="outline" className="border-destructive text-destructive">
                      Delete
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {milestone.description ? <p className="text-muted-foreground">{milestone.description}</p> : null}
        {milestone.leadDepartment && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Lead department</p>
            <p className="font-medium">
              {milestone.leadDepartment.code} – {milestone.leadDepartment.name}
            </p>
          </div>
        )}
        {milestone.relatedObjective && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Related objective</p>
            <p className="font-medium">{milestone.relatedObjective.title}</p>
          </div>
        )}
        {milestone.push && (
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Related push</p>
            <p className="font-medium">{milestone.push.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatDisplayDate(milestone.push.startDate)} – {formatDisplayDate(milestone.push.endDate)}
            </p>
          </div>
        )}
        {asanaLink && (
          <div>
            <Button variant="outline" size="sm" asChild>
              <Link href={asanaLink} target="_blank" rel="noreferrer">
                Open in Asana
              </Link>
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Activities</p>
          {milestone.activities.length === 0 ? (
            <p className="text-muted-foreground">No linked activities.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestone.activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>{activity.title}</TableCell>
                    <TableCell>{activity.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Comms items</p>
          {milestone.commsItems.length === 0 ? (
            <p className="text-muted-foreground">No linked comms items.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestone.commsItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.type}</TableCell>
                    <TableCell>{item.status}</TableCell>
                    <TableCell>{formatDisplayDate(item.actualDate || item.plannedDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pressure assets</p>
          {milestone.pressureAssets.length === 0 ? (
            <p className="text-muted-foreground">No linked pressure assets.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Corner</TableHead>
                  <TableHead>Power rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {milestone.pressureAssets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell>{asset.title}</TableCell>
                    <TableCell>{asset.corner}</TableCell>
                    <TableCell>{asset.powerRating}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
