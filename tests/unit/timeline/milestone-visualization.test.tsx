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

describe("Milestone visualization", () => {
  it("renders one marker per milestone with major styling", () => {
    render(
      <MilestoneArc
        milestones={[
          baseMilestone,
          { ...baseMilestone, id: "2", isMajor: false, category: MilestoneCategory.COMMUNITY, date: new Date("2026-06-01") },
          { ...baseMilestone, id: "3", isMajor: false, category: MilestoneCategory.INTERNAL, date: new Date("2027-01-10") }
        ]}
        startDate={new Date("2026-01-01")}
        endDate={new Date("2027-12-31")}
      />
    );

    const markers = screen.getAllByTestId("milestone-marker");
    expect(markers).toHaveLength(3);
    expect(markers[0].querySelector("span")?.className).toContain("h-4");
    expect(markers[1].querySelector("span")?.className).toContain("bg-amber-500");
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
