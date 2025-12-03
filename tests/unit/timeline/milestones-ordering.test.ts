import { describe, expect, it } from "vitest";

import { filterMilestonesByYearRange, sortMilestonesByDate } from "@/components/projects/timeline/utils";

describe("Milestone ordering and filtering", () => {
  const milestones = [
    { id: "a", title: "Late", date: new Date("2027-05-01") },
    { id: "b", title: "Early", date: new Date("2025-01-15") },
    { id: "c", title: "Middle", date: new Date("2026-03-10") }
  ];

  it("sorts milestones by date ascending", () => {
    const sorted = sortMilestonesByDate(milestones);
    expect(sorted.map((m) => m.id)).toEqual(["b", "c", "a"]);
  });

  it("filters milestones by a single year", () => {
    const filtered = filterMilestonesByYearRange(milestones, 2026, 2026);
    expect(filtered.map((m) => m.id)).toEqual(["c"]);
  });

  it("filters milestones by a year range", () => {
    const filtered = filterMilestonesByYearRange(milestones, 2025, 2026);
    expect(filtered.map((m) => m.id)).toEqual(["b", "c"]);
  });
});
