import { describe, expect, it } from "vitest";
import { formatPushName } from "@/server/pushes";

describe("formatPushName", () => {
  it("builds a push name from sequence and dates", () => {
    const name = formatPushName({
      sequenceIndex: 2,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-02-01")
    });

    expect(name).toBe("Push 2 - 12/01/25 - 02/01/26");
  });
});
