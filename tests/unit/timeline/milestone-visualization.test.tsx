import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { MilestoneArc } from "@/components/projects/timeline/MilestoneArc";
import { MilestoneDetailPanel } from "@/components/projects/timeline/MilestoneDetailPanel";
import { type MilestoneWithRelations } from "@/components/projects/timeline/ProjectTimelineView";

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");
  return {
    ...actual,
    useFormState: (action: unknown, initialState: unknown) => [initialState, vi.fn()]
  };
});

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock("@/app/projects/[projectSlug]/timeline/actions", () => ({
  deleteMilestone: vi.fn(),
  getMilestoneDeleteInitialState: () => ({ success: false }),
  upsertMilestone: vi.fn(),
  getMilestoneInitialState: () => ({ errors: {}, success: false })
}));

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  LEGISLATIVE: "bg-amber-500",
  LEGAL: "bg-indigo-500",
  REGULATORY: "bg-blue-500",
  COMMUNITY: "bg-emerald-500",
  INTERNAL: "bg-slate-500",
  OTHER: "bg-gray-500"
};

function buildMilestone(partial: Partial<MilestoneWithRelations>): MilestoneWithRelations {
  const base: MilestoneWithRelations = {
    id: "m-1",
    projectId: "p-1",
    title: "Sample milestone",
    description: "",
    date: new Date("2026-01-01"),
    isMajor: false,
    category: MilestoneCategory.OTHER,
    status: MilestoneStatus.PLANNED,
    leadDepartmentId: null,
    relatedObjectiveId: null,
    pushId: null,
    asanaTaskGid: null,
    leadDepartment: null,
    relatedObjective: null,
    push: null,
    activities: [],
    commsItems: [],
    pressureAssets: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  return { ...base, ...partial };
}

describe("MilestoneArc", () => {
  it("renders markers with major distinction and category color", () => {
    const milestones = [
      buildMilestone({ id: "a", title: "Kickoff", date: new Date("2025-01-01"), isMajor: true, category: MilestoneCategory.LEGISLATIVE }),
      buildMilestone({ id: "b", title: "Draft bill", date: new Date("2026-06-15"), category: MilestoneCategory.LEGAL }),
      buildMilestone({ id: "c", title: "Community forum", date: new Date("2027-03-20"), category: MilestoneCategory.COMMUNITY })
    ];

    render(
      <MilestoneArc
        milestones={milestones}
        startYear={2025}
        endYear={2027}
        selectedId={"a"}
        onSelect={() => {}}
        categoryColors={CATEGORY_COLORS}
      />
    );

    const markers = screen.getAllByTestId("milestone-marker");
    expect(markers).toHaveLength(3);
    expect(markers.find((marker) => marker.dataset.major === "true")).toBeTruthy();
    const legislativeMarker = markers.find((marker) => marker.dataset.category === MilestoneCategory.LEGISLATIVE);
    const colorTarget = legislativeMarker?.querySelector("div");
    expect(colorTarget?.className).toContain(CATEGORY_COLORS[MilestoneCategory.LEGISLATIVE]);
  });
});

describe("MilestoneDetailPanel", () => {
  it("shows linked information for a selected milestone", () => {
    const milestone = buildMilestone({
      title: "Adoption",
      date: new Date("2026-09-01"),
      leadDepartment: { id: "d-1", name: "Policy", code: "POL" },
      relatedObjective: { id: "o-1", title: "Win approval" },
      push: { id: "p-2", name: "Sprint 2", startDate: new Date("2026-05-01"), endDate: new Date("2026-07-01"), sequenceIndex: 2 },
      asanaTaskGid: "12345",
      activities: [{ id: "act-1", title: "Draft talking points", status: "IN_PROGRESS" }],
      commsItems: [
        {
          id: "comm-1",
          title: "Press release",
          type: "PRESS_RELEASE",
          status: "PLANNED",
          plannedDate: new Date("2026-08-15"),
          actualDate: null
        }
      ],
      pressureAssets: []
    });

    render(
      <MilestoneDetailPanel
        milestone={milestone}
        canEdit={false}
        slug="demo"
        departments={[]}
        objectives={[]}
        pushes={[]}
        categoryColors={CATEGORY_COLORS}
      />
    );

    expect(screen.getByText("Adoption")).toBeInTheDocument();
    expect(screen.getByText("POL – Policy")).toBeInTheDocument();
    expect(screen.getByText("Win approval")).toBeInTheDocument();
    expect(screen.getByText("Press release")).toBeInTheDocument();
    expect(screen.getByText("Open in Asana")).toBeInTheDocument();
  });
});
