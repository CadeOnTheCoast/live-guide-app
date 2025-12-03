import { describe, expect, it } from "vitest";
import { filterMilestonesByYearRange, getYearRange } from "@/components/projects/timeline/utils";

const baseMilestone = {
  id: "1",
  date: new Date("2025-05-01"),
  title: "",
  projectId: "p",
  category: "OTHER",
  status: "PLANNED"
};

describe("milestone filtering", () => {
  it("sorts milestones chronologically", () => {
    const milestones = [
      { ...baseMilestone, id: "a", date: new Date("2026-03-01") },
      { ...baseMilestone, id: "b", date: new Date("2024-12-01") },
      { ...baseMilestone, id: "c", date: new Date("2025-07-01") }
    ];

    const result = filterMilestonesByYearRange(milestones, 2024, 2027);
    expect(result.map((m) => m.id)).toEqual(["b", "c", "a"]);
  });

  it("filters milestones to a single year", () => {
    const milestones = [
      { ...baseMilestone, id: "a", date: new Date("2026-01-10") },
      { ...baseMilestone, id: "b", date: new Date("2027-02-10") },
      { ...baseMilestone, id: "c", date: new Date("2026-11-10") }
    ];

    const result = filterMilestonesByYearRange(milestones, 2026, 2026);
    expect(result.map((m) => m.id)).toEqual(["a", "c"]);
  });

  it("handles ranges correctly", () => {
    const milestones = [
      { ...baseMilestone, id: "a", date: new Date("2025-01-01") },
      { ...baseMilestone, id: "b", date: new Date("2027-06-15") },
      { ...baseMilestone, id: "c", date: new Date("2028-03-20") }
    ];

    const result = filterMilestonesByYearRange(milestones, 2025, 2027);
    expect(result.map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("returns current year range when empty", () => {
    const range = getYearRange([]);
    const currentYear = new Date().getFullYear();
    expect(range).toEqual({ startYear: currentYear, endYear: currentYear });
  });
});
