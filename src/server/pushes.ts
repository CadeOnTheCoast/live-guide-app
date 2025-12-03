import { Push } from "@prisma/client";

function formatDateSegment(date: Date | string) {
  const parsed = new Date(date);
  return new Intl.DateTimeFormat("en", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit"
  }).format(parsed);
}

export function formatPushName({
  sequenceIndex,
  startDate,
  endDate
}: Pick<Push, "sequenceIndex" | "startDate" | "endDate">) {
  const start = formatDateSegment(startDate);
  const end = formatDateSegment(endDate);
  return `Push ${sequenceIndex} - ${start} - ${end}`;
}

export function getCurrentPushForProject(pushes: Push[]) {
  const today = new Date();
  const candidates = pushes
    .filter((push) => push.startDate <= today && push.endDate >= today)
    .sort((a, b) => {
      if (a.startDate.getTime() === b.startDate.getTime()) {
        return b.sequenceIndex - a.sequenceIndex;
      }
      return b.startDate.getTime() - a.startDate.getTime();
    });

  return candidates[0] ?? null;
}
