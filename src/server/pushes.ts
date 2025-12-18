import { Push } from "@prisma/client";

function formatDateSegment(date: Date | string) {
  const parsed = new Date(date);
  return new Intl.DateTimeFormat("en", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit"
  }).format(parsed);
}

function formatShortDateUTC(date: Date): string {
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear() % 100;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return `${pad(month)}/${pad(day)}/${pad(year)}`;
}

export function formatPushName(push: {
  sequenceIndex: number;
  startDate: Date;
  endDate: Date;
}): string {
  return `Push ${push.sequenceIndex} - ${formatShortDateUTC(
    push.startDate,
  )} - ${formatShortDateUTC(push.endDate)}`;
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
