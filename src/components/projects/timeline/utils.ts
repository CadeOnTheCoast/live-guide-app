import { Milestone } from "@prisma/client";

export function toDateInputValue(date?: Date | string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function formatDisplayDate(date?: Date | string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  return isNaN(parsed.getTime()) ? "—" : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(parsed);
}

export type MilestoneLike = Pick<Milestone, "date"> & { id: string };

export function getYearRange(milestones: MilestoneLike[]) {
  if (!milestones.length) {
    const currentYear = new Date().getFullYear();
    return { startYear: currentYear, endYear: currentYear };
  }

  const years = milestones.map((milestone) => new Date(milestone.date).getFullYear());
  return {
    startYear: Math.min(...years),
    endYear: Math.max(...years)
  };
}

export function filterMilestonesByYearRange<T extends MilestoneLike>(milestones: T[], startYear: number, endYear: number) {
  const filtered = milestones.filter((milestone) => {
    const year = new Date(milestone.date).getFullYear();
    return year >= startYear && year <= endYear;
  });

  return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function calculatePositionPercent(date: Date | string, startYear: number, endYear: number) {
  const startDate = new Date(startYear, 0, 1);
  const endDate = new Date(endYear, 11, 31, 23, 59, 59);
  const total = endDate.getTime() - startDate.getTime();

  if (total <= 0) return 0;

  const target = new Date(date).getTime();
  const clamped = Math.min(Math.max(target, startDate.getTime()), endDate.getTime());
  return ((clamped - startDate.getTime()) / total) * 100;
}
