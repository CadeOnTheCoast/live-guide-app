import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTimelinePosition, MilestoneWithRelations } from "./utils";
import { Check } from "lucide-react";

type MilestoneArcProps = {
  milestones: MilestoneWithRelations[];
  keyResults: { id: string; code: string; title: string; date: Date; departmentId: string | null; status: string }[];
  startDate: Date;
  endDate: Date;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  projectSlug?: string;
};

const DEPARTMENT_COLORS: Record<string, string> = {
  GA: "bg-blue-500",
  PM: "bg-teal-500",
  COMMS: "bg-amber-500",
  CE: "bg-green-600",
  FR: "bg-purple-500",
  OTHER: "bg-slate-400"
};

function getQuarter(date: Date) {
  const month = date.getMonth();
  return Math.floor(month / 3) + 1;
}

function getQuarterLabels(startDate: Date, endDate: Date) {
  const labels: { label: string; yearLabel: string | null; percent: number }[] = [];
  const curr = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
  const end = new Date(endDate);

  while (curr <= end) {
    const q = getQuarter(curr);
    const p = getTimelinePosition(curr, startDate, endDate);
    const isFirstQ = q === 1;
    labels.push({
      label: `Q${q}`,
      yearLabel: isFirstQ || labels.length === 0 ? `${curr.getFullYear()}` : null,
      percent: p
    });
    curr.setMonth(curr.getMonth() + 3);
  }
  return labels;
}

type TimelineItem = {
  id: string;
  title: string;
  date: Date;
  isMajor?: boolean;
  deptCode: string;
  status: string;
  type: "milestone" | "keyresult" | "huddle";
};

