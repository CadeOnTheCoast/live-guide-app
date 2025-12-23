import { render, screen } from "@testing-library/react";
import { ActivityStatus, CommsItemStatus, CommsItemType, MilestoneCategory, MilestoneStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { MilestoneArc } from "@/components/projects/timeline/MilestoneArc";
import { MilestoneDetailPanel } from "@/components/projects/timeline/MilestoneDetailPanel";
import { MilestoneWithRelations } from "@/components/projects/timeline/utils";

const baseMilestone: MilestoneWithRelations = {
  id: "1",
  projectId: "p",
  title: "Kickoff",
  description: "",
  date: new Date("2026-01-01"),
  isMajor: true,
  category: MilestoneCategory.LEGISLATIVE,
  status: MilestoneStatus.PLANNED,
  leadDepartmentId: null,
  relatedObjectiveId: null,
  pushId: null,
  asanaTaskGid: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  activities: [],
  commsItems: [],
  pressureAssets: [],
  relatedObjective: null,
  leadDepartment: null,
  push: null
};

const mockKeyResults = [
  { id: "kr1", code: "KR1", title: "Key Result 1", date: new Date("2026-06-01"), departmentId: "d1" }
];

describe("Milestone visualization", () => {
  it("renders one marker per milestone with major styling", () => {
    render(
      <MilestoneArc
        milestones={[
          { ...baseMilestone, leadDepartment: { id: "d1", name: "Gov Affairs", code: "GA" }, date: new Date("2026-01-01") },
          { ...baseMilestone, id: "2", isMajor: false, leadDepartment: { id: "d2", name: "Communications", code: "COMMS" }, date: new Date("2026-03-01") },
          { ...baseMilestone, id: "3", isMajor: false, category: MilestoneCategory.INTERNAL, date: new Date("2027-01-10") }
        ]}
        keyResults={mockKeyResults}
        startDate={new Date("2026-01-01")}
        endDate={new Date("2027-12-31")}
      />
    );

    const markers = screen.getAllByTestId("milestone-marker");
    expect(markers).toHaveLength(4);

    // Items are sorted by date: 
    // 1. Kickoff (2026-01-01) - Major
    // 2. KR (2026-06-01)
    // 3. Milestone 2 (2026-06-01) - bg-amber-500
    // 4. Milestone 3 (2027-01-10)

    expect(markers[0].querySelector("button")?.className).toContain("h-5"); // Major
    expect(markers[1].querySelector("button")?.className).toContain("bg-amber-500"); // COMMS
  });

  it("shows detail panel content for a selected milestone", () => {
    const milestone = {
      ...baseMilestone,
      title: "Review",
      leadDepartment: { id: "d1", name: "Delivery", code: "DEL" },
      activities: [
        {
          id: "a1",
          projectId: "p",
          pushId: "push1",
          title: "Prep",
          description: null,
          startDate: null,
          dueDate: null,
          status: ActivityStatus.NOT_STARTED,
          ownerId: null,
          departmentId: null,
          relatedKrId: null,
          relatedMilestoneId: "1",
          asanaTaskGid: null,
          asanaSectionGid: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      commsItems: [
        {
          id: "c1",
          projectId: "p",
          title: "Launch",
          type: CommsItemType.PRESS_RELEASE,
          plannedDate: null,
          actualDate: null,
          status: CommsItemStatus.PLANNED,
          notes: null,
          linkUrl: null,
          ownerId: null,
          relatedMilestoneId: "1",
          relatedPushId: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      pressureAssets: []
    } satisfies MilestoneWithRelations;

    render(
      <MilestoneDetailPanel
        milestone={milestone}
        canEdit={false}
        onEdit={() => undefined}
        onDelete={() => undefined}
      />
    );

    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText(/DEL/)).toBeInTheDocument();
    expect(screen.getByText(/Prep/)).toBeInTheDocument();
    expect(screen.getByText(/Launch/)).toBeInTheDocument();
  });
});
