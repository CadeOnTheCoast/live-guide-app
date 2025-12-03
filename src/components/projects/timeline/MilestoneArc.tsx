"use client";

import { MilestoneCategory } from "@prisma/client";
import { MilestoneWithRelations } from "@/components/projects/timeline/ProjectTimelineView";
import { calculatePositionPercent, formatDisplayDate } from "@/components/projects/timeline/utils";

type MilestoneArcProps = {
  milestones: MilestoneWithRelations[];
  startYear: number;
  endYear: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  categoryColors: Record<MilestoneCategory, string>;
};

export function MilestoneArc({ milestones, startYear, endYear, selectedId, onSelect, categoryColors }: MilestoneArcProps) {
  return (
    <div className="relative h-48 overflow-hidden rounded-md border bg-card">
      <div className="absolute left-6 right-6 top-1/2 h-[2px] bg-muted" />
      {milestones.map((milestone) => {
        const position = calculatePositionPercent(milestone.date, startYear, endYear);
        const colorClass = categoryColors[milestone.category];
        const isSelected = selectedId === milestone.id;

        return (
          <button
            key={milestone.id}
            className="absolute top-6 flex flex-col items-center"
            style={{ left: `calc(${position}% - 12px)` }}
            onClick={() => onSelect(milestone.id)}
            data-testid="milestone-marker"
            data-major={milestone.isMajor}
            data-category={milestone.category}
            aria-label={`${milestone.title} on ${formatDisplayDate(milestone.date)}`}
          >
            <div
              className={`rounded-full border-2 transition ${
                milestone.isMajor ? "h-6 w-6" : "h-4 w-4"
              } ${colorClass} ${isSelected ? "ring-2 ring-primary" : ""}`}
            />
            <span className="mt-2 line-clamp-1 text-xs font-semibold text-foreground">{milestone.title}</span>
            <span className="text-[11px] text-muted-foreground">{formatDisplayDate(milestone.date)}</span>
          </button>
        );
      })}
      <div className="absolute bottom-3 left-6 right-6 flex justify-between text-xs text-muted-foreground">
        <span>{startYear}</span>
        <span>{endYear}</span>
      </div>
    </div>
  );
}