export function MilestoneArc({ milestones, keyResults, startDate, endDate, selectedId, onSelect, pushes = [], projectSlug }: MilestoneArcProps & { pushes?: { startDate: Date }[] }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<"milestone" | "keyresult" | "huddle">>(new Set());

  const items: TimelineItem[] = useMemo(() => {
    const ms = milestones.map(m => ({
      id: m.id,
      title: m.title,
      date: new Date(m.date),
      isMajor: m.isMajor,
      type: "milestone" as const,
      deptCode: m.leadDepartment?.code ?? "OTHER",
      status: m.status
    }));
    const krs = keyResults.map(kr => ({
      id: kr.id,
      title: `${kr.code}: ${kr.title}`,
      date: new Date(kr.date),
      type: "keyresult" as const,
      deptCode: "OTHER",
      status: kr.status
    }));
    const huddles = pushes.map((p, i) => {
      const hDate = new Date(p.startDate);
      hDate.setDate(hDate.getDate() + 28); // 4 weeks later
      return {
        id: `huddle-${i}`,
        title: "Huddle",
        date: hDate,
        type: "huddle" as const,
        deptCode: "OTHER",
        status: "PLANNED"
      };
    });
    return [...ms, ...krs, ...huddles]
      .filter(item => activeFilters.size === 0 || activeFilters.has(item.type))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [milestones, keyResults, pushes, activeFilters]);

  const toggleFilter = (filter: "milestone" | "keyresult" | "huddle") => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  const stackedItems = useMemo(() => {
    const rows: TimelineItem[][] = [];

    items.forEach(item => {
      const pos = getTimelinePosition(item.date, startDate, endDate);
      let placed = false;

      for (let i = 0; i < rows.length; i++) {
        const lastInRow = rows[i][rows[i].length - 1];
        const lastPos = getTimelinePosition(lastInRow.date, startDate, endDate);

        // If there's enough horizontal space (at least 8% of timeline width)
        if (pos - lastPos > 8) {
          rows[i].push(item);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rows.push([item]);
      }
    });

    return rows.map((row, rowIdx) =>
      row.map(item => ({ ...item, rowIdx }))
    ).flat();
  }, [items, startDate, endDate]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Milestone arc</CardTitle>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 border-r pr-4">
            <button
              onClick={() => setActiveFilters(new Set())}
              className={cn(
                "text-[10px] font-bold uppercase transition-colors",
                activeFilters.size === 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All
            </button>
            <button
              onClick={() => toggleFilter("milestone")}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase transition-all",
                activeFilters.has("milestone") ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Milestones
            </button>
            <button
              onClick={() => toggleFilter("keyresult")}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase transition-all",
                activeFilters.has("keyresult") ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              <span className="h-1.5 w-1.5 rotate-45 bg-current" />
              Key Results
            </button>
            <button
              onClick={() => toggleFilter("huddle")}
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase transition-all",
                activeFilters.has("huddle") ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:bg-muted/80"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              Huddles
            </button>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border border-foreground" /> Major
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 w-full rounded-md border bg-muted/20 pb-12 pt-8 px-8 overflow-hidden">
          {/* Quarters background */}
          <div className="absolute inset-x-0 bottom-0 flex h-10 border-t bg-muted/30">
            {getQuarterLabels(startDate, endDate).map((q, i) => (
              <div
                key={i}
                className="absolute flex flex-col items-center"
                style={{ left: `${q.percent}%`, transform: "translateX(-50%)" }}
              >
                <span className="text-[10px] font-bold text-muted-foreground pt-1">{q.label}</span>
                {q.yearLabel && <span className="text-[8px] uppercase tracking-tighter text-muted-foreground/60">{q.yearLabel}</span>}
                <div className="h-2 w-px bg-border" />
              </div>
            ))}
          </div>

          <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border/50" />

          {stackedItems.map((item) => {
            const percent = getTimelinePosition(item.date, startDate, endDate);
            const isSelected = selectedId === item.id;
            const isHovered = hoveredId === item.id;
            const isCompleted = item.status === "COMPLETED" || item.status === "ACHIEVED";

            const colorClass = isCompleted
              ? "bg-green-500"
              : item.status === "OFF_TRACK" || item.status === "RED"
                ? "bg-red-600"
                : item.status === "AT_RISK" || item.status === "YELLOW"
                  ? "bg-yellow-500"
                  : item.type === "huddle"
                    ? "bg-brand-sage border-brand-charcoal"
                    : item.type === "milestone"
                      ? (DEPARTMENT_COLORS[item.deptCode] ?? DEPARTMENT_COLORS.OTHER)
                      : "bg-emerald-500";

            const size = item.isMajor ? "h-5 w-5" : (item.type === "keyresult" || item.type === "huddle" ? "h-3 w-3" : "h-4 w-4");
            const shape = item.type === "keyresult" ? "rotate-45" : "rounded-full";

            // Vertical offset based on row index, centered around the middle line
            const rowCount = Math.max(...stackedItems.map(i => i.rowIdx ?? 0)) + 1;
            const verticalStep = 30;
            const totalHeight = (rowCount - 1) * verticalStep;
            const verticalOffset = (item.rowIdx ?? 0) * verticalStep - totalHeight / 2;

            const MarkerWrapper = ({ children }: { children: React.ReactNode }) => {
              if (item.type === "keyresult" && projectSlug) {
                return (
                  <a href={`/projects/${projectSlug}/pushes`} className="contents">
                    {children}
                  </a>
                );
              }
              return <div className="contents">{children}</div>;
            };

            return (
              <div
                key={item.id}
                data-testid="milestone-marker"
                className={cn(
                  "absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center transition-all z-10",
                  (isSelected || isHovered) && "z-40 scale-110"
                )}
                style={{
                  left: `${percent}%`,
                  top: `calc(50% + ${verticalOffset}px)`,
                }}
              >
                <MarkerWrapper>
                  <button
                    type="button"
                    onClick={() => item.type === "milestone" && onSelect?.(item.id)}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      "flex items-center justify-center border border-background shadow-sm transition-transform ring-offset-background",
                      colorClass,
                      size,
                      shape,
                      isSelected && "ring-2 ring-primary ring-offset-1 scale-125",
                      isHovered && "scale-125 border-primary"
                    )}
                  >
                    {isCompleted && (
                      <div className={item.type === "keyresult" ? "-rotate-45" : ""}>
                        <Check className="h-2 w-2 text-white" strokeWidth={5} />
                      </div>
                    )}
                  </button>
                </MarkerWrapper>
                {/* Dynamic tooltip positioning based on vertical offset */}
                <div className={cn(
                  "absolute left-1/2 -translate-x-1/2 pointer-events-none z-50 transition-opacity",
                  verticalOffset < 0 ? "top-full mt-2" : "bottom-full mb-2",
                  (isSelected || isHovered) ? "opacity-100" : "opacity-0"
                )}>
                  <div className={cn(
                    "max-w-[200px] min-w-[120px] rounded bg-background px-3 py-1.5 text-[10px] text-foreground shadow-lg border border-primary/20 flex flex-col items-center",
                    isCompleted && "text-muted-foreground"
                  )}>
                    <div className="font-bold border-b pb-1 mb-1 w-full text-center">
                      {new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(item.date)}
                    </div>
                    <div className={cn(
                      "text-center leading-tight px-1",
                      isCompleted && "line-through decoration-muted-foreground/30"
                    )}>
                      {item.title}
                    </div>
                    <div className="mt-1 text-[8px] uppercase tracking-wider text-muted-foreground opacity-70">
                      {item.type} • {item.status}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function departmentColorClasses() {
  return DEPARTMENT_COLORS;
}
