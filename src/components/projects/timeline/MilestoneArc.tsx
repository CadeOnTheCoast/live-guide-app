"use client";

import { MilestoneCategory } from "@prisma/client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTimelinePosition, MilestoneWithRelations } from "./utils";

type MilestoneArcProps = {
  milestones: MilestoneWithRelations[];
  startDate: Date;
  endDate: Date;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
};

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  [MilestoneCategory.LEGISLATIVE]: "bg-blue-500",
  [MilestoneCategory.LEGAL]: "bg-green-500",
  [MilestoneCategory.REGULATORY]: "bg-purple-500",
  [MilestoneCategory.COMMUNITY]: "bg-amber-500",
  [MilestoneCategory.INTERNAL]: "bg-teal-500",
  [MilestoneCategory.OTHER]: "bg-slate-400"
};

export function MilestoneArc({ milestones, startDate, endDate, selectedId, onSelect }: MilestoneArcProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Milestone arc</CardTitle>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full border border-foreground" /> Major
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-foreground" /> Standard
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-1">
                <span className={cn("h-2 w-2 rounded-full", color)} />
                <span className="hidden text-xs sm:inline">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-36 w-full overflow-hidden rounded-md border bg-muted/40 p-4">
          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
          {milestones.map((milestone) => {
            const percent = getTimelinePosition(new Date(milestone.date), startDate, endDate);
            const isSelected = selectedId === milestone.id;
            const size = milestone.isMajor ? "h-4 w-4" : "h-3 w-3";
            return (
              <button
                key={milestone.id}
                type="button"
                onClick={() => onSelect?.(milestone.id)}
                className={cn(
                  "group absolute flex -translate-x-1/2 flex-col items-center gap-1 text-xs", 
                  isSelected && "font-semibold"
                )}
                style={{ left: `${percent}%`, bottom: milestone.isMajor ? "32px" : "24px" }}
                data-testid="milestone-marker"
              >
                <span
                  className={cn(
                    "rounded-full border-2 border-background p-1 shadow",
                    CATEGORY_COLORS[milestone.category],
                    size,
                    isSelected && "ring-2 ring-offset-2"
                  )}
                  aria-label={milestone.title}
                />
                <span className="hidden max-w-[140px] truncate rounded bg-background px-2 py-1 text-foreground shadow-sm md:inline">
                  {milestone.title}
                </span>
                {milestone.isMajor && <Badge variant="secondary">Major</Badge>}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function categoryColorClasses() {
  return CATEGORY_COLORS;
}
