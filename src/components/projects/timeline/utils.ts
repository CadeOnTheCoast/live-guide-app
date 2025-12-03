import { Prisma } from "@prisma/client";

export type MilestoneWithRelations = Prisma.MilestoneGetPayload<{
  include: {
    activities: true;
    commsItems: true;
    pressureAssets: true;
    relatedObjective: { select: { id: true; title: true } };
    leadDepartment: { select: { id: true; name: true; code: true } };
    push: { select: { id: true; name: true; startDate: true; endDate: true } };
  };
}>;

export function sortMilestonesByDate<T extends { date: Date }>(milestones: T[]): T[] {
  return [...milestones].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function filterMilestonesByYearRange<T extends { date: Date }>(
  milestones: T[],
  startYear: number,
  endYear: number
): T[] {
  return milestones.filter((milestone) => {
    const year = new Date(milestone.date).getFullYear();
    return year >= startYear && year <= endYear;
  });
}

export function getMilestoneYearBounds(milestones: { date: Date }[]): { startYear: number; endYear: number } {
  if (milestones.length === 0) {
    const currentYear = new Date().getFullYear();
    return { startYear: currentYear, endYear: currentYear };
  }

  const sorted = sortMilestonesByDate(milestones);
  return {
    startYear: new Date(sorted[0].date).getFullYear(),
    endYear: new Date(sorted[sorted.length - 1].date).getFullYear()
  };
}

export function getTimelinePosition(date: Date, startDate: Date, endDate: Date): number {
  const start = startDate.getTime();
  const end = endDate.getTime();
  if (start === end) return 0;
  const value = date.getTime();
  const ratio = (value - start) / (end - start);
  return Math.min(100, Math.max(0, ratio * 100));
}
